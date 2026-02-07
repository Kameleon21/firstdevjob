import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { inferRoleLevelFromTitle } from "./jobHelpers";

const roleLevelValidator = v.union(
  v.literal("intern"),
  v.literal("graduate"),
  v.literal("earlyCareer"),
);

export const deleteOldJobs = internalMutation({
  handler: async (ctx) => {
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    let deletedCount = 0;
    let markedOutdatedCount = 0;

    // 1. Hard delete old pending/rejected jobs (older than 2 weeks)
    const oldNonApprovedJobs = await ctx.db
      .query("jobs")
      .filter((q) =>
        q.and(
          q.lt(q.field("_creationTime"), twoWeeksAgo),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "rejected"),
          ),
        ),
      )
      .collect();

    for (const job of oldNonApprovedJobs) {
      await ctx.db.delete(job._id);
      deletedCount++;
    }

    // 2. Soft delete: Mark approved jobs as "outdated" after 2 weeks
    const oldApprovedJobs = await ctx.db
      .query("jobs")
      .filter((q) =>
        q.and(
          q.lt(q.field("_creationTime"), twoWeeksAgo),
          q.eq(q.field("status"), "approved"),
        ),
      )
      .collect();

    for (const job of oldApprovedJobs) {
      await ctx.db.patch(job._id, { status: "outdated" });
      markedOutdatedCount++;
    }

    // 3. Hard delete outdated jobs after 30 days (extended retention)
    const oldOutdatedJobs = await ctx.db
      .query("jobs")
      .filter((q) =>
        q.and(
          q.lt(q.field("_creationTime"), thirtyDaysAgo),
          q.eq(q.field("status"), "outdated"),
        ),
      )
      .collect();

    for (const job of oldOutdatedJobs) {
      await ctx.db.delete(job._id);
      deletedCount++;
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
    const title = args.title.trim();
    const company = args.company.trim();
    const location = args.location.trim();
    const rawUrl = args.url.trim();

    if (!title || !company || !location || !rawUrl) {
      throw new Error("All fields are required");
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      throw new Error("Please enter a valid URL");
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("URL must start with http:// or https://");
    }

    const jobId = await ctx.db.insert("jobs", {
      title,
      company,
      location,
      url: parsedUrl.toString(),
      roleLevel: args.roleLevel,
      status: "pending",
      tags: args.tags?.length ? args.tags : undefined,
    });

    if (args.tags && args.tags.length > 0) {
      for (const tagName of args.tags) {
        const existing = await ctx.db
          .query("tags")
          .withIndex("by_name", (q) => q.eq("name", tagName))
          .unique();

        if (!existing) {
          await ctx.db.insert("tags", { name: tagName });
        }
      }
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
