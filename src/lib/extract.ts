const URL_REGEX =
  /(?:https?:\/\/|www\.)[^\s<>"')\]]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s<>"')\]]*)?/gi;

const ANGLE_HREF_REGEX = /<\s*https?:\/\/[^>\s]+>/gi;

function stripTrailingPunctuation(url: string): string {
  return url.replace(/[.,;:!?)]+$/g, "");
}

function normalizeCandidate(raw: string): string {
  let value = raw.trim();
  if (value.startsWith("<") && value.endsWith(">")) {
    value = value.slice(1, -1);
  }
  value = stripTrailingPunctuation(value);
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }
  return value;
}

export function extractUrls(text: string): string[] {
  const found = new Set<string>();

  for (const match of text.matchAll(ANGLE_HREF_REGEX)) {
    found.add(normalizeCandidate(match[0]));
  }

  for (const match of text.matchAll(URL_REGEX)) {
    const candidate = normalizeCandidate(match[0]);
    try {
      const parsed = new URL(candidate);
      if (parsed.hostname.includes(".")) {
        found.add(parsed.toString());
      }
    } catch {
      // skip invalid
    }
  }

  return [...found];
}

export function getRegistrableDomain(hostname: string): string {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) return host;
  // Simple eTLD+1 approximation (good enough for phishing demos)
  const multiPartTlds = new Set(["co.uk", "com.au", "co.jp", "com.br", "co.nz"]);
  const lastTwo = parts.slice(-2).join(".");
  if (multiPartTlds.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }
  return lastTwo;
}

export function getTld(hostname: string): string {
  const parts = hostname.toLowerCase().split(".").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}
