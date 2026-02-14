import { Resend } from "@convex-dev/resend";
import { components } from "./_generated/api";

function parseBooleanEnv(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export const resend = new Resend(components.resend, {
  testMode: parseBooleanEnv(process.env.RESEND_TEST_MODE),
});
