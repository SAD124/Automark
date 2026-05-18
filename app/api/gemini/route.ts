import { NextRequest, NextResponse } from "next/server";

type GeminiMessage = {
  role: "system" | "user" | "assistant" | "developer";
  content: string;
};

type GeminiPart = {
  text: string;
};

type GeminiContent = {
  role: "user" | "model";
  parts: GeminiPart[];
};

function messagesToGemini(messages: GeminiMessage[]) {
  const systemText = messages
    .filter((message) => message.role === "system" || message.role === "developer")
    .map((message) => message.content)
    .join("\n\n");

  const contents: GeminiContent[] = messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

  return { systemText, contents };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: { message: "Gemini API key not configured" } },
        { status: 500 },
      );
    }

    const messages: GeminiMessage[] = Array.isArray(body.messages)
      ? body.messages
      : Array.isArray(body.input)
        ? body.input
        : [];

    const { systemText, contents } = messagesToGemini(messages);
    const wantsJson = body.response_format?.type === "json_object";
    const model = body.model || "gemini-2.5-flash";
    const maxOutputTokens = Math.max(
      Number(body.max_tokens || body.maxOutputTokens || 8192),
      wantsJson ? 8192 : 100,
    );

    const payload = {
      ...(systemText
        ? { systemInstruction: { parts: [{ text: systemText }] } }
        : {}),
      contents,
      generationConfig: {
        maxOutputTokens,
        temperature: typeof body.temperature === "number" ? body.temperature : 0.8,
        ...(wantsJson ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        ...(wantsJson ? { responseMimeType: "application/json" } : {}),
      },
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || data },
        { status: res.status },
      );
    }

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((part: GeminiPart) => part.text || "")
        .join("") || "";

    return NextResponse.json({
      text,
      usage: data.usageMetadata || {},
      raw: data,
    });
  } catch (error: unknown) {
    console.error("Gemini proxy error:", error);
    return NextResponse.json(
      { error: { message: (error as Error).message || "Unknown error" } },
      { status: 500 },
    );
  }
}
