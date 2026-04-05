import { NextRequest, NextResponse } from "next/server";

type OpenAIMessage = {
  role: "system" | "user" | "assistant" | "developer";
  content: string;
};

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

    const messages: OpenAIMessage[] = Array.isArray(body.messages)
      ? body.messages
      : Array.isArray(body.input)
        ? body.input
        : [];

    const payload = {
      model: body.model || "gpt-4o",
      messages,
      max_tokens: body.max_tokens || 3200,
      temperature: typeof body.temperature === "number" ? body.temperature : 0.8,
      ...(body.response_format ? { response_format: body.response_format } : {}),
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error || data }, { status: res.status });
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
