import { query, mutation } from "./_generated/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    return {
      id: identity.subject,
      email: identity.email,
      profile,
    };
  },
});

export const ensureProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (existingProfile) {
      return existingProfile;
    }

    // Create new profile for first-time user
    const profileId = await ctx.db.insert("profiles", {
      userId: identity.subject,
      fullName: identity.name || undefined,
      role: "user",
    });

    return await ctx.db.get(profileId);
  },
});
