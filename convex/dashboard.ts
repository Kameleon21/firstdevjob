import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const getDashboardData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return {
        user: null,
        bookmarks: [] as Array<{
          id: Id<"trackedApplications">;
          status:
            | "saved"
            | "applied"
            | "interviewing"
            | "offer"
            | "rejected"
            | "accepted";
          notes: string | null;
          job: {
            id: Id<"jobs">;
            title: string;
            company: string;
            location: string;
            url: string;
            createdAt: number;
            tags: string[];
            roleLevel?: "intern" | "graduate" | "earlyCareer";
            availability: "active" | "closed";
            closureReason: "outdated" | "removed" | null;
          };
        }>,
        userRole: { isAdmin: false, isModerator: false },
        pendingJobs: [] as Array<{
          id: Id<"jobs">;
          createdAt: number;
          title: string;
          company: string;
          location: string;
          url: string;
          status: "pending" | "approved" | "rejected";
          tags: string[];
        }>,
        allTags: [] as string[],
      };
    }

    const [profile, bookmarks, tags] = await Promise.all([
      ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
        .unique(),
      ctx.db
        .query("trackedApplications")
        .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
        .order("desc")
        .collect(),
      ctx.db.query("tags").collect(),
    ]);

    const userRole = {
      isAdmin: profile?.role === "admin",
      isModerator:
        profile?.role === "moderator" || profile?.role === "admin",
      userEmail: identity.email,
      role: profile?.role,
    };

    const bookmarkResults: Array<{
      id: Id<"trackedApplications">;
      status:
        | "saved"
        | "applied"
        | "interviewing"
        | "offer"
        | "rejected"
        | "accepted";
      notes: string | null;
      job: {
        id: Id<"jobs">;
        title: string;
        company: string;
        location: string;
        url: string;
        createdAt: number;
        tags: string[];
        roleLevel?: "intern" | "graduate" | "earlyCareer";
        availability: "active" | "closed";
        closureReason: "outdated" | "removed" | null;
      };
    }> = (
      await Promise.all(
        bookmarks.map(async (bookmark) => {
          const job = await ctx.db.get(bookmark.jobId);
          if (job) {
            const isClosed = job.status === "outdated";
            return {
              id: bookmark._id,
              status: bookmark.status,
              notes: bookmark.notes ?? null,
              job: {
                id: job._id,
                title: job.title,
                company: job.company,
                location: job.location ?? "",
                url: job.url ?? "",
                createdAt: job._creationTime,
                tags: job.tags ?? [],
                roleLevel: job.roleLevel,
                availability: isClosed ? ("closed" as const) : ("active" as const),
                closureReason: isClosed ? ("outdated" as const) : null,
              },
            };
          }

          if (!bookmark.jobSnapshot) {
            return null;
          }

          return {
            id: bookmark._id,
            status: bookmark.status,
            notes: bookmark.notes ?? null,
            job: {
              id: bookmark.jobId,
              title: bookmark.jobSnapshot.title,
              company: bookmark.jobSnapshot.company,
              location: bookmark.jobSnapshot.location,
              url: bookmark.jobSnapshot.url,
              createdAt: bookmark.jobSnapshot.createdAt,
              tags: bookmark.jobSnapshot.tags,
              roleLevel: bookmark.jobSnapshot.roleLevel,
              availability: "closed" as const,
              closureReason: "removed" as const,
            },
          };
        }),
      )
    ).filter((bookmark): bookmark is NonNullable<typeof bookmark> => !!bookmark);

    let pendingJobs: Array<{
      id: Id<"jobs">;
      createdAt: number;
      title: string;
      company: string;
      location: string;
      url: string;
      status: "pending" | "approved" | "rejected" | "outdated";
      tags: string[];
    }> = [];

    if (userRole.isModerator) {
      const jobs = await ctx.db
        .query("jobs")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .order("desc")
        .collect();

      pendingJobs = jobs.map((job) => ({
        id: job._id,
        createdAt: job._creationTime,
        title: job.title,
        company: job.company,
        location: job.location ?? "",
        url: job.url ?? "",
        status: job.status,
        tags: job.tags ?? [],
      }));
    }

    return {
      user: { id: identity.subject, email: identity.email },
      bookmarks: bookmarkResults,
      userRole,
      pendingJobs,
      allTags: tags.map((tag) => tag.name).sort(),
    };
  },
});
