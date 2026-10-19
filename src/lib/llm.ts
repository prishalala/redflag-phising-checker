import Groq from "groq-sdk";
import { z } from "zod";
import type { HeuristicBundle } from "./heuristics";
import { recommendedActionFor } from "./heuristics";
import type { RiskLevel } from "./types";

const LlmPayloadSchema = z.object({
  summary: z.string(),
  reasons: z.array(z.string()).min(1).max(10),
  recommendedAction: z.string(),
  risk: z.enum(["low", "medium", "high", "critical"]).optional(),
});

export type LlmExplanation = z.infer<typeof LlmPayloadSchema>;

/** Fast free-tier friendly default on Groq. Override with GROQ_MODEL if needed. */
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

function buildMockExplanation(bundle: HeuristicBundle, originalText: string): LlmExplanation {
  const top = bundle.reasons.slice(0, 4);
  const linkBits = bundle.extractedLinks
    .map((l) => {
      const age =
        l.domainAgeDays !== null
          ? ` (~${l.domainAgeDays}d old)`
          : l.domainAgeSource === "estimated"
            ? " (disposable-looking)"
            : "";
      return `${l.domain}${age}`;
    })
    .slice(0, 3);

  let summary: string;
  if (bundle.risk === "low") {
    summary =
      linkBits.length > 0
        ? `Heuristics did not find strong phishing signals on ${linkBits.join(", ")}. Still verify unexpected requests out-of-band.`
        : "No strong phishing language or links stood out. If this message asks you to do something sensitive, confirm through an official app or phone number you already trust.";
  } else if (bundle.risk === "critical" || bundle.risk === "high") {
    summary = `This looks like a phishing attempt. ${top[0] ?? "Multiple red flags matched."}${
      linkBits.length ? ` Linked domain(s): ${linkBits.join(", ")}.` : ""
    } Do not authenticate or pay from this message.`;
  } else {
    summary = `Several caution signals fired${linkBits.length ? ` around ${linkBits.join(", ")}` : ""}. ${
      top[0] ?? "Review the findings before clicking."
    }`;
  }

  // Keep reasons grounded in heuristics — never invent WHOIS facts in the mock path.
  const reasons =
    top.length > 0
      ? top
      : ["No material heuristic findings; treat unexpected credential requests carefully."];

  void originalText;

  return {
    summary,
    reasons,
    recommendedAction: recommendedActionFor(bundle.risk),
    risk: bundle.risk,
  };
}

function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() ?? text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model response");
  return JSON.parse(raw.slice(start, end + 1));
}

export async function explainWithLlm(
  text: string,
  bundle: HeuristicBundle,
): Promise<{ explanation: LlmExplanation; mode: "heuristics+llm" | "heuristics" }> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return { explanation: buildMockExplanation(bundle, text), mode: "heuristics" };
  }

  try {
    const client = new Groq({ apiKey });
    const heuristicDigest = {
      score: bundle.score,
      risk: bundle.risk,
      messageSignals: bundle.messageSignals.map((f) => ({
        title: f.title,
        detail: f.detail,
        points: f.points,
      })),
      links: bundle.extractedLinks.map((l) => ({
        url: l.url,
        finalUrl: l.finalUrl,
        domain: l.domain,
        domainAgeDays: l.domainAgeDays,
        domainAgeSource: l.domainAgeSource,
        redirectChain: l.redirectChain,
        findings: l.findings.map((f) => ({
          title: f.title,
          detail: f.detail,
          points: f.points,
        })),
      })),
    };

    const prompt = `You are a security educator helping someone spot phishing. You receive deterministic heuristic findings (facts) plus the original message.

Rules:
- Explain in plain English for a non-expert.
- NEVER invent domain registration dates, IP ownership, or facts not present in the heuristics JSON.
- You MAY interpret urgency, impersonation tone, and whether the story matches the linked domains.
- Prefer the heuristic risk unless the message tone clearly warrants one step higher.
- Return ONLY valid JSON matching:
{
  "summary": string,
  "reasons": string[],
  "recommendedAction": string,
  "risk": "low" | "medium" | "high" | "critical"
}

Heuristic findings (source of truth for technical facts):
${JSON.stringify(heuristicDigest, null, 2)}

Original message:
"""
${text.slice(0, 6000)}
"""`;

    const response = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You explain phishing risks. Reply with a single JSON object only.",
        },
        { role: "user", content: prompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty model response");
    }

    const parsed = LlmPayloadSchema.parse(extractJsonObject(content));
    const risk = (parsed.risk ?? bundle.risk) as RiskLevel;

    return {
      explanation: {
        summary: parsed.summary,
        reasons: parsed.reasons.length ? parsed.reasons : bundle.reasons,
        recommendedAction: parsed.recommendedAction || recommendedActionFor(risk),
        risk,
      },
      mode: "heuristics+llm",
    };
  } catch {
    return { explanation: buildMockExplanation(bundle, text), mode: "heuristics" };
  }
}
