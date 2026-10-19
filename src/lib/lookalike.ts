import { KNOWN_BRANDS } from "./brands";
import { getRegistrableDomain } from "./extract";

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/** Common homoglyph / typosquat substitutions. */
function normalizeHomoglyphs(value: string): string {
  return value
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "l")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/@/g, "a")
    .replace(/\$/g, "s");
}

export interface LookalikeHit {
  brand: string;
  legitimateDomain: string;
  distance: number;
  reason: string;
}

export function detectLookalike(hostname: string): LookalikeHit | null {
  const registrable = getRegistrableDomain(hostname);
  const label = registrable.split(".")[0] ?? registrable;
  const normalizedLabel = normalizeHomoglyphs(label);

  for (const brand of KNOWN_BRANDS) {
    for (const legit of brand.domains) {
      const legitRegistrable = getRegistrableDomain(legit);
      if (registrable === legitRegistrable || hostname.endsWith(`.${legitRegistrable}`)) {
        return null; // exact legitimate brand domain
      }

      const legitLabel = legitRegistrable.split(".")[0] ?? legitRegistrable;
      const distance = levenshtein(normalizedLabel, normalizeHomoglyphs(legitLabel));
      const containsBrand =
        normalizedLabel.includes(normalizeHomoglyphs(legitLabel)) &&
        normalizedLabel !== normalizeHomoglyphs(legitLabel);

      if (distance > 0 && distance <= 2 && Math.abs(label.length - legitLabel.length) <= 2) {
        return {
          brand: brand.name,
          legitimateDomain: legitRegistrable,
          distance,
          reason: `Domain "${registrable}" is ${distance} character(s) from legitimate "${legitRegistrable}"`,
        };
      }

      if (containsBrand && !registrable.endsWith(legitRegistrable)) {
        return {
          brand: brand.name,
          legitimateDomain: legitRegistrable,
          distance,
          reason: `Domain embeds brand keyword "${brand.name}" but is not on ${legitRegistrable}`,
        };
      }
    }
  }

  return null;
}

export function detectBrandMentionWithoutMatch(
  text: string,
  linkDomains: string[],
): Array<{ brand: string; detail: string }> {
  const lower = text.toLowerCase();
  const hits: Array<{ brand: string; detail: string }> = [];

  for (const brand of KNOWN_BRANDS) {
    const mentioned = brand.keywords.some((k) => lower.includes(k));
    if (!mentioned) continue;

    const matchesOfficial = linkDomains.some((domain) =>
      brand.domains.some((d) => {
        const legit = getRegistrableDomain(d);
        return domain === legit || domain.endsWith(`.${legit}`);
      }),
    );

    if (!matchesOfficial && linkDomains.length > 0) {
      hits.push({
        brand: brand.name,
        detail: `Message mentions ${brand.name} but links go to: ${linkDomains.join(", ")}`,
      });
    }
  }

  return hits;
}
