import { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Get the current user identity or throw if not authenticated.
 * Use in mutations/queries that require authentication.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

/**
 * Get the current user identity or return null.
 * Use when authentication is optional.
 */
export async function getAuth(ctx: QueryCtx | MutationCtx) {
  return await ctx.auth.getUserIdentity();
}
