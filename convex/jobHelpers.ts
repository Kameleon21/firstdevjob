import type { Doc } from "./_generated/dataModel";

export type RoleLevel = "intern" | "graduate" | "earlyCareer";

const INTERN_KEYWORDS = [
  "internship",
  "intern",
  "co-op",
  "co op",
  "placement",
  "trainee",
  "apprentice",
];

const GRADUATE_KEYWORDS = ["graduate", "new grad"];

export function inferRoleLevelFromTitle(title: string): RoleLevel {
  const normalized = title.toLowerCase();

  if (INTERN_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "intern";
  }

  if (GRADUATE_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "graduate";
  }

  return "earlyCareer";
}

export type JobSnapshot = {
  title: string;
  company: string;
  location: string;
  url: string;
  createdAt: number;
  tags: string[];
  roleLevel?: RoleLevel;
};

export function buildJobSnapshot(job: Doc<"jobs">): JobSnapshot {
  return {
    title: job.title,
    company: job.company,
    location: job.location ?? "",
    url: job.url ?? "",
    createdAt: job._creationTime,
    tags: job.tags ?? [],
    roleLevel: job.roleLevel,
  };
}
