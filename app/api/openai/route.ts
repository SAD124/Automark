import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: { message: "OpenAI API key not configured" } },
        { status: 500 },
      );
    }

    const payload = {
      model: body.model || "gpt-4o",
      input: body.input || [],
      max_tokens: body.max_tokens || 3200,
      temperature: body.temperature || 0.8,
    };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("OpenAI proxy error:", error);
    return NextResponse.json(
      { error: { message: (error as Error).message || "Unknown error" } },
      { status: 500 },
    );
  }
}
