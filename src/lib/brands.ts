/** Well-known brands phishing campaigns often impersonate. */
export const KNOWN_BRANDS: Array<{
  name: string;
  domains: string[];
  keywords: string[];
}> = [
  {
    name: "PayPal",
    domains: ["paypal.com", "paypal.me"],
    keywords: ["paypal", "pay pal"],
  },
  {
    name: "Apple",
    domains: ["apple.com", "icloud.com", "appleid.apple.com"],
    keywords: ["apple", "icloud", "apple id", "app store"],
  },
  {
    name: "Microsoft",
    domains: ["microsoft.com", "live.com", "outlook.com", "office.com", "microsoftonline.com"],
    keywords: ["microsoft", "outlook", "office 365", "onedrive", "azure"],
  },
  {
    name: "Amazon",
    domains: ["amazon.com", "aws.amazon.com", "amazon.co.uk"],
    keywords: ["amazon", "aws", "prime"],
  },
  {
    name: "Google",
    domains: ["google.com", "gmail.com", "accounts.google.com", "youtube.com"],
    keywords: ["google", "gmail", "youtube"],
  },
  {
    name: "Netflix",
    domains: ["netflix.com"],
    keywords: ["netflix"],
  },
  {
    name: "Bank of America",
    domains: ["bankofamerica.com"],
    keywords: ["bank of america", "bofa"],
  },
  {
    name: "Chase",
    domains: ["chase.com"],
    keywords: ["chase", "jpmorgan"],
  },
  {
    name: "Wells Fargo",
    domains: ["wellsfargo.com"],
    keywords: ["wells fargo"],
  },
  {
    name: "Discord",
    domains: ["discord.com", "discord.gg"],
    keywords: ["discord"],
  },
  {
    name: "Steam",
    domains: ["steampowered.com", "steamcommunity.com"],
    keywords: ["steam", "steamcommunity"],
  },
  {
    name: "LinkedIn",
    domains: ["linkedin.com"],
    keywords: ["linkedin"],
  },
  {
    name: "Facebook",
    domains: ["facebook.com", "fb.com", "meta.com"],
    keywords: ["facebook", "meta", "instagram"],
  },
  {
    name: "DHL",
    domains: ["dhl.com"],
    keywords: ["dhl", "parcel", "shipment"],
  },
  {
    name: "UPS",
    domains: ["ups.com"],
    keywords: ["ups", "package delivery"],
  },
  {
    name: "USPS",
    domains: ["usps.com"],
    keywords: ["usps", "postal service"],
  },
  {
    name: "IRS",
    domains: ["irs.gov"],
    keywords: ["irs", "internal revenue", "tax refund"],
  },
];

export const SUSPICIOUS_TLDS = new Set([
  "zip",
  "mov",
  "tk",
  "ml",
  "ga",
  "cf",
  "gq",
  "xyz",
  "top",
  "club",
  "work",
  "click",
  "country",
  "stream",
  "download",
  "racing",
  "win",
  "bid",
]);

export const URL_SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rebrand.ly",
  "cutt.ly",
  "shorturl.at",
  "rb.gy",
  "tiny.cc",
]);

export const URGENCY_PATTERNS: Array<{ id: string; label: string; pattern: RegExp; points: number }> = [
  {
    id: "urgent-action",
    label: "Urgent action demand",
    pattern: /\b(urgent|immediately|right away|act now|asap|within\s+\d+\s+(hours?|minutes?))\b/i,
    points: 12,
  },
  {
    id: "account-threat",
    label: "Account suspension threat",
    pattern: /\b(suspend(ed|ing)?|deactivat(e|ed|ion)|terminat(e|ed|ion)|locked|closed)\b.*\b(account|access)\b|\b(account|access)\b.*\b(suspend(ed|ing)?|deactivat(e|ed|ion)|terminat(e|ed|ion)|locked|closed)\b/i,
    points: 18,
  },
  {
    id: "verify-now",
    label: "Verify / confirm pressure",
    pattern: /\b(verify|confirm|update|validate)\b(.{0,40}\b(account|identity|payment|password|details)\b|\s+now\b)/i,
    points: 14,
  },
  {
    id: "payment-scare",
    label: "Unexpected payment / refund bait",
    pattern: /\b(unusual\s+activity|unauthorized\s+(charge|payment)|refund\s+pending|claim\s+your|prize|lottery|won)\b/i,
    points: 16,
  },
  {
    id: "credential-ask",
    label: "Credential or code request",
    pattern: /\b(password|passcode|one[- ]time\s+code|otp|2fa|security\s+code|ssn|social\s+security|pin)\b/i,
    points: 20,
  },
  {
    id: "fear-legal",
    label: "Legal / fine scare tactics",
    pattern: /\b(lawsuit|legal\s+action|arrest|warrant|fine|penalty|tax\s+lien)\b/i,
    points: 18,
  },
];
