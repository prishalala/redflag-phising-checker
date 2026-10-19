# Redflag

Hybrid phishing checker for your resume: **deterministic heuristics** score a URL or pasted email/SMS, then an optional **Groq LLM** pass explains the risk in plain English and returns structured JSON.

## What it does

1. Extracts links from a URL, email, or SMS paste
2. Scores red flags: lookalike domains, brand impersonation, urgency language, shorteners, IP hosts, HTTP, suspicious TLDs, redirect chains, domain age (RDAP when available)
3. Optionally calls the Groq API to explain findings without inventing WHOIS facts
4. Returns `{ risk, score, reasons, extractedLinks, recommendedAction, … }` for a clean UI

Educational demo — not antivirus.

## Run locally

**Important:** keep the project outside OneDrive/Dropbox/Google Drive (e.g. `C:\dev\redflag`). Cloud-synced folders often corrupt `node_modules` and cause fake “default export is not a React Component” errors.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

Dev mode uses **webpack** (more reliable on Windows/OneDrive than Turbopack).

If the UI shows a React Component export error, hard-reset:

```powershell
Remove-Item -Recurse -Force .next, node_modules
npm install
npm run dev
```

Or explicitly:
```powershell
npx next dev --webpack --port 43200 --hostname 127.0.0.1
```

### Optional: Groq explanations

1. Create a free API key at [console.groq.com](https://console.groq.com)
2. Copy `.env.example` to `.env.local` and set:

```bash
GROQ_API_KEY=gsk_...
```

3. Restart `npm run dev`

Without a key, Redflag still runs on **heuristics only** (template summaries). With a key, the UI shows **Heuristics + Groq**.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- shadcn/ui
- Zod for request/response shaping
- `groq-sdk` when configured (default model: `llama-3.3-70b-versatile`)

## Project layout

- `src/lib/heuristics.ts` — scoring rules
- `src/lib/llm.ts` — Groq + mock fallback
- `src/lib/analyze.ts` — orchestration
- `src/app/api/analyze/route.ts` — POST JSON API
- `src/components/checker-form.tsx` — paste UI + demos
