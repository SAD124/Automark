import { NextResponse } from "next/server";
import {
  AI_READINESS_CATEGORY_LABELS,
  buildAIReadinessAnswerSummary,
  buildFallbackAIReadinessResult,
  normalizeAIReadinessAnswers,
  type AIReadinessCategoryId,
  type AIReadinessResult,
  type AIReadinessToolSuggestion,
} from "@/lib/ai-readiness";

type ClaudeMessageResponse = {
  content?: Array<{ type?: string; text?: string }>;
  error?: { message?: string };
};

type RawClaudeAssessment = Partial<{
  overallScore: number;
  readinessBand: string;
  summary: string;
  categoryScores:
    | Partial<Record<AIReadinessCategoryId, number>>
    | Array<{ id?: string; score?: number }>;
  recommendations: string[];
  toolSuggestions: Array<Partial<AIReadinessToolSuggestion>>;
}>;

const MODEL = "claude-3-5-sonnet-latest";

const SYSTEM_PROMPT = `You are an Auto Mark AI strategist scoring how ready a business is to adopt AI.

Return ONLY a valid JSON object with this exact shape:
{
  "overallScore": 0,
  "readinessBand": "",
  "summary": "",
  "categoryScores": {
    "systems": 0,
    "people": 0,
    "data": 0,
    "strategy": 0
  },
  "recommendations": ["", "", ""],
  "toolSuggestions": [
    { "name": "", "reason": "" },
    { "name": "", "reason": "" },
    { "name": "", "reason": "" }
  ]
}

Rules:
- All scores must be integers from 0 to 100.
- Keep the summary to 1 or 2 sentences.
- Recommendations must be specific, actionable, and business-friendly.
- Tool suggestions must be realistic operational AI solutions, not vague buzzwords.
- Use the responses and baseline rubric, but improve the wording and prioritization where helpful.
- Never include markdown, code fences, or commentary outside JSON.`;

export const runtime = "nodejs";

export async function POST(request: Request) {
  let fallbackResult: AIReadinessResult | null = null;

  try {
    const body = await request.json();
    const answers = normalizeAIReadinessAnswers(body?.answers);

    if (!answers) {
      return NextResponse.json(
        { error: "Please answer every question before submitting." },
        { status: 400 },
      );
    }

    fallbackResult = buildFallbackAIReadinessResult(answers);

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json({ result: fallbackResult });
    }

    const prompt = [
      "Business quiz responses:",
      buildAIReadinessAnswerSummary(answers),
      "",
      "Baseline scoring reference:",
      JSON.stringify(fallbackResult, null, 2),
    ].join("\n");

    try {
      const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1200,
          temperature: 0.35,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      const anthropicData = (await anthropicResponse.json()) as ClaudeMessageResponse;

      if (!anthropicResponse.ok) {
        const message =
          anthropicData.error?.message || "Claude could not score the assessment.";
        throw new Error(message);
      }

      const content = (anthropicData.content || [])
        .filter((block) => block.type === "text" && block.text)
        .map((block) => block.text)
        .join("");

      const parsed = parseAssessment(content);

      if (!parsed) {
        throw new Error("Claude returned an invalid response shape.");
      }

      const result = mergeWithFallback(parsed, fallbackResult);

      return NextResponse.json({ result });
    } catch (error) {
      console.error("AI readiness scoring fallback:", error);
      return NextResponse.json({ result: fallbackResult });
    }
  } catch (error) {
    console.error("AI readiness route error:", error);

    if (fallbackResult) {
      return NextResponse.json({ result: fallbackResult });
    }

    return NextResponse.json(
      { error: "Unable to process the assessment right now." },
      { status: 500 },
    );
  }
}

function parseAssessment(content: string): RawClaudeAssessment | null {
  const trimmed = content.trim();
  const jsonBlock = trimmed.match(/\{[\s\S]*\}/)?.[0];

  if (!jsonBlock) {
    return null;
  }

  try {
    return JSON.parse(jsonBlock) as RawClaudeAssessment;
  } catch {
    return null;
  }
}

function mergeWithFallback(
  candidate: RawClaudeAssessment,
  fallback: AIReadinessResult,
): AIReadinessResult {
  return {
    overallScore: normalizeScore(candidate.overallScore, fallback.overallScore),
    readinessBand: cleanText(candidate.readinessBand, fallback.readinessBand),
    summary: cleanText(candidate.summary, fallback.summary),
    categoryScores: normalizeCategoryScores(
      candidate.categoryScores,
      fallback.categoryScores,
    ),
    recommendations: normalizeRecommendations(
      candidate.recommendations,
      fallback.recommendations,
    ),
    toolSuggestions: normalizeToolSuggestions(
      candidate.toolSuggestions,
      fallback.toolSuggestions,
    ),
  };
}

function normalizeCategoryScores(
  candidate:
    | Partial<Record<AIReadinessCategoryId, number>>
    | Array<{ id?: string; score?: number }>
    | undefined,
  fallback: AIReadinessResult["categoryScores"],
) {
  const scoreMap = new Map<AIReadinessCategoryId, number>();

  if (Array.isArray(candidate)) {
    for (const item of candidate) {
      if (
        item.id &&
        item.id in AI_READINESS_CATEGORY_LABELS &&
        typeof item.score === "number"
      ) {
        scoreMap.set(
          item.id as AIReadinessCategoryId,
          normalizeScore(item.score, 0),
        );
      }
    }
  } else if (candidate && typeof candidate === "object") {
    for (const categoryId of Object.keys(
      AI_READINESS_CATEGORY_LABELS,
    ) as AIReadinessCategoryId[]) {
      const score = candidate[categoryId];
      if (typeof score === "number") {
        scoreMap.set(categoryId, normalizeScore(score, 0));
      }
    }
  }

  return fallback.map((category) => ({
    ...category,
    score: scoreMap.get(category.id) ?? category.score,
  }));
}

function normalizeRecommendations(candidate: string[] | undefined, fallback: string[]) {
  const normalized = Array.isArray(candidate)
    ? candidate
        .map((item) => cleanText(item, ""))
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return normalized.length === 3 ? normalized : fallback;
}

function normalizeToolSuggestions(
  candidate: Array<Partial<AIReadinessToolSuggestion>> | undefined,
  fallback: AIReadinessToolSuggestion[],
) {
  const normalized = Array.isArray(candidate)
    ? candidate
        .map((item) => ({
          name: cleanText(item.name, ""),
          reason: cleanText(item.reason, ""),
        }))
        .filter((item) => item.name && item.reason)
        .slice(0, 3)
    : [];

  return normalized.length >= 2 ? normalized : fallback;
}

function normalizeScore(value: unknown, fallback: number) {
  return typeof value === "number"
    ? Math.max(0, Math.min(100, Math.round(value)))
    : fallback;
}

function cleanText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
