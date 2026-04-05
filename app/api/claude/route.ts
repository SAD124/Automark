import { NextRequest, NextResponse } from "next/server";

type ClaudeContentBlock = {
  type: string;
  text?: string;
  cache_control?: { type: string };
};

type ClaudeMessage = {
  role: "user" | "assistant";
  content: string | ClaudeContentBlock[];
};

function hasPromptCaching(value: unknown) {
  if (!Array.isArray(value)) return false;

  return value.some(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "cache_control" in item,
  );
}

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

    const system = body.system ?? "";
    const messages: ClaudeMessage[] = Array.isArray(body.messages) ? body.messages : [];

    const payload = {
      model: body.model || "claude-3-5-sonnet-latest",
      system,
      messages,
      max_tokens: body.max_tokens || 1200,
      temperature: typeof body.temperature === "number" ? body.temperature : 0.8,
      ...(Array.isArray(body.stop_sequences) ? { stop_sequences: body.stop_sequences } : {}),
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    };

    if (hasPromptCaching(system)) {
      headers["anthropic-beta"] = "prompt-caching-2024-07-31";
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error || data }, { status: res.status });
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
