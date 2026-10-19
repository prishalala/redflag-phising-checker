import { recommendedActionFor, runHeuristics } from "./heuristics";
import { explainWithLlm } from "./llm";
import type { AnalysisResult } from "./types";

const DISCLAIMER =
  "Educational demo — not antivirus. Heuristics can false-positive; never rely on this alone for high-stakes decisions.";

export async function analyzeText(text: string): Promise<AnalysisResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      risk: "low",
      score: 0,
      summary: "Paste a URL, email, or SMS to analyze.",
      reasons: [],
      recommendedAction: "Provide message content to scan.",
      extractedLinks: [],
      messageSignals: [],
      analysisMode: "heuristics",
      disclaimer: DISCLAIMER,
    };
  }

  const bundle = await runHeuristics(trimmed);
  const { explanation, mode } = await explainWithLlm(trimmed, bundle);

  const risk = explanation.risk ?? bundle.risk;

  return {
    risk,
    score: bundle.score,
    summary: explanation.summary,
    reasons: explanation.reasons,
    recommendedAction: explanation.recommendedAction || recommendedActionFor(risk),
    extractedLinks: bundle.extractedLinks,
    messageSignals: bundle.messageSignals,
    analysisMode: mode,
    disclaimer: DISCLAIMER,
  };
}
