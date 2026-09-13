import {
  appendStatusHistory,
  canTransitionApplicationStatus,
  getAllowedStatusTransitions,
  isNotesLengthValid,
  MAX_NOTES_LENGTH,
  normalizeNotes,
} from "../../convex/applicationIntegrity";

describe("applicationIntegrity", () => {
  it("enforces valid status transitions", () => {
    expect(canTransitionApplicationStatus("saved", "applied")).toBe(true);
    expect(canTransitionApplicationStatus("saved", "accepted")).toBe(false);
    expect(canTransitionApplicationStatus("offer", "accepted")).toBe(true);
    expect(canTransitionApplicationStatus("saved", "interviewing")).toBe(true);
    expect(canTransitionApplicationStatus("interviewing", "saved")).toBe(false);
  });

  it("lets users back out of rejected and accepted", () => {
    expect(canTransitionApplicationStatus("rejected", "applied")).toBe(true);
    expect(canTransitionApplicationStatus("accepted", "offer")).toBe(true);
    expect(canTransitionApplicationStatus("accepted", "saved")).toBe(false);
  });

  it("exposes the allowed next statuses for the UI", () => {
    expect(getAllowedStatusTransitions("offer")).toEqual(["accepted", "rejected"]);
    expect(getAllowedStatusTransitions("rejected")).not.toHaveLength(0);
  });

  it("allows no-op status updates", () => {
    expect(canTransitionApplicationStatus("interviewing", "interviewing")).toBe(
      true,
    );
  });

  it("normalizes notes and validates max length", () => {
    expect(normalizeNotes("  follow up next week  ")).toBe(
      "follow up next week",
    );
    expect(isNotesLengthValid("a".repeat(MAX_NOTES_LENGTH))).toBe(true);
    expect(isNotesLengthValid("a".repeat(MAX_NOTES_LENGTH + 1))).toBe(false);
  });

  it("appends status history when status changes", () => {
    const history = appendStatusHistory({
      currentStatus: "saved",
      nextStatus: "applied",
      history: [{ toStatus: "saved", changedAt: 1000 }],
      now: 2000,
    });

    expect(history).toEqual([
      { toStatus: "saved", changedAt: 1000 },
      { fromStatus: "saved", toStatus: "applied", changedAt: 2000 },
    ]);
  });

  it("keeps history unchanged for no-op updates", () => {
    const original = [{ toStatus: "saved" as const, changedAt: 1000 }];
    const history = appendStatusHistory({
      currentStatus: "saved",
      nextStatus: "saved",
      history: original,
      now: 2000,
    });

    expect(history).toEqual(original);
  });
});
