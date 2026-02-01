import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

type Ctx = QueryCtx | MutationCtx;

async function getUserProfile(ctx: Ctx, userId: string) {
  return await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

async function requireModOrAdmin(ctx: Ctx) {
  const identity = await requireAuth(ctx);
  const profile = await getUserProfile(ctx, identity.subject);

  if (!profile || !["moderator", "admin"].includes(profile.role)) {
    throw new Error("Unauthorized");
  }

  return { identity, profile };
}

export const checkUserRole = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { isAdmin: false, isModerator: false };
    }

    const profile = await getUserProfile(ctx, identity.subject);
    if (!profile) {
      return { isAdmin: false, isModerator: false, userEmail: identity.email };
    }

    const isAdmin = profile.role === "admin";
    const isModerator = profile.role === "moderator" || isAdmin;

    return {
      isAdmin,
      isModerator,
      userEmail: identity.email,
      role: profile.role,
    };
  },
});

export const getPendingJobs = query({
  args: {},
  handler: async (ctx) => {
    await requireModOrAdmin(ctx);

    const jobs = await ctx.db
      .query("jobs")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc")
      .collect();

    return jobs.map((job) => ({
      id: job._id,
      createdAt: job._creationTime,
      title: job.title,
      company: job.company,
      location: job.location ?? "",
      url: job.url ?? "",
      status: job.status,
      tags: job.tags ?? [],
    }));
  },
});

export const getPendingJobsCount = query({
  args: {},
  handler: async (ctx) => {
    await requireModOrAdmin(ctx);

    const jobs = await ctx.db
      .query("jobs")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return jobs.length;
  },
});

export const updateJobStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    await requireModOrAdmin(ctx);

    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    await ctx.db.patch(job._id, { status: args.status });
    return { success: true };
  },
});
