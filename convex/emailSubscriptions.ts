import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

const roleLevelValidator = v.union(
  v.literal("intern"),
  v.literal("graduate"),
  v.literal("earlyCareer"),
);

function normalizeRoleFilters(roleFilters: Array<"intern" | "graduate" | "earlyCareer">) {
  return Array.from(new Set(roleFilters));
}

function requireIdentityEmail(email: string | undefined | null) {
  const trimmedEmail = email?.trim();
  if (!trimmedEmail) {
    throw new Error("Email address is required to manage notifications");
  }
  return trimmedEmail;
}

export const getMySubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const subscription = await ctx.db
      .query("emailSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!subscription) {
      return null;
    }

    return {
      isActive: subscription.isActive,
      roleFilters: subscription.roleFilters,
    };
  },
});

export const subscribe = mutation({
  args: {
    roleFilters: v.array(roleLevelValidator),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const email = requireIdentityEmail(identity.email);
    const roleFilters = normalizeRoleFilters(args.roleFilters);
    const subscription = await ctx.db
      .query("emailSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (subscription) {
      // Keep the existing token so unsubscribe links already in inboxes stay valid.
      await ctx.db.patch(subscription._id, { email, isActive: true, roleFilters });
    } else {
      await ctx.db.insert("emailSubscriptions", {
        userId: identity.subject,
        email,
        unsubscribeToken: crypto.randomUUID(),
        isActive: true,
        roleFilters,
      });
    }

    return {
      success: true,
      isActive: true,
      roleFilters,
    };
  },
});

export const updateRoleFilters = mutation({
  args: {
    roleFilters: v.array(roleLevelValidator),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const subscription = await ctx.db
      .query("emailSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const roleFilters = normalizeRoleFilters(args.roleFilters);
    await ctx.db.patch(subscription._id, { roleFilters });

    return { success: true, roleFilters };
  },
});

export const unsubscribeFromProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx);
    const subscription = await ctx.db
      .query("emailSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!subscription) {
      return { success: true };
    }

    await ctx.db.patch(subscription._id, { isActive: false });
    return { success: true };
  },
});

export const unsubscribeByToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const token = args.token.trim();
    if (!token) {
      return { success: false };
    }

    const subscription = await ctx.db
      .query("emailSubscriptions")
      .withIndex("by_unsubscribeToken", (q) => q.eq("unsubscribeToken", token))
      .unique();

    if (!subscription) {
      return { success: false };
    }

    if (subscription.isActive) {
      await ctx.db.patch(subscription._id, { isActive: false });
    }

    return { success: true };
  },
});

export const getActiveSubscribersForRole = internalQuery({
  args: {
    roleLevel: v.optional(roleLevelValidator),
  },
  handler: async (ctx, args) => {
    const activeSubscriptions = await ctx.db
      .query("emailSubscriptions")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const { roleLevel } = args;

    const matchingSubscriptions = roleLevel
      ? activeSubscriptions.filter(
          (subscription) =>
            subscription.roleFilters.length === 0 || subscription.roleFilters.includes(roleLevel),
        )
      : activeSubscriptions;

    return matchingSubscriptions.map((subscription) => ({
      userId: subscription.userId,
      email: subscription.email,
      unsubscribeToken: subscription.unsubscribeToken,
    }));
  },
});
