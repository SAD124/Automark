import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: { message: "Anthropic API key not configured" } },
        { status: 500 },
      );
    }

    const payload = {
      model: body.model || "claude-3.5-sonnet-20241022",
      prompt: body.prompt || "",
      max_tokens_to_sample: body.max_tokens || 1200,
      temperature: body.temperature || 0.8,
      stop_sequences: body.stop_sequences || [],
    };

    const res = await fetch("https://api.anthropic.com/v1/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Claude proxy error:", error);
    return NextResponse.json(
      { error: { message: (error as Error).message || "Unknown error" } },
      { status: 500 },
    );
  }
}
