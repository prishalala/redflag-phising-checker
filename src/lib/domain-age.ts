export interface DomainAgeResult {
  ageDays: number | null;
  source: "rdap" | "estimated" | "unavailable";
  registeredAt?: string;
}

function daysSince(iso: string): number {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return NaN;
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

/**
 * Try public RDAP for registration date. Falls back gracefully when blocked or unsupported.
 */
export async function lookupDomainAge(domain: string): Promise<DomainAgeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: controller.signal,
      headers: { Accept: "application/rdap+json, application/json" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return estimateDomainAge(domain);
    }

    const data = (await res.json()) as {
      events?: Array<{ eventAction?: string; eventDate?: string }>;
    };

    const registration = data.events?.find(
      (e) => e.eventAction === "registration" && e.eventDate,
    );

    if (registration?.eventDate) {
      const ageDays = daysSince(registration.eventDate);
      if (!Number.isNaN(ageDays)) {
        return {
          ageDays: Math.max(0, ageDays),
          source: "rdap",
          registeredAt: registration.eventDate,
        };
      }
    }

    return estimateDomainAge(domain);
  } catch {
    return estimateDomainAge(domain);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Lightweight estimate when RDAP is unavailable — never invents a precise date.
 * Marks young-looking throwaway patterns as "likely new" without claiming WHOIS facts.
 */
function estimateDomainAge(domain: string): DomainAgeResult {
  const lower = domain.toLowerCase();
  const looksDisposable =
    /\d{2,}/.test(lower) ||
    lower.includes("-secure") ||
    lower.includes("-login") ||
    lower.includes("-verify") ||
    lower.includes("support-") ||
    lower.length > 28;

  if (looksDisposable) {
    return { ageDays: null, source: "estimated" };
  }

  return { ageDays: null, source: "unavailable" };
}
