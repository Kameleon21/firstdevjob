import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { error: "Not authenticated" };
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!profile) {
      return { error: "Profile not found" };
    }

    return {
      id: identity.subject,
      email: identity.email,
      fullName: profile.fullName ?? null,
      role: profile.role,
    };
  },
});

export const updateUserName = mutation({
  args: {
    fullName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    const trimmedName = args.fullName.trim();
    if (!trimmedName) {
      return { error: "Name is required" };
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!profile) {
      return { error: "Profile not found" };
    }

    await ctx.db.patch(profile._id, { fullName: trimmedName });
    return { success: true };
  },
});

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx);

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    const trackedApplications = await ctx.db
      .query("trackedApplications")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    await Promise.all(
      trackedApplications.map((record) => ctx.db.delete(record._id)),
    );

    let deletedProfile = false;
    if (profile) {
      await ctx.db.delete(profile._id);
      deletedProfile = true;
    }

    return {
      success: true,
      deletedTrackedApplicationsCount: trackedApplications.length,
      deletedProfile,
    };
  },
});
