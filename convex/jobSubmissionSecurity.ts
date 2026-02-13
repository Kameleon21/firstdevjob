export const MAX_TITLE_LENGTH = 120;
export const MAX_COMPANY_LENGTH = 120;
export const MAX_LOCATION_LENGTH = 120;
export const MAX_URL_LENGTH = 2048;
export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 32;

function hasControlCharacters(value: string): boolean {
  return /[\u0000-\u001F\u007F]/.test(value);
}

function validateTextField(args: {
  field: string;
  value: string;
  maxLength: number;
}): string {
  const normalized = args.value.trim();

  if (!normalized) {
    throw new Error(`${args.field} is required`);
  }

  if (normalized.length > args.maxLength) {
    throw new Error(`${args.field} must be ${args.maxLength} characters or fewer`);
  }

  if (hasControlCharacters(normalized)) {
    throw new Error(`${args.field} contains invalid characters`);
  }

  return normalized;
}

function parseIPv4(hostname: string): number[] | null {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  const parts = hostname.split(".").map(Number);
  if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return null;
  }

  return parts;
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();

  if (
    normalized === "localhost" ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized === "::1"
  ) {
    return true;
  }

  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }

  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return true;
  }

  const ipv4 = parseIPv4(normalized);
  if (!ipv4) {
    return false;
  }

  const [a, b] = ipv4;

  if (a === 10 || a === 127 || a === 0) {
    return true;
  }

  if (a === 169 && b === 254) {
    return true;
  }

  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }

  if (a === 192 && b === 168) {
    return true;
  }

  return false;
}

export function validateAndNormalizeTags(tags: string[] | undefined): string[] {
  if (!tags || tags.length === 0) {
    return [];
  }

  if (tags.length > MAX_TAGS) {
    throw new Error(`You can add up to ${MAX_TAGS} tags`);
  }

  const deduped = new Map<string, string>();

  for (const rawTag of tags) {
    if (hasControlCharacters(rawTag)) {
      throw new Error("Tags contain invalid characters");
    }

    const tag = rawTag.trim();
    if (!tag) {
      continue;
    }

    if (tag.length > MAX_TAG_LENGTH) {
      throw new Error(`Each tag must be ${MAX_TAG_LENGTH} characters or fewer`);
    }

    const key = tag.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, tag);
    }
  }

  return Array.from(deduped.values());
}

export function validateAndNormalizeJobSubmission(input: {
  title: string;
  company: string;
  location: string;
  url: string;
  tags?: string[];
}) {
  const title = validateTextField({
    field: "Title",
    value: input.title,
    maxLength: MAX_TITLE_LENGTH,
  });

  const company = validateTextField({
    field: "Company",
    value: input.company,
    maxLength: MAX_COMPANY_LENGTH,
  });

  const location = validateTextField({
    field: "Location",
    value: input.location,
    maxLength: MAX_LOCATION_LENGTH,
  });

  const rawUrl = input.url.trim();
  if (!rawUrl) {
    throw new Error("URL is required");
  }

  if (rawUrl.length > MAX_URL_LENGTH) {
    throw new Error(`URL must be ${MAX_URL_LENGTH} characters or fewer`);
  }

  if (hasControlCharacters(rawUrl)) {
    throw new Error("URL contains invalid characters");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error("Please enter a valid URL");
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error("URL must start with http:// or https://");
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error("URL must not include username or password");
  }

  const normalizedHost = parsedUrl.hostname.trim().toLowerCase();
  if (!normalizedHost) {
    throw new Error("URL must include a valid hostname");
  }

  if (isPrivateOrLocalHost(normalizedHost)) {
    throw new Error("Local or private network URLs are not allowed");
  }

  const tags = validateAndNormalizeTags(input.tags);

  return {
    title,
    company,
    location,
    parsedUrl,
    normalizedUrl: parsedUrl.toString(),
    tags,
  };
}
