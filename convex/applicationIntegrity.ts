export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "accepted";

export type ApplicationStatusHistoryEntry = {
  fromStatus?: ApplicationStatus;
  toStatus: ApplicationStatus;
  changedAt: number;
};

export const MAX_NOTES_LENGTH = 2000;

// Forward progress plus a way back out of the end states, so a mis-click on
// "Rejected" or "Accepted" is recoverable without deleting the record.
export const allowedStatusTransitions: Record<
  ApplicationStatus,
  ApplicationStatus[]
> = {
  saved: ["applied", "interviewing", "rejected"],
  applied: ["interviewing", "offer", "rejected"],
  interviewing: ["offer", "rejected"],
  offer: ["accepted", "rejected"],
  rejected: ["saved", "applied", "interviewing", "offer"],
  accepted: ["offer", "rejected"],
};

export function getAllowedStatusTransitions(
  from: ApplicationStatus,
): ApplicationStatus[] {
  return allowedStatusTransitions[from];
}

export function canTransitionApplicationStatus(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  if (from === to) {
    return true;
  }

  return allowedStatusTransitions[from].includes(to);
}

export function normalizeNotes(notes: string): string {
  return notes.trim();
}

export function isNotesLengthValid(notes: string): boolean {
  return notes.length <= MAX_NOTES_LENGTH;
}

export function appendStatusHistory(args: {
  currentStatus: ApplicationStatus;
  nextStatus: ApplicationStatus;
  history?: ApplicationStatusHistoryEntry[];
  now: number;
}): ApplicationStatusHistoryEntry[] {
  if (args.currentStatus === args.nextStatus) {
    return args.history ?? [];
  }

  return [
    ...(args.history ?? []),
    {
      fromStatus: args.currentStatus,
      toStatus: args.nextStatus,
      changedAt: args.now,
    },
  ];
}
