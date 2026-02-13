import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { buildJobSnapshot } from "./jobHelpers";
import {
  appendStatusHistory,
  canTransitionApplicationStatus,
  isNotesLengthValid,
  MAX_NOTES_LENGTH,
  normalizeNotes,
  type ApplicationStatus,
} from "./applicationIntegrity";

const applicationStatus = v.union(
  v.literal("saved"),
  v.literal("applied"),
  v.literal("interviewing"),
  v.literal("offer"),
  v.literal("rejected"),
  v.literal("accepted"),
);

export const toggleBookmark = mutation({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    const existing = await ctx.db
      .query("trackedApplications")
      .withIndex("by_userId_jobId", (q) =>
        q.eq("userId", identity.subject).eq("jobId", args.jobId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { bookmarked: false };
    }

    await ctx.db.insert("trackedApplications", {
      userId: identity.subject,
      jobId: args.jobId,
      jobSnapshot: buildJobSnapshot(job),
      status: "saved",
      statusHistory: [
        {
          toStatus: "saved",
          changedAt: Date.now(),
        },
      ],
    });

    return { bookmarked: true };
  },
});

export const removeTrackedApplication = mutation({
  args: {
    bookmarkId: v.id("trackedApplications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const bookmark = await ctx.db.get(args.bookmarkId);
    if (!bookmark) {
      throw new Error("Bookmark not found");
    }

    if (bookmark.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(bookmark._id);
    return { success: true };
  },
});

export const updateBookmarkStatus = mutation({
  args: {
    bookmarkId: v.id("trackedApplications"),
    status: applicationStatus,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const bookmark = await ctx.db.get(args.bookmarkId);
    if (!bookmark) {
      throw new Error("Bookmark not found");
    }

    if (bookmark.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    if (
      bookmark.status !== args.status &&
      !canTransitionApplicationStatus(bookmark.status, args.status)
    ) {
      throw new Error(
        `Invalid status transition from ${bookmark.status} to ${args.status}.`,
      );
    }

    const patch: {
      status: typeof args.status;
      notes?: string;
      statusHistory?: Array<{
        fromStatus?: ApplicationStatus;
        toStatus: ApplicationStatus;
        changedAt: number;
      }>;
    } = {
      status: args.status,
    };

    if (args.notes !== undefined) {
      const normalized = normalizeNotes(args.notes);
      if (!isNotesLengthValid(normalized)) {
        throw new Error(
          `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.`,
        );
      }
      patch.notes = normalized;
    }

    if (bookmark.status !== args.status) {
      patch.statusHistory = appendStatusHistory({
        currentStatus: bookmark.status,
        nextStatus: args.status,
        history: bookmark.statusHistory,
        now: Date.now(),
      });
    }

    await ctx.db.patch(bookmark._id, patch);
    return { success: true };
  },
});

export const getBookmarkStatus = query({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { bookmarked: false };
    }

    const existing = await ctx.db
      .query("trackedApplications")
      .withIndex("by_userId_jobId", (q) =>
        q.eq("userId", identity.subject).eq("jobId", args.jobId),
      )
      .unique();

    return { bookmarked: !!existing };
  },
});

export const getUserBookmarks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const bookmarks = await ctx.db
      .query("trackedApplications")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    if (bookmarks.length === 0) {
      return [];
    }

    const results = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const job = await ctx.db.get(bookmark.jobId);

        if (job) {
          const isClosed = job.status === "outdated";
          return {
            id: bookmark._id,
            status: bookmark.status,
            notes: bookmark.notes ?? null,
            job: {
              id: job._id,
              title: job.title,
              company: job.company,
              location: job.location ?? "",
              url: job.url ?? "",
              createdAt: job._creationTime,
              tags: job.tags ?? [],
              roleLevel: job.roleLevel,
              availability: isClosed ? "closed" : "active",
              closureReason: isClosed ? "outdated" : null,
            },
          };
        }

        if (!bookmark.jobSnapshot) {
          return null;
        }

        return {
          id: bookmark._id,
          status: bookmark.status,
          notes: bookmark.notes ?? null,
          job: {
            id: bookmark.jobId,
            title: bookmark.jobSnapshot.title,
            company: bookmark.jobSnapshot.company,
            location: bookmark.jobSnapshot.location,
            url: bookmark.jobSnapshot.url,
            createdAt: bookmark.jobSnapshot.createdAt,
            tags: bookmark.jobSnapshot.tags,
            roleLevel: bookmark.jobSnapshot.roleLevel,
            availability: "closed",
            closureReason: "removed",
          },
        };
      }),
    );

    return results.filter(Boolean);
  },
});

export const backfillTrackedApplicationSnapshots = internalMutation({
  args: {},
  handler: async (ctx) => {
    const trackedApplications = await ctx.db
      .query("trackedApplications")
      .collect();
    let updatedCount = 0;

    for (const trackedApplication of trackedApplications) {
      if (trackedApplication.jobSnapshot) {
        continue;
      }

      const job = await ctx.db.get(trackedApplication.jobId);
      if (!job) {
        continue;
      }

      await ctx.db.patch(trackedApplication._id, {
        jobSnapshot: buildJobSnapshot(job),
      });
      updatedCount++;
    }

    return { updatedCount };
  },
});
