"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RiskBadge } from "@/components/risk-badge";
import type { AnalysisResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, Link2, ShieldCheck, Sparkles } from "lucide-react";

function ScoreMeter({ score, risk }: { score: number; risk: AnalysisResult["risk"] }) {
  const color =
    risk === "low"
      ? "bg-teal-600"
      : risk === "medium"
        ? "bg-amber-500"
        : risk === "high"
          ? "bg-orange-500"
          : "bg-rose-600";

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Risk score</p>
          <p className="font-heading text-4xl font-semibold tracking-tight tabular-nums">{score}</p>
        </div>
        <RiskBadge risk={risk} />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/5">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", color)}
          style={{ width: `${Math.max(4, score)}%` }}
        />
      </div>
    </div>
  );
}

export function ResultPanel({
  result,
  loading,
}: {
  result: AnalysisResult | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card className="border-black/5 bg-white/70 shadow-none backdrop-blur">
        <CardContent className="space-y-4 p-6">
          <div className="h-8 w-40 animate-pulse rounded bg-black/5" />
          <div className="h-3 w-full animate-pulse rounded bg-black/5" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-black/5" />
          <div className="h-24 animate-pulse rounded-lg bg-black/5" />
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="border-dashed border-black/10 bg-white/40 shadow-none">
        <CardContent className="flex flex-col items-start gap-3 p-6 text-sm text-muted-foreground">
          <ShieldCheck className="size-6 text-teal-700" />
          <p>
            Results land here: risk score, plain-English summary, extracted links, and a recommended
            action.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="border-black/5 bg-white/80 shadow-none backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="font-heading text-xl">Verdict</CardTitle>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-2 py-1 text-xs text-teal-900">
              <Sparkles className="size-3.5" />
              {result.analysisMode === "heuristics+llm" ? "Heuristics + Groq" : "Heuristics only"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <ScoreMeter score={result.score} risk={result.risk} />
          <p className="text-base leading-relaxed text-foreground/90">{result.summary}</p>
          <Alert className="border-amber-200/80 bg-amber-50/80 text-amber-950">
            <AlertTriangle className="size-4" />
            <AlertTitle>Recommended action</AlertTitle>
            <AlertDescription>{result.recommendedAction}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {result.reasons.length > 0 && (
        <Card className="border-black/5 bg-white/80 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Why this score</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {result.reasons.map((reason, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-slate-900 text-[11px] font-medium text-white">
                    {i + 1}
                  </span>
                  <span>{reason}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {result.extractedLinks.length > 0 && (
        <Card className="border-black/5 bg-white/80 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="size-4" />
              Extracted links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.extractedLinks.map((link) => (
              <div key={link.url} className="rounded-lg border border-black/5 bg-slate-50/80 p-3">
                <p className="break-all font-mono text-xs text-foreground/80">{link.url}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Domain: {link.domain}</span>
                  {link.domainAgeDays !== null && <span>Age: ~{link.domainAgeDays}d</span>}
                  {link.redirectCount > 0 && <span>Redirects: {link.redirectCount}</span>}
                </div>
                {link.findings.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <ul className="space-y-1.5 text-sm">
                      {link.findings.map((f) => (
                        <li key={f.id}>
                          <span className="font-medium">{f.title}</span>
                          <span className="text-muted-foreground"> — {f.detail}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">{result.disclaimer}</p>
    </div>
  );
}
