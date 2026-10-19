"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ResultPanel } from "@/components/result-panel";
import { DEMO_EXAMPLES } from "@/lib/demos";
import type { AnalysisResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, ScanSearch } from "lucide-react";

export function CheckerForm() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function runAnalyze(value: string) {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult(null);
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setResult(data as AnalysisResult);
    } catch {
      setResult(null);
      setError("Could not reach the analyzer. Is the server running?");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium text-foreground/80">
            Paste a URL, email, or SMS
          </label>
          <Textarea
            id="message"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setActiveDemo(null);
            }}
            placeholder={`Example:\nYour PayPal account will be suspended...\nhttps://paypa1-secure-login.com/verify`}
            className="min-h-48 resize-y border-black/10 bg-white/80 font-mono text-sm leading-relaxed shadow-none focus-visible:ring-teal-700/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="lg"
            disabled={pending || !text.trim()}
            onClick={() => runAnalyze(text)}
            className="bg-teal-800 text-white hover:bg-teal-900"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Scoring…
              </>
            ) : (
              <>
                <ScanSearch className="size-4" />
                Check for phishing
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending || (!text && !result)}
            onClick={() => {
              setText("");
              setResult(null);
              setError(null);
              setActiveDemo(null);
            }}
          >
            Clear
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Try a demo
          </p>
          <div className="flex flex-wrap gap-2">
            {DEMO_EXAMPLES.map((demo) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => {
                  setText(demo.text);
                  setActiveDemo(demo.id);
                  setError(null);
                  runAnalyze(demo.text);
                }}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-left text-sm transition-colors",
                  activeDemo === demo.id
                    ? "border-teal-700/40 bg-teal-50 text-teal-950"
                    : "border-black/10 bg-white/60 text-foreground/80 hover:border-teal-700/25 hover:bg-teal-50/50",
                )}
              >
                <span className="font-medium">{demo.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{demo.blurb}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900" role="alert">
            {error}
          </p>
        )}
      </div>

      <ResultPanel result={result} loading={pending} />
    </div>
  );
}
