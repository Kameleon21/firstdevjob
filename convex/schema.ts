import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    userId: v.string(),
    fullName: v.optional(v.string()),
    role: v.union(
      v.literal("user"),
      v.literal("moderator"),
      v.literal("admin"),
    ),
  }).index("by_userId", ["userId"]),

  jobs: defineTable({
    title: v.string(),
    company: v.string(),
    location: v.optional(v.string()),
    url: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    tags: v.optional(v.array(v.string())),
  }),

  tags: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  trackedApplications: defineTable({
    userId: v.string(),
    jobId: v.id("jobs"),
    status: v.union(
      v.literal("saved"),
      v.literal("applied"),
      v.literal("interviewing"),
      v.literal("offer"),
      v.literal("rejected"),
      v.literal("accepted"),
    ),
    notes: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_jobId", ["userId", "jobId"]),
});
