import {
  query,
  mutation,
  internalMutation,
  type MutationCtx,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { inferRoleLevelFromTitle } from "./jobHelpers";
import { requireAuth } from "./auth";
import { validateAndNormalizeJobSubmission } from "./jobSubmissionSecurity";

const roleLevelValidator = v.union(
  v.literal("intern"),
  v.literal("graduate"),
  v.literal("earlyCareer"),
);

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const MAX_SUBMISSIONS_PER_HOUR = 6;
const MAX_SUBMISSIONS_PER_DAY = 20;

const CLEANUP_BATCH_SIZE = 100;
const UNAPPROVED_RETENTION_MS = 14 * ONE_DAY_MS;
const APPROVED_ACTIVE_MS = 14 * ONE_DAY_MS;
const OUTDATED_RETENTION_MS = 30 * ONE_DAY_MS;

type JobStatus = Doc<"jobs">["status"];

async function findStaleJobs(
  ctx: MutationCtx,
  status: JobStatus,
  createdBefore: number,
) {
  return ctx.db
    .query("jobs")
    .withIndex("by_status", (q) =>
      q.eq("status", status).lt("_creationTime", createdBefore),
    )
    .take(CLEANUP_BATCH_SIZE);
}

async function deleteJobWithRelatedRecords(ctx: MutationCtx, jobId: Id<"jobs">) {
  const deliveries = await ctx.db
    .query("jobNotificationDeliveries")
    .withIndex("by_jobId_userId", (q) => q.eq("jobId", jobId))
    .collect();
  await Promise.all(deliveries.map((delivery) => ctx.db.delete(delivery._id)));
  await ctx.db.delete(jobId);
}

export const deleteOldJobs = internalMutation({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ deletedCount: number; markedOutdatedCount: number }> => {
    const now = Date.now();
    let deletedCount = 0;
    let markedOutdatedCount = 0;

    // Each step is capped so the transaction stays within Convex limits;
    // when a cap is hit the mutation reschedules itself to finish the backlog.
    const stalePending = await findStaleJobs(
      ctx,
      "pending",
      now - UNAPPROVED_RETENTION_MS,
    );
    const staleRejected = await findStaleJobs(
      ctx,
      "rejected",
      now - UNAPPROVED_RETENTION_MS,
    );
    for (const job of [...stalePending, ...staleRejected]) {
      await deleteJobWithRelatedRecords(ctx, job._id);
      deletedCount++;
    }

    // Delete expired outdated jobs before marking new ones, so a job is never
    // marked outdated and hard-deleted in the same run.
    const expiredOutdated = await findStaleJobs(
      ctx,
      "outdated",
      now - OUTDATED_RETENTION_MS,
    );
    for (const job of expiredOutdated) {
      await deleteJobWithRelatedRecords(ctx, job._id);
      deletedCount++;
    }

    const staleApproved = await findStaleJobs(
      ctx,
      "approved",
      now - APPROVED_ACTIVE_MS,
    );
    for (const job of staleApproved) {
      await ctx.db.patch(job._id, { status: "outdated" });
      markedOutdatedCount++;
    }

    const hitBatchLimit = [
      stalePending,
      staleRejected,
      expiredOutdated,
      staleApproved,
    ].some((batch) => batch.length === CLEANUP_BATCH_SIZE);
    if (hitBatchLimit) {
      await ctx.scheduler.runAfter(0, internal.jobs.deleteOldJobs, {});
    }

    return { deletedCount, markedOutdatedCount };
  },
});

export const listApprovedJobs = query({
  args: {
    searchTerm: v.optional(v.string()),
    roleLevel: v.optional(roleLevelValidator),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const trimmedLocation = args.location?.trim();
    let jobs;

    if (args.roleLevel && trimmedLocation) {
      jobs = await ctx.db
        .query("jobs")
        .withIndex("by_status_roleLevel_location", (q) =>
          q
            .eq("status", "approved")
            .eq("roleLevel", args.roleLevel)
            .eq("location", trimmedLocation),
        )
        .order("desc")
        .collect();
    } else if (args.roleLevel) {
      jobs = await ctx.db
        .query("jobs")
        .withIndex("by_status_roleLevel", (q) =>
          q.eq("status", "approved").eq("roleLevel", args.roleLevel),
        )
        .order("desc")
        .collect();
    } else if (trimmedLocation) {
      jobs = await ctx.db
        .query("jobs")
        .withIndex("by_status_location", (q) =>
          q.eq("status", "approved").eq("location", trimmedLocation),
        )
        .order("desc")
        .collect();
    } else {
      jobs = await ctx.db
        .query("jobs")
        .withIndex("by_status", (q) => q.eq("status", "approved"))
        .order("desc")
        .collect();
    }

    const trimmedSearch = args.searchTerm?.trim();
    if (trimmedSearch) {
      const term = trimmedSearch.toLowerCase();
      jobs = jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(term) ||
          job.company.toLowerCase().includes(term) ||
          (job.location?.toLowerCase().includes(term) ?? false),
      );
    }

    const identity = await ctx.auth.getUserIdentity();
    let bookmarkedJobIds = new Set();

    if (identity) {
      const trackedApplications = await ctx.db
        .query("trackedApplications")
        .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
        .collect();
      bookmarkedJobIds = new Set(
        trackedApplications.map((application) => application.jobId),
      );
    }

    return jobs.map((job) => ({
      _id: job._id,
      _creationTime: job._creationTime,
      title: job.title,
      company: job.company,
      location: job.location ?? "",
      url: job.url ?? "",
      status: job.status,
      tags: job.tags ?? [],
      roleLevel: job.roleLevel,
      isBookmarked: bookmarkedJobIds.has(job._id),
    }));
  },
});

export const getApprovedJobFilterOptions = query({
  args: {},
  handler: async (ctx) => {
    const approvedJobs = await ctx.db
      .query("jobs")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();

    const locations = Array.from(
      new Set(
        approvedJobs
          .map((job) => job.location?.trim())
          .filter((location): location is string => !!location),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return { locations };
  },
});

export const postJob = mutation({
  args: {
    title: v.string(),
    company: v.string(),
    location: v.string(),
    url: v.string(),
    roleLevel: roleLevelValidator,
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const normalizedSubmission = validateAndNormalizeJobSubmission({
      title: args.title,
      company: args.company,
      location: args.location,
      url: args.url,
      tags: args.tags,
    });
    const { title, company, location, normalizedUrl, tags } =
      normalizedSubmission;

    const now = Date.now();
    const submitterUserId = identity.subject;

    const submitterJobs = await ctx.db
      .query("jobs")
      .withIndex("by_submitterUserId", (q) =>
        q.eq("submitterUserId", submitterUserId),
      )
      .collect();

    const submissionsInHour = submitterJobs.filter(
      (job) => job._creationTime >= now - ONE_HOUR_MS,
    ).length;
    const submissionsInDay = submitterJobs.filter(
      (job) => job._creationTime >= now - ONE_DAY_MS,
    ).length;

    if (submissionsInHour >= MAX_SUBMISSIONS_PER_HOUR) {
      throw new Error(
        "Rate limit reached. Please wait before submitting another job.",
      );
    }

    if (submissionsInDay >= MAX_SUBMISSIONS_PER_DAY) {
      throw new Error(
        "Daily submission limit reached. Please try again tomorrow.",
      );
    }

    const jobId = await ctx.db.insert("jobs", {
      title,
      company,
      location,
      url: normalizedUrl,
      roleLevel: args.roleLevel,
      status: "pending",
      tags: tags.length ? tags : undefined,
      submitterUserId,
    });

    if (tags.length > 0) {
      for (const tagName of tags) {
        const existing = await ctx.db
          .query("tags")
          .withIndex("by_name", (q) => q.eq("name", tagName))
          .unique();

        if (!existing) {
          await ctx.db.insert("tags", { name: tagName });
        }
      }
    }

    try {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.sendNewSubmissionStaffEmail,
        { jobId },
      );
    } catch (error) {
      console.error("Failed to schedule staff submission notification", {
        jobId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return {
      success: true,
      jobId,
      message:
        "Thank you for your submission! Your job posting will be reviewed and added to the community within 24 hours if it's a good fit for our developers.",
    };
  },
});

export const backfillJobRoleLevelsFromTitle = internalMutation({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.db.query("jobs").collect();
    let updatedCount = 0;

    for (const job of jobs) {
      if (job.roleLevel) {
        continue;
      }

      const inferredRoleLevel = inferRoleLevelFromTitle(job.title);
      await ctx.db.patch(job._id, { roleLevel: inferredRoleLevel });
      updatedCount++;
    }

    return { updatedCount };
  },
});
