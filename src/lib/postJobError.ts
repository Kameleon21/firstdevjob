const FALLBACK_ERROR = "Failed to post job. Please check your details and try again.";

function extractServerMessage(rawMessage: string): string {
  const uncaughtMatch = rawMessage.match(/Uncaught Error:\s*([^\n]+)/i);
  if (uncaughtMatch?.[1]) {
    return uncaughtMatch[1].trim();
  }

  return rawMessage.trim();
}

export function getPostJobErrorMessage(error: unknown): string {
  if (!(error instanceof Error) || !error.message) {
    return FALLBACK_ERROR;
  }

  const message = extractServerMessage(error.message);

  if (message.includes("URL must start with http:// or https://")) {
    return "Please enter a valid URL starting with http:// or https:// (example: https://company.com/jobs/123).";
  }

  if (message.includes("Please enter a valid URL")) {
    return "Please enter a valid job posting URL.";
  }

  if (message.includes("URL must not include username or password")) {
    return "Please remove username/password from the URL and try again.";
  }

  if (message.includes("Local or private network URLs are not allowed")) {
    return "Please use a public job posting URL, not a local or private network address.";
  }

  if (message.includes("Rate limit reached") || message.includes("Daily submission limit reached")) {
    return message;
  }

  if (message.length > 220) {
    return FALLBACK_ERROR;
  }

  return message || FALLBACK_ERROR;
}

export function validatePostJobUrlInput(urlValue: string): string {
  const rawUrl = urlValue.trim();
  if (!rawUrl) {
    throw new Error("Please enter a job posting URL.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error("Please enter a valid URL.");
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error(
      "Please enter a valid URL starting with http:// or https:// (example: https://company.com/jobs/123).",
    );
  }

  return rawUrl;
}
