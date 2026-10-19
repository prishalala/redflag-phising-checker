import { SUSPICIOUS_TLDS, URL_SHORTENERS, URGENCY_PATTERNS } from "./brands";
import { lookupDomainAge } from "./domain-age";
import { extractUrls, getRegistrableDomain, getTld } from "./extract";
import { detectBrandMentionWithoutMatch, detectLookalike } from "./lookalike";
import { followRedirects } from "./redirects";
import type { ExtractedLink, HeuristicFinding, RiskLevel } from "./types";

function scoreToRisk(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

function pushFinding(list: HeuristicFinding[], finding: HeuristicFinding) {
  list.push(finding);
}

async function analyzeUrl(rawUrl: string): Promise<ExtractedLink> {
  const findings: HeuristicFinding[] = [];
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return {
      url: rawUrl,
      domain: "invalid",
      findings: [
        {
          id: "invalid-url",
          severity: "medium",
          title: "Malformed URL",
          detail: "Could not parse this as a valid URL.",
          points: 10,
        },
      ],
      domainAgeDays: null,
      domainAgeSource: "unavailable",
      redirectCount: 0,
      redirectChain: [rawUrl],
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const domain = getRegistrableDomain(hostname);

  if (parsed.username || parsed.password || rawUrl.includes("@")) {
    pushFinding(findings, {
      id: "userinfo-url",
      severity: "high",
      title: "Credentials embedded in URL",
      detail: "URLs with @ or user:pass@ are a classic phishing trick to disguise the real host.",
      points: 25,
    });
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    pushFinding(findings, {
      id: "ip-host",
      severity: "high",
      title: "IP address instead of domain",
      detail: `Host is a raw IP (${hostname}). Legitimate brands rarely ask you to visit IPs.`,
      points: 22,
    });
  }

  if (hostname.split(".").length >= 5) {
    pushFinding(findings, {
      id: "deep-subdomains",
      severity: "medium",
      title: "Unusually deep subdomain chain",
      detail: `Hostname "${hostname}" uses many subdomains — often used to look official.`,
      points: 12,
    });
  }

  const tld = getTld(hostname);
  if (SUSPICIOUS_TLDS.has(tld)) {
    pushFinding(findings, {
      id: "suspicious-tld",
      severity: "medium",
      title: "Uncommon / high-abuse TLD",
      detail: `.${tld} appears often in phishing kits compared with .com / .gov brand domains.`,
      points: 14,
    });
  }

  if (URL_SHORTENERS.has(domain)) {
    pushFinding(findings, {
      id: "shortener",
      severity: "medium",
      title: "URL shortener hides destination",
      detail: `${domain} conceals the final site. Expand it before clicking.`,
      points: 10,
    });
  }

  if (parsed.protocol === "http:") {
    pushFinding(findings, {
      id: "insecure-http",
      severity: "low",
      title: "Insecure HTTP link",
      detail: "Uses http:// instead of https:// — easier to tamper with in transit.",
      points: 6,
    });
  }

  const lookalike = detectLookalike(hostname);
  if (lookalike) {
    pushFinding(findings, {
      id: "lookalike-domain",
      severity: "critical",
      title: `Lookalike of ${lookalike.brand}`,
      detail: `${lookalike.reason}. Official domain is ${lookalike.legitimateDomain}.`,
      points: 35,
    });
  }

  const [age, redirects] = await Promise.all([
    lookupDomainAge(domain),
    followRedirects(parsed.toString()),
  ]);

  if (age.ageDays !== null && age.ageDays <= 30) {
    pushFinding(findings, {
      id: "young-domain",
      severity: age.ageDays <= 7 ? "critical" : "high",
      title: `Domain registered ~${age.ageDays} day(s) ago`,
      detail:
        age.source === "rdap"
          ? `RDAP shows this domain is only about ${age.ageDays} days old${age.registeredAt ? ` (since ${age.registeredAt.slice(0, 10)})` : ""}. Brand sites are almost never this new.`
          : `Domain appears very new (~${age.ageDays} days).`,
      points: age.ageDays <= 7 ? 30 : 22,
    });
  } else if (age.source === "estimated") {
    pushFinding(findings, {
      id: "disposable-pattern",
      severity: "medium",
      title: "Disposable-looking domain pattern",
      detail:
        "Name looks throwaway (digits, login/verify keywords, or very long). RDAP age unavailable — treat cautiously.",
      points: 12,
    });
  }

  if (redirects.redirectCount >= 2) {
    pushFinding(findings, {
      id: "redirect-chain",
      severity: redirects.redirectCount >= 3 ? "high" : "medium",
      title: `${redirects.redirectCount}-hop redirect chain`,
      detail: `Path: ${redirects.chain.join(" → ")}`,
      points: redirects.redirectCount >= 3 ? 18 : 10,
    });
  }

  if (redirects.finalUrl && redirects.finalUrl !== parsed.toString()) {
    try {
      const finalHost = new URL(redirects.finalUrl).hostname;
      const finalLookalike = detectLookalike(finalHost);
      if (finalLookalike) {
        pushFinding(findings, {
          id: "redirect-lookalike",
          severity: "critical",
          title: `Redirects to ${finalLookalike.brand} lookalike`,
          detail: `Final destination ${finalHost}: ${finalLookalike.reason}`,
          points: 30,
        });
      }
      const finalDomain = getRegistrableDomain(finalHost);
      if (finalDomain !== domain) {
        pushFinding(findings, {
          id: "cross-domain-redirect",
          severity: "low",
          title: "Redirects to a different domain",
          detail: `${domain} → ${finalDomain}`,
          points: 6,
        });
      }
    } catch {
      // ignore
    }
  }

  return {
    url: rawUrl,
    finalUrl: redirects.finalUrl,
    domain,
    findings,
    domainAgeDays: age.ageDays,
    domainAgeSource: age.source,
    redirectCount: redirects.redirectCount,
    redirectChain: redirects.chain,
  };
}

export function analyzeMessageSignals(text: string): HeuristicFinding[] {
  const findings: HeuristicFinding[] = [];

  for (const pattern of URGENCY_PATTERNS) {
    if (pattern.pattern.test(text)) {
      findings.push({
        id: pattern.id,
        severity: pattern.points >= 18 ? "high" : "medium",
        title: pattern.label,
        detail: `Matched pressure-language pattern in the message body.`,
        points: pattern.points,
      });
    }
  }

  if (/\b(dear\s+(customer|user|member|client)|valued\s+customer)\b/i.test(text)) {
    findings.push({
      id: "generic-greeting",
      severity: "low",
      title: "Generic greeting",
      detail: "Uses a mass-mail greeting instead of your name — common in phishing.",
      points: 5,
    });
  }

  if ((text.match(/!/g) ?? []).length >= 3) {
    findings.push({
      id: "exclamation-spam",
      severity: "info",
      title: "Heavy exclamation marks",
      detail: "Multiple !!! often signals manufactured urgency.",
      points: 3,
    });
  }

  return findings;
}

export interface HeuristicBundle {
  extractedLinks: ExtractedLink[];
  messageSignals: HeuristicFinding[];
  score: number;
  risk: RiskLevel;
  reasons: string[];
}

export async function runHeuristics(text: string): Promise<HeuristicBundle> {
  const urls = extractUrls(text);
  const extractedLinks = await Promise.all(urls.map((u) => analyzeUrl(u)));
  const messageSignals = analyzeMessageSignals(text);

  const linkDomains = extractedLinks.map((l) => l.domain).filter((d) => d !== "invalid");
  for (const brandHit of detectBrandMentionWithoutMatch(text, linkDomains)) {
    messageSignals.push({
      id: `brand-mismatch-${brandHit.brand.toLowerCase().replace(/\s+/g, "-")}`,
      severity: "high",
      title: `${brandHit.brand} impersonation signal`,
      detail: brandHit.detail,
      points: 20,
    });
  }

  if (urls.length === 0 && text.trim().length > 0) {
    messageSignals.push({
      id: "no-links",
      severity: "info",
      title: "No links found",
      detail: "Scored message language only. Paste a URL or a full email/SMS that contains links for a fuller check.",
      points: 0,
    });
  }

  const allFindings = [
    ...messageSignals,
    ...extractedLinks.flatMap((l) => l.findings),
  ];

  const rawScore = allFindings.reduce((sum, f) => sum + f.points, 0);
  const score = Math.min(100, rawScore);
  const risk = scoreToRisk(score);

  const reasons = allFindings
    .filter((f) => f.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 8)
    .map((f) => `${f.title}: ${f.detail}`);

  return { extractedLinks, messageSignals, score, risk, reasons };
}

export function recommendedActionFor(risk: RiskLevel): string {
  switch (risk) {
    case "critical":
      return "Do not click any links or enter credentials. Delete the message and report it as phishing to your email/SMS provider.";
    case "high":
      return "Treat as likely phishing. Navigate to the service yourself by typing the official domain — never via this message.";
    case "medium":
      return "Be cautious. Verify the sender through a separate channel and inspect the real domain before interacting.";
    case "low":
    default:
      return "No strong red flags found, but stay alert — this tool is educational and can miss novel attacks.";
  }
}
