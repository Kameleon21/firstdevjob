import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const roleLevelValidator = v.union(
  v.literal("intern"),
  v.literal("graduate"),
  v.literal("earlyCareer"),
);

const applicationStatusValidator = v.union(
  v.literal("saved"),
  v.literal("applied"),
  v.literal("interviewing"),
  v.literal("offer"),
  v.literal("rejected"),
  v.literal("accepted"),
);

export default defineSchema({
  profiles: defineTable({
    userId: v.string(),
    fullName: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("moderator"), v.literal("admin")),
  }).index("by_userId", ["userId"]),

  jobs: defineTable({
    title: v.string(),
    company: v.string(),
    location: v.optional(v.string()),
    url: v.optional(v.string()),
    roleLevel: v.optional(roleLevelValidator),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("outdated"),
    ),
    tags: v.optional(v.array(v.string())),
    submitterUserId: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_submitterUserId", ["submitterUserId"])
    .index("by_status_roleLevel", ["status", "roleLevel"])
    .index("by_status_location", ["status", "location"])
    .index("by_status_roleLevel_location", ["status", "roleLevel", "location"]),

  tags: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  trackedApplications: defineTable({
    userId: v.string(),
    jobId: v.id("jobs"),
    jobSnapshot: v.optional(
      v.object({
        title: v.string(),
        company: v.string(),
        location: v.string(),
        url: v.string(),
        createdAt: v.number(),
        tags: v.array(v.string()),
        roleLevel: v.optional(roleLevelValidator),
      }),
    ),
    status: v.union(
      v.literal("saved"),
      v.literal("applied"),
      v.literal("interviewing"),
      v.literal("offer"),
      v.literal("rejected"),
      v.literal("accepted"),
    ),
    notes: v.optional(v.string()),
    statusHistory: v.optional(
      v.array(
        v.object({
          fromStatus: v.optional(applicationStatusValidator),
          toStatus: applicationStatusValidator,
          changedAt: v.number(),
        }),
      ),
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_jobId", ["userId", "jobId"]),

  emailSubscriptions: defineTable({
    userId: v.string(),
    email: v.string(),
    unsubscribeToken: v.string(),
    isActive: v.boolean(),
    roleFilters: v.array(roleLevelValidator),
  })
    .index("by_userId", ["userId"])
    .index("by_unsubscribeToken", ["unsubscribeToken"])
    .index("by_isActive", ["isActive"]),

  jobNotificationDeliveries: defineTable({
    jobId: v.id("jobs"),
    userId: v.string(),
    sentAt: v.number(),
  }).index("by_jobId_userId", ["jobId", "userId"]),
});
