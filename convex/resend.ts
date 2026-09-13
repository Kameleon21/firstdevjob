import { Resend } from "@convex-dev/resend";
import { components } from "./_generated/api";

const TRUE_VALUES = new Set(["1", "true", "yes"]);
const FALSE_VALUES = new Set(["0", "false", "no"]);

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return defaultValue;
}

// Safe by default: real email only goes out when RESEND_TEST_MODE is explicitly false.
export const resend = new Resend(components.resend, {
  testMode: parseBooleanEnv(process.env.RESEND_TEST_MODE, true),
});
