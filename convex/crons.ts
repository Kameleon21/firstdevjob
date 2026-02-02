import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at midnight UTC
crons.daily(
  "cleanup old jobs",
  { hourUTC: 0, minuteUTC: 0 },
  internal.jobs.deleteOldJobs,
);

export default crons;
