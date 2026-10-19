export type RiskLevel = "low" | "medium" | "high" | "critical";

export type FindingSeverity = "info" | "low" | "medium" | "high" | "critical";

export interface HeuristicFinding {
  id: string;
  severity: FindingSeverity;
  title: string;
  detail: string;
  points: number;
}

export interface ExtractedLink {
  url: string;
  finalUrl?: string;
  domain: string;
  findings: HeuristicFinding[];
  domainAgeDays: number | null;
  domainAgeSource: "rdap" | "estimated" | "unavailable";
  redirectCount: number;
  redirectChain: string[];
}

export interface AnalysisResult {
  risk: RiskLevel;
  score: number;
  summary: string;
  reasons: string[];
  recommendedAction: string;
  extractedLinks: ExtractedLink[];
  messageSignals: HeuristicFinding[];
  analysisMode: "heuristics+llm" | "heuristics";
  disclaimer: string;
}

export interface AnalyzeRequest {
  text: string;
}
