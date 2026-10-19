export interface RedirectResult {
  finalUrl: string;
  redirectCount: number;
  chain: string[];
  error?: string;
}

/**
 * Follow redirects with a hard cap. Never posts credentials; HEAD/GET only.
 */
export async function followRedirects(url: string, maxHops = 5): Promise<RedirectResult> {
  const chain: string[] = [url];
  let current = url;

  for (let i = 0; i < maxHops; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "Redflag/1.0 (educational phishing checker; +https://localhost)",
          Accept: "*/*",
        },
      });

      clearTimeout(timeout);

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) break;
        const nextUrl = new URL(location, current).toString();
        if (chain.includes(nextUrl)) break;
        chain.push(nextUrl);
        current = nextUrl;
        continue;
      }

      break;
    } catch (err) {
      clearTimeout(timeout);
      return {
        finalUrl: current,
        redirectCount: Math.max(0, chain.length - 1),
        chain,
        error: err instanceof Error ? err.message : "redirect lookup failed",
      };
    }
  }

  return {
    finalUrl: current,
    redirectCount: Math.max(0, chain.length - 1),
    chain,
  };
}
