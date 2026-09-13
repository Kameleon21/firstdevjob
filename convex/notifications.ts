import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { resend } from "./resend";

function normalizeSiteUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function parseEmailList(value: string | undefined): string[] {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0),
    ),
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const getJobForStaffNotification = internalQuery({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;

    return {
      id: job._id,
      title: job.title,
      company: job.company,
      location: job.location ?? "",
      url: job.url ?? "",
      status: job.status,
      createdAt: job._creationTime,
    };
  },
});

export const getJobForUserNotification = internalQuery({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.status !== "approved") {
      return null;
    }

    return {
      id: job._id,
      title: job.title,
      company: job.company,
      location: job.location ?? "",
      url: job.url ?? "",
      roleLevel: job.roleLevel,
    };
  },
});

export const hasJobNotificationDelivery = internalQuery({
  args: {
    jobId: v.id("jobs"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const deliveries = await ctx.db
      .query("jobNotificationDeliveries")
      .withIndex("by_jobId_userId", (q) => q.eq("jobId", args.jobId).eq("userId", args.userId))
      .collect();

    return deliveries.length > 0;
  },
});

export const createJobNotificationDelivery = internalMutation({
  args: {
    jobId: v.id("jobs"),
    userId: v.string(),
    sentAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("jobNotificationDeliveries", {
      jobId: args.jobId,
      userId: args.userId,
      sentAt: args.sentAt,
    });
  },
});

export const sendNewSubmissionStaffEmail = internalAction({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const recipients = parseEmailList(process.env.STAFF_NOTIFICATION_EMAILS);
    if (recipients.length === 0) {
      console.warn("Skipping staff notification: STAFF_NOTIFICATION_EMAILS is not configured");
      return {
        success: false,
        reason: "missing_staff_recipients",
      } as const;
    }

    const from = process.env.EMAIL_FROM?.trim();
    if (!from) {
      console.warn("Skipping staff notification: EMAIL_FROM is not configured");
      return {
        success: false,
        reason: "missing_email_from",
      } as const;
    }

    const job = await ctx.runQuery(internal.notifications.getJobForStaffNotification, {
      jobId: args.jobId,
    });
    if (!job) {
      return {
        success: false,
        reason: "job_not_found",
      } as const;
    }

    const siteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
    const moderationUrl = siteUrl ? `${siteUrl}/dashboard` : null;
    const locationText = job.location || "N/A";
    const jobUrlText = job.url || "N/A";
    const createdAtIso = new Date(job.createdAt).toISOString();

    const subject = `New job submission: ${job.title} at ${job.company}`;
    const noReplyNotice =
      "This is an automated no-reply notification email. Please do not reply to this message.";
    const text = [
      "A new job has been submitted and is pending moderation.",
      "",
      `Title: ${job.title}`,
      `Company: ${job.company}`,
      `Location: ${locationText}`,
      `URL: ${jobUrlText}`,
      `Submitted At (UTC): ${createdAtIso}`,
      "",
      `Moderation Dashboard: ${moderationUrl ?? "NEXT_PUBLIC_SITE_URL is not configured."}`,
      "",
      noReplyNotice,
    ].join("\n");

    const moderationLinkHtml = moderationUrl
      ? `<p><a href="${escapeHtml(moderationUrl)}">Open moderation dashboard</a></p>`
      : `<p><strong>Moderation Dashboard:</strong> NEXT_PUBLIC_SITE_URL is not configured.</p>`;

    const html = `
      <p>A new job has been submitted and is pending moderation.</p>
      <ul>
        <li><strong>Title:</strong> ${escapeHtml(job.title)}</li>
        <li><strong>Company:</strong> ${escapeHtml(job.company)}</li>
        <li><strong>Location:</strong> ${escapeHtml(locationText)}</li>
        <li><strong>URL:</strong> ${escapeHtml(jobUrlText)}</li>
        <li><strong>Submitted At (UTC):</strong> ${escapeHtml(createdAtIso)}</li>
      </ul>
      ${moderationLinkHtml}
      <hr />
      <p><strong>Note:</strong> ${escapeHtml(noReplyNotice)}</p>
    `.trim();

    const replyTo = parseEmailList(process.env.EMAIL_REPLY_TO);

    let sentCount = 0;
    for (const recipient of recipients) {
      try {
        await resend.sendEmail(ctx, {
          from,
          to: recipient,
          subject,
          text,
          html,
          replyTo: replyTo.length > 0 ? replyTo : undefined,
        });
        sentCount += 1;
      } catch (error) {
        console.error("Failed to enqueue staff notification email", {
          jobId: args.jobId,
          recipient,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      success: sentCount > 0,
      attemptedCount: recipients.length,
      sentCount,
    } as const;
  },
});

export const sendJobApprovedUserEmails = internalAction({
  args: { jobId: v.id("jobs") },
  handler: async (
    ctx,
    args,
  ): Promise<
    | {
        success: false;
        reason:
          | "missing_email_from"
          | "site_url_not_configured"
          | "job_not_found_or_not_approved";
      }
    | {
        success: true;
        attemptedCount: number;
        sentCount: number;
        dedupedCount: number;
      }
  > => {
    const from = process.env.EMAIL_FROM?.trim();
    if (!from) {
      console.warn("Skipping user approval notification: EMAIL_FROM is not configured");
      return {
        success: false,
        reason: "missing_email_from",
      } as const;
    }

    const job = await ctx.runQuery(internal.notifications.getJobForUserNotification, {
      jobId: args.jobId,
    });
    if (!job) {
      return {
        success: false,
        reason: "job_not_found_or_not_approved",
      } as const;
    }

    const subscribers = await ctx.runQuery(
      internal.emailSubscriptions.getActiveSubscribersForRole,
      { roleLevel: job.roleLevel },
    );

    const siteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
    if (!siteUrl) {
      console.warn(
        "Skipping user approval notification: NEXT_PUBLIC_SITE_URL is not configured",
      );
      return { success: false, reason: "site_url_not_configured" } as const;
    }
    const browseJobsUrl = `${siteUrl}/`;
    const locationText = job.location || "N/A";
    const roleLevelText = job.roleLevel ?? "Not specified";
    const applyLink = job.url?.trim();
    const applyUrl = applyLink && applyLink.length > 0 ? applyLink : null;
    const noReplyNotice =
      "This is an automated no-reply notification email. Please do not reply to this message.";
    const replyTo = parseEmailList(process.env.EMAIL_REPLY_TO);

    let sentCount = 0;
    let dedupedCount = 0;

    for (const subscriber of subscribers) {
      try {
        const alreadyDelivered = await ctx.runQuery(
          internal.notifications.hasJobNotificationDelivery,
          {
            jobId: args.jobId,
            userId: subscriber.userId,
          },
        );

        if (alreadyDelivered) {
          dedupedCount += 1;
          continue;
        }

        const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribeToken)}`;

        const subject = `New approved job: ${job.title} at ${job.company}`;
        const text = [
          "A new job matching your notification settings was approved.",
          "",
          `Title: ${job.title}`,
          `Company: ${job.company}`,
          `Location: ${locationText}`,
          `Role Level: ${roleLevelText}`,
          `Apply Link: ${applyUrl ?? "N/A"}`,
          `Browse All Jobs: ${browseJobsUrl}`,
          `Unsubscribe: ${unsubscribeUrl}`,
          "",
          noReplyNotice,
        ].join("\n");

        const applyLinkHtml = applyUrl
          ? `<p><a href="${escapeHtml(applyUrl)}">Apply to this job</a></p>`
          : "<p><strong>Apply Link:</strong> N/A</p>";
        const browseJobsLinkHtml = `<p><a href="${escapeHtml(browseJobsUrl)}">Browse all jobs</a></p>`;
        const unsubscribeLinkHtml = `<p><a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe from these emails</a></p>`;

        const html = `
          <p>A new job matching your notification settings was approved.</p>
          <ul>
            <li><strong>Title:</strong> ${escapeHtml(job.title)}</li>
            <li><strong>Company:</strong> ${escapeHtml(job.company)}</li>
            <li><strong>Location:</strong> ${escapeHtml(locationText)}</li>
            <li><strong>Role Level:</strong> ${escapeHtml(roleLevelText)}</li>
          </ul>
          ${applyLinkHtml}
          ${browseJobsLinkHtml}
          ${unsubscribeLinkHtml}
          <hr />
          <p><strong>Note:</strong> ${escapeHtml(noReplyNotice)}</p>
        `.trim();

        await resend.sendEmail(ctx, {
          from,
          to: subscriber.email,
          subject,
          text,
          html,
          replyTo: replyTo.length > 0 ? replyTo : undefined,
        });

        await ctx.runMutation(internal.notifications.createJobNotificationDelivery, {
          jobId: args.jobId,
          userId: subscriber.userId,
          sentAt: Date.now(),
        });

        sentCount += 1;
      } catch (error) {
        console.error("Failed to enqueue user job notification email", {
          jobId: args.jobId,
          userId: subscriber.userId,
          recipient: subscriber.email,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      success: true,
      attemptedCount: subscribers.length,
      sentCount,
      dedupedCount,
    } as const;
  },
});
