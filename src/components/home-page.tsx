"use client";

import { CheckerForm } from "@/components/checker-form";

export function HomePage() {
  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-mesh" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35]" aria-hidden />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <header className="mb-10 max-w-2xl">
          <p className="font-heading text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            Redflag
          </p>
          <h1 className="mt-4 text-xl font-medium leading-snug text-slate-800 sm:text-2xl">
            Paste a suspicious link or message. Get a risk score — and a plain-English why.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Deterministic heuristics catch lookalikes, young domains, and redirect chains. An optional
            Groq LLM pass explains pressure tactics and impersonation without inventing facts.
          </p>
        </header>

        <section>
          <CheckerForm />
        </section>

        <section className="mt-14 grid gap-8 border-t border-slate-900/10 pt-10 sm:grid-cols-3">
          <div className="space-y-2">
            <h2 className="font-heading text-lg font-semibold text-slate-900">Rules first</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Lookalike domains, shorteners, HTTP, IP hosts, brand mismatches, and urgency language —
              scored before any model runs.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="font-heading text-lg font-semibold text-slate-900">LLM second</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Groq turns the findings into a clear summary. No API key? The heuristics path still works
              with template explanations.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="font-heading text-lg font-semibold text-slate-900">Structured output</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              risk, score, reasons, extractedLinks, recommendedAction — JSON the UI can trust.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
