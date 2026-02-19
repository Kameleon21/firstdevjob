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

    const emailSubscription = await ctx.db
      .query("emailSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    const notificationDeliveries = await ctx.db
      .query("jobNotificationDeliveries")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .collect();

    await Promise.all(trackedApplications.map((record) => ctx.db.delete(record._id)));

    await Promise.all(notificationDeliveries.map((delivery) => ctx.db.delete(delivery._id)));

    let deletedEmailSubscription = false;
    if (emailSubscription) {
      await ctx.db.delete(emailSubscription._id);
      deletedEmailSubscription = true;
    }

    let deletedProfile = false;
    if (profile) {
      await ctx.db.delete(profile._id);
      deletedProfile = true;
    }

    return {
      success: true,
      deletedTrackedApplicationsCount: trackedApplications.length,
      deletedNotificationDeliveriesCount: notificationDeliveries.length,
      deletedEmailSubscription,
      deletedProfile,
    };
  },
});
