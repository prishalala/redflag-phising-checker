import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeText } from "@/lib/analyze";

const BodySchema = z.object({
  text: z.string().max(20000),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. Provide { text: string } (max 20k chars)." },
        { status: 400 },
      );
    }

    if (!parsed.data.text.trim()) {
      return NextResponse.json({ error: "Paste a URL, email, or SMS first." }, { status: 400 });
    }

    const result = await analyzeText(parsed.data.text);
    return NextResponse.json(result);
  } catch (err) {
    console.error("analyze failed", err);
    return NextResponse.json(
      { error: "Analysis failed. Try again in a moment." },
      { status: 500 },
    );
  }
}
