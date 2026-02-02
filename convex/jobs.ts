import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

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
            q.eq(q.field("status"), "rejected")
          )
        )
      )
      .collect();

    for (const job of oldNonApprovedJobs) {
      // Delete related bookmarks first
      const bookmarks = await ctx.db
        .query("trackedApplications")
        .filter((q) => q.eq(q.field("jobId"), job._id))
        .collect();

      for (const bookmark of bookmarks) {
        await ctx.db.delete(bookmark._id);
      }

      await ctx.db.delete(job._id);
      deletedCount++;
    }

    // 2. Soft delete: Mark approved jobs as "outdated" after 2 weeks
    const oldApprovedJobs = await ctx.db
      .query("jobs")
      .filter((q) =>
        q.and(
          q.lt(q.field("_creationTime"), twoWeeksAgo),
          q.eq(q.field("status"), "approved")
        )
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
          q.eq(q.field("status"), "outdated")
        )
      )
      .collect();

    for (const job of oldOutdatedJobs) {
      // Delete related bookmarks first
      const bookmarks = await ctx.db
        .query("trackedApplications")
        .filter((q) => q.eq(q.field("jobId"), job._id))
        .collect();

      for (const bookmark of bookmarks) {
        await ctx.db.delete(bookmark._id);
      }

      await ctx.db.delete(job._id);
      deletedCount++;
    }

    return { deletedCount, markedOutdatedCount };
  },
});

export const listApprovedJobs = query({
  args: {
    searchTerm: v.optional(v.string()),
    selectedTags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let jobs = await ctx.db
      .query("jobs")
      .filter((q) => q.eq(q.field("status"), "approved"))
      .order("desc")
      .collect();

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

    if (args.selectedTags && args.selectedTags.length > 0) {
      jobs = jobs.filter((job) =>
        args.selectedTags!.some((tag) => job.tags?.includes(tag)),
      );
    }

    return jobs;
  },
});

export const postJob = mutation({
  args: {
    title: v.string(),
    company: v.string(),
    location: v.string(),
    url: v.string(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const title = args.title.trim();
    const company = args.company.trim();
    const location = args.location.trim();
    const url = args.url.trim();

    if (!title || !company || !location || !url) {
      throw new Error("All fields are required");
    }

    try {
      new URL(url);
    } catch {
      throw new Error("Please enter a valid URL");
    }

    const jobId = await ctx.db.insert("jobs", {
      title,
      company,
      location,
      url,
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
