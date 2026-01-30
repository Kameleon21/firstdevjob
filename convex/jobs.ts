import { query } from "./_generated/server";
import { v } from "convex/values";

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
