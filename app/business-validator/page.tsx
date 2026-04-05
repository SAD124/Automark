"use client";

import Link from "next/link";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type CSSProperties,
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";

type ClaudeUsage = {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
};

type OpenAIUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
};

type Usage = ClaudeUsage & OpenAIUsage;

type AIResult = {
  text: string;
  usage: Usage;
};

type CompetitionRisk = "Low" | "Medium" | "High";
type Verdict = "GO" | "NO-GO" | "MAYBE";
type VerdictLabel = "STRONG GO" | "CAUTIOUS GO" | "HIGH RISK" | "NO-GO";
type RiskLevel = "Low" | "Medium" | "High" | "Critical";

type EvalScores = {
  devComplexity: number;
  launchCost: string;
  marketViability: number;
  monetizationPotential: number;
  timeToRevenue: string;
  aiLeverage: number;
  competitionRisk: CompetitionRisk;
  viralPotential: number;
};

type BudgetAssessment = {
  stated: string;
  realistic: string;
  gap: string;
  note: string;
};

type FinancialProjection = {
  breakEvenUsers: string;
  mrrTarget: string;
  timeToBreakEven: string;
  revenueYear1Low: string;
  revenueYear1High: string;
  keyAssumptions: string;
};

type Evaluation = {
  scores: EvalScores;
  executiveSummary: string;
  verdictLabel: VerdictLabel;
  riskLevel: RiskLevel;
  keyDrivers: string[];
  founderRealityCheck: string[];
  killShots: string[];
  budgetAssessment: BudgetAssessment;
  financialProjection: FinancialProjection;
  verdict: Verdict;
  confidence: number;
  verdictReason: string;
  devApproach: string;
  dependencies: string[];
  marketingApproach: string;
  monetizationStrategy: string;
  risks: string;
  additionalInsights: string;
};

type RawEvaluation = Partial<
  Omit<Evaluation, "scores" | "budgetAssessment" | "financialProjection">
> & {
  scores?: Partial<EvalScores>;
  budgetAssessment?: Partial<BudgetAssessment>;
  financialProjection?: Partial<FinancialProjection>;
};

type FormState = {
  appName: string;
  description: string;
  audience: string;
  budget: string;
  revenue: string;
};

type CostRun = {
  label: string;
  tokens: number;
  cost: number;
  cacheRead: number;
};

type Step = "input" | "agent1" | "done1" | "agent2" | "done2";
type UiTab = "preview" | "code";
type CTAState = "idle" | "ready" | "running";
type OpenMenu = "audience" | "budget" | "revenue" | null;
type ApiError = Error & { status?: number };

const EMPTY_FORM: FormState = {
  appName: "",
  description: "",
  audience: "",
  budget: "",
  revenue: "",
};

function isFormState(value: unknown): value is FormState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.appName === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.audience === "string" &&
    typeof candidate.budget === "string" &&
    typeof candidate.revenue === "string"
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
// Claude Haiku 4.5
const PRICE = {
  input: 1.0 / 1_000_000,
  output: 5.0 / 1_000_000,
  cacheWrite: 1.25 / 1_000_000,
  cacheRead: 0.1 / 1_000_000,
};
// GPT-4o (May 2024 pricing)
const PRICE_GPT4O = {
  input: 2.5 / 1_000_000,
  output: 10.0 / 1_000_000,
};

function calcGPTCost(usage?: OpenAIUsage) {
  if (!usage) return 0;
  return (
    Math.max(0, usage.prompt_tokens || 0) * PRICE_GPT4O.input +
    Math.max(0, usage.completion_tokens || 0) * PRICE_GPT4O.output
  );
}

function calcCost(usage?: ClaudeUsage) {
  if (!usage) return 0;
  return (
    Math.max(0, usage.input_tokens || 0) * PRICE.input +
    Math.max(0, usage.output_tokens || 0) * PRICE.output +
    Math.max(0, usage.cache_creation_input_tokens || 0) * PRICE.cacheWrite +
    Math.max(0, usage.cache_read_input_tokens || 0) * PRICE.cacheRead
  );
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

// Agent 1 prompt
const AGENT1_SYSTEM = `You are a brutally honest startup evaluation agent for AutoMark, a studio that rapidly launches money-making mobile apps.

Your job is to give founders the truth they need — not the encouragement they want. Be specific, quantified, and ruthless where necessary. Do not soften bad news.

Output ONLY a single valid JSON object — no markdown, no backticks, no explanation before or after.

EVALUATION RULES:
- If the budget is insufficient for the stated idea, call it out explicitly with a dollar gap
- If the market is dominated by funded incumbents, say so by name
- If the idea has structural flaws (no distribution, commodity product, no wedge), flag it as a kill shot
- Financial projections must use real-world SaaS/app benchmarks: avg mobile app DAU/MAU ratio 20-30%, avg freemium conversion 2-5%, avg CAC for mobile apps $2-15 organic / $30-80 paid
- executiveSummary must be ONE sentence, maximum 20 words, brutally direct
- VIBE CODING ERA (2024-2025): AI-assisted development has dramatically reduced costs and timelines. A solo founder using Cursor, Claude Code, Lovable, Bolt, or v0 can ship an MVP that would have cost $40k in 2022 for $2k-8k today. A simple mobile app MVP now takes 2-6 weeks solo, not 3-6 months. Factor this into ALL cost and timeline estimates. launchCost for simple apps should be $1,500-$6,000; standard SaaS $4,000-$15,000; complex apps $10,000-$35,000. timeToRevenue for simple apps: 4-10 weeks; standard: 8-16 weeks; complex: 16-32 weeks.

Parameters to score:
1. devComplexity 1-10 (lower = easier/faster to build)
2. launchCost string (realistic $ estimate factoring in AI-assisted development tools like Cursor/Claude Code — not 2020 agency rates)
3. marketViability 1-10
4. monetizationPotential 1-10
5. timeToRevenue string (realistic for a vibe-coding solo founder, accounting for MVP build + beta + first paying customer)
6. aiLeverage 1-10 (how much AI tooling reduces dev effort)
7. competitionRisk exactly one of: "Low" "Medium" "High"
8. viralPotential 1-10

Benchmarks for context fields:
- marketViability: 1-3 = niche/dying, 4-6 = moderate demand, 7-8 = proven demand, 9-10 = massive TAM
- monetizationPotential: reference real comparable apps and their revenue multiples
- devComplexity: 1-3 = no-code/template, 4-6 = standard SaaS, 7-9 = complex integrations, 10 = infra-level

Required top-level fields:
- executiveSummary: ONE brutal sentence (max 20 words) — the bottom line verdict
- verdictLabel: one of "STRONG GO" "CAUTIOUS GO" "HIGH RISK" "NO-GO" (more nuanced than GO/MAYBE/NO-GO)
- riskLevel: one of "Low" "Medium" "High" "Critical"
- keyDrivers: JSON array of exactly 3 strings — the 3 most important factors (positive or negative)
- founderRealityCheck: JSON array of 2-4 strings — hard truths the founder must hear, no sugarcoating
- killShots: JSON array of strings — structural reasons this could completely fail (empty array if none)
- budgetAssessment: object with keys: stated (string from input), realistic (string), gap (string or "none"), note (string)
- financialProjection: object with keys: breakEvenUsers (string), mrrTarget (string e.g. "$10k MRR"), timeToBreakEven (string), revenueYear1Low (string), revenueYear1High (string), keyAssumptions (string)
- devApproach: string
- dependencies: JSON array of strings
- marketingApproach: string
- monetizationStrategy: string
- risks: string
- additionalInsights: string
- verdict: exactly one of "GO" "NO-GO" "MAYBE" (keep for backward compat)
- confidence: integer 0-100
- verdictReason: string

Output this exact shape and nothing else:
{"scores":{"devComplexity":0,"launchCost":"","marketViability":0,"monetizationPotential":0,"timeToRevenue":"","aiLeverage":0,"competitionRisk":"","viralPotential":0},"executiveSummary":"","verdictLabel":"","riskLevel":"","keyDrivers":[],"founderRealityCheck":[],"killShots":[],"budgetAssessment":{"stated":"","realistic":"","gap":"","note":""},"financialProjection":{"breakEvenUsers":"","mrrTarget":"","timeToBreakEven":"","revenueYear1Low":"","revenueYear1High":"","keyAssumptions":""},"verdict":"","confidence":0,"verdictReason":"","devApproach":"","dependencies":[],"marketingApproach":"","monetizationStrategy":"","risks":"","additionalInsights":""}`;

// Agent 2: Single-pass Sonnet 4.5 — complete HTML in one shot.
const AGENT2_SYSTEM = `You are an expert mobile UI engineer. Generate a COMPLETE, valid, self-contained HTML file for a 390×844px iPhone app screen.

OUTPUT FORMAT — CRITICAL
- Start IMMEDIATELY with <!DOCTYPE html> — zero preamble, zero explanation
- No markdown fences. Raw HTML only.
- The file must end with </body></html>

STRUCTURE (copy this skeleton exactly, fill in content):
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=390px,initial-scale=1,maximum-scale=1">
<title>[APP NAME]</title>
<link href="https://fonts.googleapis.com/css2?family=[FONT1]:wght@700;800&family=[FONT2]:wght@400;500;600&display=swap" rel="stylesheet">
<style>
/* ALL CSS HERE — then close </style> BEFORE writing any HTML */
</style>
</head>
<body>
<!-- ALL HTML HERE -->
</body>
</html>

CSS RULES — write lean CSS, full design quality:
- :root with all colors as CSS vars. Choose palette matching app personality hard.
- *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
- html,body { width:390px; height:844px; overflow:hidden; font-family:'[FONT2]',sans-serif; }
- .app { display:flex; flex-direction:column; height:844px; }
- .status-bar { height:50px; padding:0 20px; display:flex; justify-content:space-between; align-items:center; flex-shrink:0; }
- .nav-bar { height:60px; padding:0 20px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
- .content { flex:1; overflow-y:auto; scrollbar-width:none; padding:0 16px 16px; }
- .content::-webkit-scrollbar { display:none; }
- .tabs { height:80px; display:flex; border-top:1px solid rgba(128,128,128,0.15); flex-shrink:0; }
- .tab { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; cursor:pointer; }
- .tab-label { font-size:10px; }
- ONE @keyframes block max: @keyframes up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
- Cards: use inline style for background gradients. Class only for border-radius, padding, margin.
- FORBIDDEN: ::before, ::after, multiple @keyframes, complex selectors. Keep rules short.

FONT CHOICE — never Arial/Inter/system:
- Fitness/energy: Syne + DM Sans
- Finance/data: Outfit + Manrope
- Food/lifestyle: Playfair Display + Nunito
- Productivity: Space Grotesk + Work Sans
- Wellness/calm: Cormorant Garamond + Lato

HTML CONTENT — write realistic populated data:
- Status bar: time "9:41" left, three SVG icons (signal/wifi/battery) right
- Nav bar: app title in heading font, 1-2 SVG icon buttons
- Content: 3-4 cards/items with real fake data (names, numbers, dates). No placeholders.
- Tabs: 4 tabs with SVG icons + labels, first one active

SVG ICONS — inline, minimal paths:
Signal: <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><rect x="0" y="6" width="3" height="6" rx="1"/><rect x="4.5" y="4" width="3" height="8" rx="1"/><rect x="9" y="1.5" width="3" height="10.5" rx="1"/><rect x="13.5" y="0" width="3" height="12" rx="1" opacity=".3"/></svg>
Wifi: <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/><path d="M8 6C9.9 6 11.6 6.8 12.8 8.1l1.5-1.5A8 8 0 008 4a8 8 0 00-6.3 2.6L3.2 8C4.4 6.8 6.1 6 8 6z" opacity=".6"/><path d="M8 2.5C11 2.5 13.7 3.8 15.5 5.9L17 4.4A11.5 11.5 0 008 1 11.5 11.5 0 00-.5 4.5L1 6C2.8 3.8 5.2 2.5 8 2.5z" opacity=".3"/></svg>
Battery: <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x=".5" y=".5" width="21" height="11" rx="3.5" stroke="currentColor" opacity=".35"/><rect x="2" y="2" width="15" height="8" rx="2" fill="currentColor"/><path d="M23 4v4a2 2 0 000-4z" fill="currentColor" opacity=".4"/></svg>
Home: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
Chart: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
Plus: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
Person: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>
Bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>

IMPORTANT: Write all CSS, close </style>, write </head>, write <body>, write all HTML, close </body></html>. Never stop mid-CSS. The </style> tag must appear before any HTML element.`;

// ─── API call with timeout + retry ───────────────────────────────────────────
const TRANSIENT_CODES = new Set([429, 500, 502, 503, 529]);

async function callClaudeOnce(
  systemPrompt: string,
  userMsg: string,
  maxTokens: number,
  signal: AbortSignal,
  model = "claude-haiku-4-5-20251001",
  useCache = true,
): Promise<AIResult> {
  const res = await fetch("/api/claude", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: useCache
        ? [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" },
            },
          ]
        : systemPrompt,
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  if (!res.ok && !TRANSIENT_CODES.has(res.status)) {
    let msg = `HTTP ${res.status}`;
    try {
      const e = await res.json();
      msg = e?.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = (await res.json()) as {
    error?: { message?: string };
    content?: Array<{ text?: string }>;
    usage?: ClaudeUsage;
  };

  if (data.error) {
    const err = Object.assign(new Error(data.error.message || "API error"), {
      status: res.status,
    });
    throw err;
  }

  const text = (data.content || []).map((block) => block.text || "").join("");
  return { text, usage: data.usage || {} };
}

async function callClaude(
  systemPrompt: string,
  userMsg: string,
  maxTokens: number,
  model = "claude-haiku-4-5-20251001",
  useCache = true,
): Promise<AIResult> {
  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutMs = model.includes("sonnet") ? 90_000 : 60_000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const result = await callClaudeOnce(
        systemPrompt,
        userMsg,
        maxTokens,
        controller.signal,
        model,
        useCache,
      );
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);
      const error = err as ApiError;
      const isTimeout = error.name === "AbortError";
      const isTransient =
        typeof error.status === "number" && TRANSIENT_CODES.has(error.status);
      const delay = attempt === 0 ? 1500 : 3000;
      if (attempt < maxAttempts - 1 && (isTimeout || isTransient)) {
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw isTimeout
        ? new Error("Request timed out after retries. Please try again.")
        : error;
    }
  }

  throw new Error("Claude request failed after retries.");
}

// ─── OpenAI call ─────────────────────────────────────────────────────────────
async function callOpenAI(
  systemPrompt: string,
  userMsg: string,
  maxTokens = 3200,
): Promise<AIResult> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    try {
      const res = await fetch("/api/openai", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o",
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMsg },
          ],
          response_format: { type: "json_object" },
        }),
      });

      clearTimeout(timer);

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const e = await res.json();
          msg = e?.error?.message || msg;
        } catch {}
        const err = Object.assign(new Error(msg), { status: res.status });
        if (attempt < 2 && [429, 500, 502, 503].includes(res.status)) {
          await new Promise((r) => setTimeout(r, attempt === 0 ? 1500 : 3000));
          continue;
        }
        throw err;
      }

      const data = (await res.json()) as {
        error?: { message?: string };
        choices?: Array<{ message?: { content?: string } }>;
        usage?: OpenAIUsage;
      };
      if (data.error) throw new Error(data.error.message || "OpenAI error");

      const text = data.choices?.[0]?.message?.content || "";
      const usage = data.usage || {};
      return { text, usage };
    } catch (err) {
      clearTimeout(timer);
      const error = err as ApiError;
      const isTimeout = error.name === "AbortError";
      if (attempt < 2 && isTimeout) {
        await new Promise((r) => setTimeout(r, attempt === 0 ? 1500 : 3000));
        continue;
      }
      throw isTimeout
        ? new Error("OpenAI timed out after retries. Please try again.")
        : error;
    }
  }

  throw new Error("OpenAI request failed after retries.");
}

// ─── JSON parse with truncation repair ───────────────────────────────────────
function parseAgentJSON(raw: string): RawEvaluation {
  const match = raw.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error(
      "Agent returned no JSON object. Raw output: " + raw.slice(0, 200)
    );
  }

  try {
    return JSON.parse(match[0]) as RawEvaluation;
  } catch {
    throw new Error("Invalid JSON format from agent");
  }
}

// ─── HTML builder (repair truncation) ────────────────────────────────────────
function buildHTML(rawHTML: string) {
  let html = rawHTML;
  const fenced = html.match(/```(?:html)?\s*\n([\s\S]*?)```/i);
  if (fenced) html = fenced[1];
  const doctypeIdx = html.search(/<!DOCTYPE\s+html/i);
  if (doctypeIdx > 0) html = html.slice(doctypeIdx);
  html = html.trim();
  if (!html) return html;
  const styleOpen = html.indexOf("<style>");
  const styleClose = html.indexOf("</style>");
  if (styleOpen !== -1 && styleClose === -1) {
    const afterStyle = html.slice(styleOpen + 7);
    const htmlLeak = afterStyle.match(/\n\s*<[a-zA-Z]/);
    if (htmlLeak) {
      const cutIdx = styleOpen + 7 + (htmlLeak.index ?? 0);
      const cssContent = html.slice(styleOpen + 7, cutIdx);
      const lastBrace = cssContent.lastIndexOf("}");
      const cleanCSS =
        lastBrace !== -1 ? cssContent.slice(0, lastBrace + 1) : cssContent;
      const leaked = html.slice(cutIdx).replace(/^[^<]*/, "");
      html =
        html.slice(0, styleOpen + 7) +
        cleanCSS +
        "\n  </style>\n</head>\n<body>\n" +
        leaked;
    } else {
      html += "\n  </style>\n</head>\n<body>\n</body>";
    }
  }
  if (html.includes("<!DOCTYPE") && !html.includes("</html>")) {
    if (!html.includes("</body>")) html += "\n  </div>\n</body>";
    html += "\n</html>";
  }
  return html;
}

// ─── Evaluation validator ─────────────────────────────────────────────────────
const VALID_VERDICTS = new Set(["GO", "NO-GO", "MAYBE"]);
const VALID_RISKS = new Set(["Low", "Medium", "High"]);
const VALID_VERDICT_LABELS = new Set([
  "STRONG GO",
  "CAUTIOUS GO",
  "HIGH RISK",
  "NO-GO",
]);
const VALID_RISK_LEVELS = new Set(["Low", "Medium", "High", "Critical"]);

function normalizeEval(raw: RawEvaluation): Evaluation {
  const s = raw.scores || {};
  const fp = raw.financialProjection || {};
  const ba = raw.budgetAssessment || {};
  return {
    scores: {
      devComplexity: clampScore(s.devComplexity),
      launchCost: String(s.launchCost || "Unknown"),
      marketViability: clampScore(s.marketViability),
      monetizationPotential: clampScore(s.monetizationPotential),
      timeToRevenue: String(s.timeToRevenue || "Unknown"),
      aiLeverage: clampScore(s.aiLeverage),
      competitionRisk:
        typeof s.competitionRisk === "string" &&
        VALID_RISKS.has(s.competitionRisk)
          ? (s.competitionRisk as CompetitionRisk)
          : "Medium",
      viralPotential: clampScore(s.viralPotential),
    },
    verdict:
      typeof raw.verdict === "string" && VALID_VERDICTS.has(raw.verdict)
        ? (raw.verdict as Verdict)
        : "MAYBE",
    verdictLabel:
      typeof raw.verdictLabel === "string" &&
      VALID_VERDICT_LABELS.has(raw.verdictLabel)
        ? (raw.verdictLabel as VerdictLabel)
      : raw.verdict === "GO"
        ? "CAUTIOUS GO"
        : raw.verdict === "NO-GO"
          ? "NO-GO"
          : "HIGH RISK",
    riskLevel:
      typeof raw.riskLevel === "string" && VALID_RISK_LEVELS.has(raw.riskLevel)
        ? (raw.riskLevel as RiskLevel)
        : "Medium",
    confidence: Math.min(100, Math.max(0, Number(raw.confidence) || 50)),
    executiveSummary: String(raw.executiveSummary || raw.verdictReason || ""),
    verdictReason: String(raw.verdictReason || "No reason provided."),
    keyDrivers: Array.isArray(raw.keyDrivers)
      ? raw.keyDrivers.slice(0, 3).map(String)
      : [],
    founderRealityCheck: Array.isArray(raw.founderRealityCheck)
      ? raw.founderRealityCheck.map(String)
      : [],
    killShots: Array.isArray(raw.killShots) ? raw.killShots.map(String) : [],
    budgetAssessment: {
      stated: String(ba.stated || "Unknown"),
      realistic: String(ba.realistic || "Unknown"),
      gap: String(ba.gap || "none"),
      note: String(ba.note || ""),
    },
    financialProjection: {
      breakEvenUsers: String(fp.breakEvenUsers || "Unknown"),
      mrrTarget: String(fp.mrrTarget || "Unknown"),
      timeToBreakEven: String(fp.timeToBreakEven || "Unknown"),
      revenueYear1Low: String(fp.revenueYear1Low || "Unknown"),
      revenueYear1High: String(fp.revenueYear1High || "Unknown"),
      keyAssumptions: String(fp.keyAssumptions || ""),
    },
    devApproach: String(raw.devApproach || ""),
    dependencies: Array.isArray(raw.dependencies)
      ? raw.dependencies.map(String)
      : [],
    marketingApproach: String(raw.marketingApproach || ""),
    monetizationStrategy: String(raw.monetizationStrategy || ""),
    risks: String(raw.risks || ""),
    additionalInsights: String(raw.additionalInsights || ""),
  };
}

function clampScore(v: unknown) {
  if (v == null) return 5;
  const n = Number(v);
  return isNaN(n) ? 5 : Math.min(10, Math.max(1, Math.round(n)));
}

// ─── Draft / Examples ─────────────────────────────────────────────────────────
const DRAFT_KEY = "automark_draft_v1";

const EXAMPLE_IDEAS = [
  {
    name: "ReceiptRadar",
    desc: "AI that scans receipts, auto-categorizes expenses, and flags tax-deductible items. Syncs with bank accounts. Target: freelancers and self-employed.",
  },
  {
    name: "SleepStack",
    desc: "Sleep optimizer that correlates phone usage, caffeine intake, and workout data with sleep quality. Gives a nightly score and one actionable tip. Target: biohackers and remote workers.",
  },
  {
    name: "PitchDeck AI",
    desc: "Paste your startup idea, get a 10-slide investor deck generated in 60 seconds. Export to PowerPoint or share as a link. Target: early-stage founders.",
  },
];

const TARGET_AUDIENCE_OPTIONS = [
  "Enterprise AI / B2B",
  "Founders / Startups",
  "Freelancers / Solopreneurs",
  "Agencies / Service Businesses",
  "Creators / Influencers",
  "Developers / Technical Teams",
  "Healthcare / Clinics",
  "Finance / Fintech",
];

const AUDIENCE_PILL_OPTIONS = [
  {
    label: "Enterprise",
    detail: "Complex buying committees, longer contracts, and high-value operational pain.",
  },
  {
    label: "SMBs",
    detail: "Lean teams that need fast ROI, simple onboarding, and practical automation wins.",
  },
  {
    label: "Founders",
    detail: "Early-stage operators seeking speed, leverage, and proof of demand before scaling.",
  },
  {
    label: "Freelancers",
    detail: "Solo operators optimizing time, client throughput, and repeatable delivery systems.",
  },
  {
    label: "Creators",
    detail: "Audience-led businesses focused on engagement, monetization, and content velocity.",
  },
  {
    label: "Developers",
    detail: "Technical users who care about workflow fit, integrations, and implementation depth.",
  },
  {
    label: "Agencies",
    detail: "Service teams looking to productize execution and improve margin per client account.",
  },
  {
    label: "Students",
    detail: "Price-sensitive learners responding to accessibility, habit loops, and clear outcomes.",
  },
] as const;

const BUDGET_OPTIONS = [
  "$500 - $2k",
  "$2k - $5k",
  "$5k - $10k",
  "$10k - $25k",
  "$25k - $50k",
  "$50k - $100k+",
];

const REVENUE_MODEL_OPTIONS = [
  {
    label: "Monthly SaaS subscription",
    detail: "Recurring monthly plans for ongoing access and features.",
  },
  {
    label: "Freemium + paid upgrade",
    detail: "Free entry point with premium unlocks for power users.",
  },
  {
    label: "One-time purchase",
    detail: "Single upfront payment for a focused offer or toolkit.",
  },
  {
    label: "Usage-based pricing",
    detail: "Charge by actions, credits, API calls, or generated output.",
  },
  {
    label: "Lead generation / agency upsell",
    detail: "Use the app to convert traffic into service revenue.",
  },
  {
    label: "Marketplace commission",
    detail: "Take a percentage on transactions between buyers and sellers.",
  },
  {
    label: "Advertising / sponsorship",
    detail: "Monetize attention with placements, sponsors, or brand deals.",
  },
];

const FRAMEWORK_POINTS = [
  {
    code: "M",
    title: "Market Saturation Analysis",
    description:
      "Signal scanning across direct competitors, substitutes, and adjacent workflow tools to expose positioning risk fast.",
  },
  {
    code: "E",
    title: "Economic Viability",
    description:
      "Budget realism, monetization pressure, and break-even logic synthesized into a founder-grade commercial readout.",
  },
  {
    code: "T",
    title: "Technical Feasibility",
    description:
      "Execution complexity, dependency bottlenecks, and AI leverage mapped before the build path gets expensive.",
  },
];

function parseAudienceTokens(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mergeAudienceToken(tokens: string[], nextToken: string) {
  if (!nextToken) return tokens;
  if (tokens.includes(nextToken)) return tokens;
  return [...tokens, nextToken];
}

function removeAudienceToken(tokens: string[], token: string) {
  return tokens.filter((item) => item !== token);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Benchmark context per metric
const BENCHMARKS = {
  marketViability: { low: 4, high: 7, label: "vs. avg consumer app (6/10)" },
  monetizationPotential: {
    low: 4,
    high: 7,
    label: "vs. avg mobile SaaS (6/10)",
  },
  aiLeverage: { low: 4, high: 7, label: "vs. avg AI-assisted app (6/10)" },
  viralPotential: { low: 3, high: 6, label: "vs. avg mobile app (5/10)" },
  devComplexity: { low: 4, high: 7, label: "standard SaaS = 5-7/10" },
};

type MetricKey = keyof typeof BENCHMARKS;
type Benchmark = (typeof BENCHMARKS)[MetricKey];

function ProgressBar({
  label,
  metricKey,
  value,
  invert = false,
  benchmark,
}: {
  label: string;
  metricKey: MetricKey;
  value: number;
  invert?: boolean;
  benchmark?: Benchmark;
}) {
  const safe = isNaN(value) ? 5 : value;
  const adjusted = invert ? Math.max(0, 11 - safe) : safe;
  const pct = Math.round((adjusted / 10) * 100);
  const isGood = invert ? safe <= 4 : safe >= 7;
  const isMid = invert ? safe <= 7 : safe >= 4;
  const color = isGood
    ? "var(--primary)"
    : isMid
      ? "var(--secondary)"
      : "#ff4444";
  const bm = benchmark || BENCHMARKS[metricKey];
  const bmPct = bm ? ((invert ? bm.low : bm.high) / 10) * 100 : null;
  const contextLabel = invert
    ? safe <= 4
      ? "Low build risk"
      : safe <= 7
        ? "Moderate complexity"
        : "High build risk"
    : safe >= 7
      ? "Strong signal"
      : safe >= 4
        ? "Moderate"
        : "Weak signal";
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (pct / 100) * circumference;
  return (
    <div
      className="grid justify-items-center gap-2 text-center"
      data-metric={metricKey}
    >
      <div className="relative h-24 w-24">
        <svg
          viewBox="0 0 96 96"
          className="h-24 w-24"
          aria-hidden="true"
        >
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            transform="rotate(-90 48 48)"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-heading text-[18px] tracking-[-0.05em] text-[#f2f6f4]">
            {pct}%
          </span>
        </div>
      </div>
      <p className="m-0 text-[10px] uppercase tracking-[0.14em] text-[#9aa7a2]">
        {label}
      </p>
      <p className="m-0 text-[10px] text-[#778580]">{contextLabel}</p>
      {bm && (
        <div
          className="max-w-[15ch] text-center text-[9px] leading-[1.5] text-[#62706b]"
          title="Industry benchmark"
        >
          {bm.label}
          {bmPct !== null ? ` · ref ${Math.round(bmPct)}%` : ""}
        </div>
      )}
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1 inline-block rounded-[4px] border border-[#2f3936] bg-[#111] px-[9px] py-[3px] text-[11px] text-[#b1beb9]">
      {children}
    </span>
  );
}

function CollapsibleSection({
  title,
  summary,
  content,
  supplementary,
  defaultOpen = false,
}: {
  title: string;
  summary: string;
  content: string;
  supplementary?: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/8 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 bg-transparent px-[18px] py-4 text-left text-[#edf2ef]"
        title={summary}
      >
        <span className="text-[11px] uppercase tracking-[0.16em]">{title}</span>
        <span className="text-[20px] leading-none text-[#87948f]" aria-hidden="true">
          <span
            className={`inline-block text-[20px] leading-none transition-transform duration-200 ${
              open ? "rotate-45 text-[var(--primary)]" : ""
            }`}
          >
            ▼
          </span>
        </span>
      </button>
      {!open && summary ? (
        <p className="m-0 px-[18px] pb-4 text-[12px] leading-[1.65] text-[#8c9994]">{summary}</p>
      ) : null}
      {open ? (
        <div className="grid gap-[14px] px-[18px] pb-[18px]">
          <p className="m-0 whitespace-pre-wrap text-[13px] leading-[1.82] text-[#d9e1de]">
          {content || "—"}
        </p>
          {supplementary ? (
            <div className="grid gap-3 border-t border-white/6 pt-1 md:grid-cols-2">{supplementary}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Spinner({
  label,
  substep,
  isAgent2 = false,
}: {
  label: string;
  substep?: string;
  isAgent2?: boolean;
}) {
  const [tick, setTick] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);

  const agent1Messages = [
    "Reading your idea...",
    "Cross-referencing market data...",
    "Calculating dev complexity...",
    "Running financial models...",
    "Assessing competition landscape...",
    "Generating viability signals...",
    "Claude + GPT-4o in parallel...",
    "Finalizing evaluation...",
  ];

  const agent2Messages = [
    "Picking fonts & color palette...",
    "Designing layout structure...",
    "Building UI components...",
    "Adding realistic content...",
    "Polishing interactions...",
    "Assembling final screen...",
  ];

  const messages = isAgent2 ? agent2Messages : agent1Messages;

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % messages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [messages.length]);

  const steps = [
    { id: "css", label: "Designing color system & layout..." },
    { id: "html", label: "Building app content & data..." },
    { id: "stitch", label: "Assembling final document..." },
  ];

  // Animated bar segments
  const bars = Array.from({ length: 12 });

  return (
    <div style={{ textAlign: "center", padding: "72px 24px" }}>
      {/* Orbital ring animation */}
      <div
        style={{
          position: "relative",
          width: 64,
          height: 64,
          margin: "0 auto 28px",
        }}
      >
        {/* Outer ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid #1a1a1a",
            borderTop: "2px solid var(--primary)",
            borderRight: "2px solid var(--primary)44",
            animation: "spin 1s cubic-bezier(0.4,0,0.6,1) infinite",
          }}
        />
        {/* Inner ring counter-rotating */}
        <div
          style={{
            position: "absolute",
            inset: 10,
            borderRadius: "50%",
            border: "1.5px solid #111",
            borderBottom: "1.5px solid var(--secondary)",
            borderLeft: "1.5px solid var(--secondary)44",
            animation: "spin 1.4s cubic-bezier(0.4,0,0.6,1) infinite reverse",
          }}
        />
        {/* Center pulse dot */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--primary)",
            boxShadow: "0 0 8px var(--primary), 0 0 16px var(--primary)44",
            animation: "agent-pulse 1.2s ease-in-out infinite",
          }}
        />
      </div>

      {/* Animated label */}
      <p
        style={{
          color: "#777",
          fontSize: 11,
          letterSpacing: 2.5,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {label}
      </p>

      {/* Rotating status messages */}
      <p
        style={{
          color: "var(--primary)",
          fontSize: 12,
          letterSpacing: 0.5,
          marginBottom: 28,
          minHeight: 18,
          transition: "opacity 0.3s",
        }}
      >
        {messages[msgIdx]}
      </p>

      {/* Animated activity bars */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 3,
          marginBottom: substep ? 28 : 0,
        }}
      >
        {bars.map((_, i) => {
          const height = 4 + Math.abs(Math.sin(tick * 0.18 + i * 0.6)) * 20;
          const isGreen = i % 3 === 0;
          return (
            <div
              key={i}
              style={{
                width: 3,
                height: Math.round(height),
                borderRadius: 2,
                background: isGreen
                  ? "var(--primary)"
                  : i % 3 === 1
                    ? "var(--primary)66"
                    : "#1e1e1e",
                transition: "height 0.08s ease",
                alignSelf: "flex-end",
              }}
            />
          );
        })}
      </div>

      {substep && (
        <div
          style={{
            display: "inline-flex",
            flexDirection: "column",
            gap: 10,
            textAlign: "left",
            marginTop: 8,
          }}
        >
          {steps.map((s) => {
            const done =
              (s.id === "css" && ["html", "stitch"].includes(substep)) ||
              (s.id === "html" && substep === "stitch");
            const active = s.id === substep;
            return (
              <div
                key={s.id}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: done
                      ? "var(--primary)"
                      : active
                        ? "var(--secondary)"
                        : "#222",
                    boxShadow: active
                      ? "0 0 8px var(--secondary), 0 0 16px var(--secondary)33"
                      : done
                        ? "0 0 6px var(--primary)55"
                        : "none",
                    transition: "background 0.3s, box-shadow 0.3s",
                  }}
                />
                <span
                  style={{
                    color: done ? "var(--primary)" : active ? "#fff" : "#444",
                    fontSize: 12,
                    transition: "color 0.3s",
                  }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* function CostBar({ runs }: { runs: CostRun[] }) {
  if (!runs.length) return null;
  const total = runs.reduce((s, r) => s + r.cost, 0);
  const totalTokens = runs.reduce((s, r) => s + r.tokens, 0);
  const cachedTokens = runs.reduce((s, r) => s + (r.cacheRead || 0), 0);
  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px solid #1a1a1a",
        borderRadius: 8,
        padding: "14px 18px",
        marginBottom: 24,
        display: "flex",
        gap: 20,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <div>
        <div
          style={{
            color: "#333",
            fontSize: 10,
            letterSpacing: 1.5,
            marginBottom: 3,
          }}
        >
          THIS RUN
        </div>
        <div
          style={{
            color: "var(--primary)",
            fontSize: 20,
            fontWeight: 700,
            fontFamily: "monospace",
          }}
        >
          ${total.toFixed(5)}
        </div>
      </div>
      <div
        style={{ width: 1, height: 36, background: "#1e1e1e", flexShrink: 0 }}
      />
      <div>
        <div
          style={{
            color: "#333",
            fontSize: 10,
            letterSpacing: 1.5,
            marginBottom: 3,
          }}
        >
          TOKENS
        </div>
        <div style={{ color: "#888", fontSize: 14, fontFamily: "monospace" }}>
          {totalTokens.toLocaleString()}
        </div>
      </div>
      {cachedTokens > 0 && (
        <>
          <div
            style={{
              width: 1,
              height: 36,
              background: "#1e1e1e",
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                color: "#333",
                fontSize: 10,
                letterSpacing: 1.5,
                marginBottom: 3,
              }}
            >
              ⚡ CACHED
            </div>
            <div
              style={{
                color: "var(--secondary)",
                fontSize: 14,
                fontFamily: "monospace",
              }}
            >
              {cachedTokens.toLocaleString()} tok @ 90% off
            </div>
          </div>
        </>
      )}
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        {runs.map((r, i) => (
          <div
            key={i}
            style={{ display: "flex", gap: 10, alignItems: "center" }}
          >
            <span style={{ color: "#2a2a2a", fontSize: 10, minWidth: 100 }}>
              {r.label}
            </span>
            <span
              style={{ color: "#444", fontSize: 11, fontFamily: "monospace" }}
            >
              {r.tokens.toLocaleString()} tok
            </span>
            <span
              style={{
                color: "var(--primary)",
                fontSize: 11,
                fontFamily: "monospace",
              }}
            >
              ${r.cost.toFixed(5)}
            </span>
            {r.cacheRead > 0 && (
              <span style={{ color: "var(--secondary)", fontSize: 10 }}>
                ⚡
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} */

function PhonePreview({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  useEffect(() => {
    if (!html) return;
    const frame = iframeRef.current;
    if (!frame) return;
    frame.srcdoc = html;
  }, [html]);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "28px 0 20px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 414,
          background: "linear-gradient(145deg,#2a2a2a,#1a1a1a)",
          borderRadius: 52,
          padding: "12px",
          boxShadow:
            "0 0 0 1px #333,0 0 0 3px #111,0 40px 100px rgba(0,0,0,.9),inset 0 1px 0 #444",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -3,
            top: 116,
            width: 3,
            height: 32,
            background: "#333",
            borderRadius: "3px 0 0 3px",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -3,
            top: 164,
            width: 3,
            height: 60,
            background: "#333",
            borderRadius: "3px 0 0 3px",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -3,
            top: 236,
            width: 3,
            height: 60,
            background: "#333",
            borderRadius: "3px 0 0 3px",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -3,
            top: 156,
            width: 3,
            height: 76,
            background: "#333",
            borderRadius: "0 3px 3px 0",
          }}
        />
        <div
          style={{
            borderRadius: 42,
            overflow: "hidden",
            background: "#000",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 13,
              left: "50%",
              transform: "translateX(-50%)",
              width: 122,
              height: 35,
              background: "#000",
              borderRadius: 20,
              zIndex: 10,
              boxShadow: "0 0 0 1px #222",
            }}
          />
          <iframe
            ref={iframeRef}
            style={{
              width: 390,
              height: 844,
              border: "none",
              display: "block",
            }}
            title="App Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: "50%",
            transform: "translateX(-50%)",
            width: 130,
            height: 5,
            background: "#444",
            borderRadius: 3,
          }}
        />
      </div>
    </div>
  );
}

// ─── AI Personas Bar ─────────────────────────────────────────────────────────
const CEO_PHOTOS = {
  dario: "https://unavatar.io/x/dario_amodei",
  sam: "https://unavatar.io/x/sama",
};

type PersonaKey = keyof typeof CEO_PHOTOS;

function CeoAvatar({
  name,
  accent,
  src,
}: {
  name: string;
  accent: string;
  src: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Styled initials fallback — always present underneath */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${accent}22 0%, ${accent}08 100%)`,
          fontSize: 16,
          fontWeight: 800,
          color: accent,
          fontFamily: "monospace",
          letterSpacing: 1,
        }}
      >
        {initials}
      </div>
      {/* Real photo layered on top — hides on load error */}
      {!imgFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
          }}
          onError={() => setImgFailed(true)}
        />
      )}
    </div>
  );
}

const vlColorFn = (label: VerdictLabel) =>
  label === "STRONG GO"
    ? "var(--primary)"
    : label === "CAUTIOUS GO"
      ? "#a8ff78"
      : label === "HIGH RISK"
        ? "var(--secondary)"
        : "#ff4444";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AIPersonasBarLegacy({
  claudeEval,
  gptEval,
  gptError,
}: {
  claudeEval?: Evaluation;
  gptEval: Evaluation | null;
  gptError: string;
}) {
  const personas = [
    {
      key: "dario" as PersonaKey,
      name: "Dario Amodei",
      title: "CEO · Anthropic",
      accent: "var(--primary)",
      eval: claudeEval || null,
      tag: "CLAUDE",
    },
    {
      key: "sam" as PersonaKey,
      name: "Sam Altman",
      title: "CEO · OpenAI",
      accent: "#74b9ff",
      eval: gptEval,
      tag: "GPT-4o",
    },
  ];

  return (
    <div className="mt-4 border-t border-[#161616] pt-[14px]">
      <div className="mb-[10px] text-[9px] uppercase tracking-[0.2em] text-[#666]">
        DUAL AI ANALYSIS
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {personas.map((p) => {
          const isLoading = p.key === "sam" && !p.eval && !gptError;
          const hasError = p.key === "sam" && Boolean(gptError);
          const cardEval = p.eval;
          const quote = cardEval?.executiveSummary
            ? `"${cardEval.executiveSummary}"`
            : isLoading
              ? "Running secondary model review against the same market brief."
              : hasError
                ? gptError
                    .replace("GPT-4o unavailable: ", "")
                    .replace("GPT-4o parse error: ", "")
                : "No secondary take available yet.";
          return (
            <div
              key={p.key}
              className="relative min-h-[168px] overflow-hidden border bg-[#141414] px-[18px] pb-[16px] pt-[15px]"
              style={{ borderColor: `${p.accent}26` }}
            >
              <div className="pointer-events-none absolute inset-y-0 right-[56px] w-px bg-white/5" />
              <div
                className="pointer-events-none absolute right-[18px] top-[18px] flex h-9 w-9 items-center justify-center border border-white/8 bg-white/[0.02]"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/35" fill="none">
                  <path
                    d="M12 3l6 3v5c0 4.1-2.3 7.2-6 10-3.7-2.8-6-5.9-6-10V6l6-3z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                </svg>
              </div>
              {/* Photo */}
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 bg-[#111]"
                  style={{ borderColor: `${p.accent}55` }}
                >
                  <CeoAvatar
                    name={p.name}
                    accent={p.accent}
                    src={CEO_PHOTOS[p.key]}
                  />
                </div>

                {/* Info + verdict */}
                <div className="min-w-0 flex-1">
                  <div className="mb-[2px] text-[12px] font-semibold text-[#e0e0e0]">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-[#5e6764]">{p.title}</div>
                </div>
              </div>

                <div className="mt-5 border-t border-white/5 pt-4">
                  <p className="min-h-[56px] max-w-[44ch] text-[11px] leading-[1.55] text-[#8d9793]">
                    {quote}
                  </p>

                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      {cardEval ? (
                        <>
                          <div
                            className="text-[9px] uppercase tracking-[0.14em]"
                            style={{ color: vlColorFn(cardEval.verdictLabel) }}
                          >
                            {cardEval.verdictLabel}
                          </div>
                          <div className="mt-1 text-[9px] uppercase tracking-[0.14em] text-[#7f8a86]">
                            {p.tag}, {cardEval.confidence}% confidence
                          </div>
                        </>
                      ) : isLoading ? (
                        <>
                          <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.14em] text-[#74b9ff]">
                            <span className="h-[5px] w-[5px] rounded-full border border-[#74b9ff] border-t-transparent animate-spin" />
                            Syncing model
                          </div>
                          <div className="mt-1 text-[9px] uppercase tracking-[0.14em] text-[#7f8a86]">
                            {p.tag}, pending response
                          </div>
                        </>
                      ) : hasError ? (
                        <>
                          <div className="text-[9px] uppercase tracking-[0.14em] text-[#ff8c8c]">
                            Review interrupted
                          </div>
                          <div className="mt-1 text-[9px] uppercase tracking-[0.14em] text-[#7f8a86]">
                            {p.tag}, unavailable
                          </div>
                        </>
                      ) : null}
                    </div>

                    <span
                      className="shrink-0 text-[8px] uppercase tracking-[0.18em]"
                      style={{ color: p.accent }}
                    >
                      {p.tag}
                    </span>
                  </div>
                </div>

                <div className="hidden">
                {p.key === "dario" && p.eval && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          color: vlColorFn(p.eval.verdictLabel),
                          fontSize: 13,
                          fontWeight: 800,
                          letterSpacing: 2,
                        }}
                      >
                        {p.eval.verdictLabel}
                      </span>
                      <span style={{ color: "#444", fontSize: 10 }}>
                        {p.eval.confidence}%
                      </span>
                    </div>
                    {p.eval.executiveSummary && (
                      <p
                        style={{
                          color: "#666",
                          fontSize: 11,
                          fontStyle: "italic",
                          lineHeight: 1.5,
                        }}
                      >
                        &ldquo;{p.eval.executiveSummary}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {/* GPT loading */}
                {isLoading && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    ✓ Verdict shown above
                  </div>
                )}

                {/* GPT loading */}
                {isLoading && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        border: `1px solid ${p.accent}`,
                        borderTop: `1px solid transparent`,
                        animation: "spin 0.9s linear infinite",
                      }}
                    />
                    <span style={{ color: "#444", fontSize: 11 }}>
                      Analyzing…
                    </span>
                  </div>
                )}

                {/* GPT error */}
                {hasError && (
                  <div
                    style={{
                      color: "#ff444488",
                      fontSize: 10,
                      lineHeight: 1.4,
                    }}
                  >
                    ⚠{" "}
                    {gptError
                      .replace("GPT-4o unavailable: ", "")
                      .replace("GPT-4o parse error: ", "")}
                  </div>
                )}

                {/* GPT verdict inline */}
                {p.key === "sam" && p.eval && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          color: vlColorFn(p.eval.verdictLabel),
                          fontSize: 13,
                          fontWeight: 800,
                          letterSpacing: 2,
                        }}
                      >
                        {p.eval.verdictLabel}
                      </span>
                      <span style={{ color: "#444", fontSize: 10 }}>
                        {p.eval.confidence}%
                      </span>
                    </div>
                    {p.eval.executiveSummary && (
                      <p
                        style={{
                          color: "#666",
                          fontSize: 11,
                          fontStyle: "italic",
                          lineHeight: 1.5,
                        }}
                      >
                        &ldquo;{p.eval.executiveSummary}&rdquo;
                      </p>
                    )}
                  </div>
                )}
                </div>
            </div>
          );
        })}
      </div>

      {/* Consensus bar — only when both results available */}
      {gptEval && <ConsensusBar gptEval={gptEval} />}
    </div>
  );
}

// ─── Consensus Score ──────────────────────────────────────────────────────────
function AIPersonasBar({
  claudeEval,
  gptEval,
  gptError,
}: {
  claudeEval?: Evaluation;
  gptEval: Evaluation | null;
  gptError: string;
}) {
  const cleanGptError = gptError
    .replace("GPT-4o unavailable: ", "")
    .replace("GPT-4o parse error: ", "");
  const personas = [
    {
      key: "dario" as PersonaKey,
      name: "Dario Amodei",
      title: "CEO · Anthropic",
      accent: "var(--primary)",
      eval: claudeEval || null,
      tag: "CLAUDE",
    },
    {
      key: "sam" as PersonaKey,
      name: "Sam Altman",
      title: "CEO · OpenAI",
      accent: "#74b9ff",
      eval: gptEval,
      tag: "GPT-4o",
    },
  ];
  const [activePersonaKey, setActivePersonaKey] = useState<PersonaKey | null>(
    claudeEval ? "dario" : gptEval || gptError ? "sam" : null,
  );
  const activePersona =
    personas.find((persona) => persona.key === activePersonaKey) || null;
  const activeEval = activePersona?.eval || null;
  const activeLoading =
    activePersona?.key === "sam" && !activePersona.eval && !gptError;
  const activeError = activePersona?.key === "sam" && Boolean(gptError);
  const memoSignals =
    activeEval?.keyDrivers && activeEval.keyDrivers.length > 0
      ? activeEval.keyDrivers.slice(0, 3)
      : activeEval?.founderRealityCheck?.slice(0, 3) || [];
  const memoRisks =
    activeEval?.killShots && activeEval.killShots.length > 0
      ? activeEval.killShots.slice(0, 3)
      : activeEval?.founderRealityCheck?.slice(0, 3) || [];
  const scoreImprovers =
    activeEval?.founderRealityCheck && activeEval.founderRealityCheck.length > 0
      ? activeEval.founderRealityCheck.slice(0, 3)
      : activeEval?.dependencies?.slice(0, 3) ||
        (activeEval?.additionalInsights ? [activeEval.additionalInsights] : []);
  const recommendedMoves: Array<{ label: string; value: string }> = [];

  if (activeEval?.devApproach) {
    recommendedMoves.push({
      label: "Build track",
      value: activeEval.devApproach,
    });
  }
  if (activeEval?.monetizationStrategy) {
    recommendedMoves.push({
      label: "Revenue track",
      value: activeEval.monetizationStrategy,
    });
  }
  if (activeEval?.marketingApproach) {
    recommendedMoves.push({
      label: "Distribution track",
      value: activeEval.marketingApproach,
    });
  }

  return (
    <div
      style={{ borderTop: "1px solid #161616", marginTop: 16, paddingTop: 14 }}
    >
      <div
        style={{
          color: "#666",
          fontSize: 9,
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        DUAL AI ANALYSIS
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {personas.map((p) => {
          const isLoading = p.key === "sam" && !p.eval && !gptError;
          const hasError = p.key === "sam" && Boolean(gptError);
          const isActive = activePersonaKey === p.key;
          return (
            <button
              key={p.key}
              type="button"
              aria-pressed={isActive}
              onClick={() =>
                setActivePersonaKey((current) =>
                  current === p.key ? null : p.key,
                )
              }
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                flex: "1 1 220px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  background: "#0f0f0f",
                  border: `1px solid ${isActive ? `${p.accent}66` : `${p.accent}33`}`,
                  borderRadius: 8,
                  padding: "12px 14px",
                  minHeight: 136,
                  boxShadow: isActive ? `0 0 0 1px ${p.accent}14` : "none",
                  transition: "border-color 180ms ease, box-shadow 180ms ease",
                }}
              >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: `2px solid ${p.accent}55`,
                  overflow: "hidden",
                  background: "#111",
                  boxShadow: `0 0 12px ${p.accent}22`,
                }}
              >
                <CeoAvatar
                  name={p.name}
                  accent={p.accent}
                  src={CEO_PHOTOS[p.key]}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 3,
                  }}
                >
                  <div
                    style={{ color: "#e0e0e0", fontSize: 12, fontWeight: 600 }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      background: `${p.accent}18`,
                      border: `1px solid ${p.accent}33`,
                      borderRadius: 4,
                      padding: "1px 6px",
                    }}
                  >
                    <span
                      style={{ color: p.accent, fontSize: 9, letterSpacing: 1 }}
                    >
                      {p.tag}
                    </span>
                  </div>
                </div>
                <div style={{ color: "#444", fontSize: 10, marginBottom: 6 }}>
                  {p.title}
                </div>

                {p.key === "dario" && p.eval && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          color: vlColorFn(p.eval.verdictLabel),
                          fontSize: 13,
                          fontWeight: 800,
                          letterSpacing: 2,
                        }}
                      >
                        {p.eval.verdictLabel}
                      </span>
                      <span style={{ color: "#444", fontSize: 10 }}>
                        {p.eval.confidence}%
                      </span>
                    </div>
                    {p.eval.executiveSummary && (
                      <p
                        style={{
                          color: "#666",
                          fontSize: 11,
                          fontStyle: "italic",
                          lineHeight: 1.5,
                        }}
                      >
                        &ldquo;{p.eval.executiveSummary}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {isLoading && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        border: `1px solid ${p.accent}`,
                        borderTop: `1px solid transparent`,
                        animation: "spin 0.9s linear infinite",
                      }}
                    />
                    <span style={{ color: "#444", fontSize: 11 }}>
                      Analyzing…
                    </span>
                  </div>
                )}

                {hasError && (
                  <div
                    style={{
                      color: "#ff444488",
                      fontSize: 10,
                      lineHeight: 1.4,
                    }}
                  >
                    ⚠ {cleanGptError}
                  </div>
                )}

                {p.key === "sam" && p.eval && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          color: vlColorFn(p.eval.verdictLabel),
                          fontSize: 13,
                          fontWeight: 800,
                          letterSpacing: 2,
                        }}
                      >
                        {p.eval.verdictLabel}
                      </span>
                      <span style={{ color: "#444", fontSize: 10 }}>
                        {p.eval.confidence}%
                      </span>
                    </div>
                    {p.eval.executiveSummary && (
                      <p
                        style={{
                          color: "#666",
                          fontSize: 11,
                          fontStyle: "italic",
                          lineHeight: 1.5,
                        }}
                      >
                        &ldquo;{p.eval.executiveSummary}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                <div
                  style={{
                    marginTop: 10,
                    color: isActive ? p.accent : "#5c6763",
                    fontSize: 9,
                    letterSpacing: 1.3,
                    textTransform: "uppercase",
                  }}
                >
                  {isActive ? "Hide memo" : "Open memo"}
                </div>
              </div>
            </div>
            </button>
          );
        })}
      </div>

      {activePersona && (
        <motion.div
          key={`${activePersona.key}-${activeEval?.verdictLabel || "pending"}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="mt-4 border border-white/8 bg-[linear-gradient(180deg,rgba(17,17,17,0.96)_0%,rgba(11,11,11,0.96)_100%)] px-[18px] pb-[18px] pt-[16px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/6 pb-[12px]">
            <div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-[#6f7c78]">
                Model memo / click a card to switch perspective
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-[#e7ece9]">
                  {activePersona.name}
                </span>
                <span className="text-[10px] text-[#697571]">
                  {activePersona.title}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-[10px]">
              <span
                className="border px-[9px] py-[4px] text-[9px] uppercase tracking-[0.16em]"
                style={{
                  color: activePersona.accent,
                  borderColor: `${activePersona.accent}33`,
                  background: `${activePersona.accent}12`,
                }}
              >
                {activePersona.tag}
              </span>
              {activeEval ? (
                <>
                  <span
                    className="text-[10px] uppercase tracking-[0.16em]"
                    style={{ color: vlColorFn(activeEval.verdictLabel) }}
                  >
                    {activeEval.verdictLabel}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#74807c]">
                    {activeEval.confidence}% confidence
                  </span>
                </>
              ) : activeLoading ? (
                <span className="text-[10px] uppercase tracking-[0.16em] text-[#74b9ff]">
                  Pending response
                </span>
              ) : activeError ? (
                <span className="text-[10px] uppercase tracking-[0.16em] text-[#ff9c9c]">
                  Unavailable
                </span>
              ) : null}
            </div>
          </div>

          {activeLoading ? (
            <div className="grid gap-3 text-[12px] leading-[1.7] text-[#8e9b96]">
              <p className="m-0">
                GPT-4o is still reviewing the same market brief. The memo will
                populate here as soon as the secondary model returns a verdict.
              </p>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#74b9ff]">
                <span className="h-[6px] w-[6px] rounded-full border border-[#74b9ff] border-t-transparent animate-spin" />
                Synchronizing model perspective
              </div>
            </div>
          ) : activeError ? (
            <div className="grid gap-3 text-[12px] leading-[1.7] text-[#b68c8c]">
              <p className="m-0">
                This model memo is unavailable for the current run.
              </p>
              <p className="m-0 text-[#8e9b96]">{cleanGptError}</p>
            </div>
          ) : activeEval ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="grid gap-4">
                <section className="border border-white/6 bg-white/[0.02] px-[14px] py-[13px]">
                  <div className="text-[9px] uppercase tracking-[0.18em] text-[#6f7c78]">
                    Executive summary
                  </div>
                  <p className="mt-2 text-[13px] leading-[1.75] text-[#e5ebe8]">
                    {activeEval.executiveSummary || "No executive summary provided."}
                  </p>
                </section>

                <section className="border border-white/6 bg-white/[0.02] px-[14px] py-[13px]">
                  <div className="text-[9px] uppercase tracking-[0.18em] text-[#6f7c78]">
                    Why this verdict
                  </div>
                  <p className="mt-2 text-[12px] leading-[1.75] text-[#95a39e]">
                    {activeEval.verdictReason || "No rationale provided."}
                  </p>
                </section>

                <section className="border border-white/6 bg-white/[0.02] px-[14px] py-[13px]">
                  <div className="text-[9px] uppercase tracking-[0.18em] text-[#6f7c78]">
                    Recommended next move
                  </div>
                  <div className="mt-3 grid gap-3">
                    {recommendedMoves.length > 0 ? (
                      recommendedMoves.map((move) => (
                        <div
                          key={move.label}
                          className="grid gap-1 border-t border-white/6 pt-3 first:border-t-0 first:pt-0"
                        >
                          <div className="text-[10px] uppercase tracking-[0.14em] text-[#dce3e0]">
                            {move.label}
                          </div>
                          <div className="text-[12px] leading-[1.7] text-[#8e9b96]">
                            {move.value}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[12px] leading-[1.7] text-[#8e9b96]">
                        No follow-up action was returned for this model.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="grid gap-4">
                <section className="border border-white/6 bg-white/[0.02] px-[14px] py-[13px]">
                  <div className="text-[9px] uppercase tracking-[0.18em] text-[#6f7c78]">
                    Key signals detected
                  </div>
                  <div className="mt-3 grid gap-3">
                    {memoSignals.length > 0 ? (
                      memoSignals.map((item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="grid grid-cols-[18px_minmax(0,1fr)] gap-3"
                        >
                          <span className="text-[10px] uppercase tracking-[0.16em] text-[#5e6a66]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-[12px] leading-[1.7] text-[#8e9b96]">
                            {item}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[12px] leading-[1.7] text-[#8e9b96]">
                        No signal summary was returned for this model.
                      </div>
                    )}
                  </div>
                </section>

                <section className="border border-white/6 bg-white/[0.02] px-[14px] py-[13px]">
                  <div className="text-[9px] uppercase tracking-[0.18em] text-[#6f7c78]">
                    Primary risks
                  </div>
                  <div className="mt-3 grid gap-3">
                    {memoRisks.length > 0 ? (
                      memoRisks.map((item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="grid grid-cols-[18px_minmax(0,1fr)] gap-3"
                        >
                          <span className="text-[10px] uppercase tracking-[0.16em] text-[#7a6661]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-[12px] leading-[1.7] text-[#b09191]">
                            {item}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[12px] leading-[1.7] text-[#8e9b96]">
                        No structural risks were surfaced by this model.
                      </div>
                    )}
                  </div>
                </section>

                <section className="border border-white/6 bg-white/[0.02] px-[14px] py-[13px]">
                  <div className="text-[9px] uppercase tracking-[0.18em] text-[#6f7c78]">
                    What would improve the score
                  </div>
                  <div className="mt-3 grid gap-3">
                    {scoreImprovers.length > 0 ? (
                      scoreImprovers.map((item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="grid grid-cols-[18px_minmax(0,1fr)] gap-3"
                        >
                          <span className="text-[10px] uppercase tracking-[0.16em] text-[#5e6a66]">
                            +
                          </span>
                          <span className="text-[12px] leading-[1.7] text-[#8e9b96]">
                            {item}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[12px] leading-[1.7] text-[#8e9b96]">
                        No improvement guidance was returned for this model.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="text-[12px] leading-[1.7] text-[#8e9b96]">
              No memo is available for this card yet.
            </div>
          )}
        </motion.div>
      )}

      {gptEval && <ConsensusBar gptEval={gptEval} />}
    </div>
  );
}

function ConsensusBar({ gptEval }: { gptEval: Evaluation | null }) {
  if (!gptEval) return null;

  // Agreement is shown at the bottom of AIPersonasBar — this is a separate block
  return null; // handled inline above
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function ProtocolWireframeVisual() {
  const lines = [
    { x1: 20, y1: 170, x2: 160, y2: 18 },
    { x1: 60, y1: 170, x2: 210, y2: 36 },
    { x1: 100, y1: 170, x2: 244, y2: 24 },
    { x1: 140, y1: 170, x2: 274, y2: 52 },
    { x1: 180, y1: 170, x2: 304, y2: 40 },
    { x1: 220, y1: 170, x2: 334, y2: 72 },
    { x1: 260, y1: 170, x2: 360, y2: 62 },
    { x1: 20, y1: 128, x2: 360, y2: 22 },
    { x1: 20, y1: 84, x2: 360, y2: 110 },
    { x1: 30, y1: 36, x2: 344, y2: 170 },
    { x1: 96, y1: 14, x2: 244, y2: 170 },
    { x1: 170, y1: 16, x2: 122, y2: 170 },
  ];

  return (
    <div className="protocol-visual-frame">
      <motion.div
        className="protocol-visual-glow"
        animate={{ opacity: [0.24, 0.58, 0.24], scale: [0.98, 1.03, 0.98] }}
        transition={{
          duration: 6,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <svg viewBox="0 0 380 190" className="protocol-visual-svg" aria-hidden>
        <defs>
          <linearGradient id="wirefade" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="52%" stopColor="rgba(255,255,255,0.44)" />
            <stop offset="100%" stopColor="rgba(79,219,202,0.18)" />
          </linearGradient>
        </defs>
        {lines.map((line, index) => (
          <motion.line
            key={`${line.x1}-${line.y1}-${index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="url(#wirefade)"
            strokeWidth="1.15"
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.18, 0.64, 0.18] }}
            transition={{
              duration: 4.5 + (index % 4),
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: index * 0.18,
            }}
          />
        ))}
        {[44, 96, 160, 224, 286, 334].map((cx, index) => (
          <motion.circle
            key={cx}
            cx={cx}
            cy={36 + (index % 3) * 34}
            r="2"
            fill="rgba(79,219,202,0.78)"
            animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.8, 1] }}
            transition={{
              duration: 3.4,
              repeat: Number.POSITIVE_INFINITY,
              delay: index * 0.22,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
      <motion.div
        className="protocol-scan-line"
        animate={{ y: ["-10%", "108%"] }}
        transition={{
          duration: 3.8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />
    </div>
  );
}

export default function AutoMarkBusinessValidator() {
  const [step, setStep] = useState<Step>("input");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deploymentSpeed, setDeploymentSpeed] = useState(
    "Standard (60s Execution)",
  );
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  const [evaluation, setEval] = useState<Evaluation | null>(null);
  const [gptEval, setGptEval] = useState<Evaluation | null>(null); // OpenAI parallel result
  const [gptError, setGptError] = useState(""); // non-fatal if GPT fails
  const [htmlOutput, setHTML] = useState("");
  const [uiTab, setUiTab] = useState<UiTab>("preview");
  const [error, setError] = useState("");
  const [, setCostRuns] = useState<CostRun[]>([]);
  const [ctaState, setCtaState] = useState<CTAState>("idle");

  const runningRef = useRef(false);
  const audienceMenuRef = useRef<HTMLDivElement | null>(null);
  const budgetMenuRef = useRef<HTMLDivElement | null>(null);
  const revenueMenuRef = useRef<HTMLDivElement | null>(null);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }, []);

  const addCost = useCallback((label: string, usage: Usage, isGPT = false) => {
    const cost = isGPT ? calcGPTCost(usage) : calcCost(usage);
    const tokens = isGPT
      ? (usage.prompt_tokens || 0) + (usage.completion_tokens || 0)
      : (usage.input_tokens || 0) +
        (usage.output_tokens || 0) +
        (usage.cache_creation_input_tokens || 0) +
        (usage.cache_read_input_tokens || 0);
    setCostRuns((prev) => [
      ...prev,
      { label, tokens, cost, cacheRead: usage.cache_read_input_tokens || 0 },
    ]);
  }, []);

  const set =
    (k: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      updateFormValue(k, e.target.value);
    };

  const trimmedForm = useMemo<FormState>(
    () => ({
      appName: form.appName.trim(),
      description: form.description.trim(),
      audience: form.audience.trim(),
      budget: form.budget.trim(),
      revenue: form.revenue.trim(),
    }),
    [form],
  );

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(DRAFT_KEY);
      if (!rawDraft) return;

      const parsed = JSON.parse(rawDraft) as unknown;
      if (!isFormState(parsed)) return;

      setForm(parsed);
    } catch {
      // Ignore malformed drafts and fall back to a clean form.
    }
  }, []);

  useEffect(() => {
    if (!openMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideAudience =
        audienceMenuRef.current?.contains(target) ?? false;
      const insideBudget = budgetMenuRef.current?.contains(target) ?? false;
      const insideRevenue = revenueMenuRef.current?.contains(target) ?? false;

      if (insideAudience || insideBudget || insideRevenue) return;

      setOpenMenu(null);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [openMenu]);

  const persistDraft = useCallback((updated: FormState) => {
    setForm(updated);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
    } catch {}
  }, []);

  const updateFormValue = useCallback(
    (key: keyof FormState, value: string) => {
      persistDraft({ ...form, [key]: value });
    },
    [form, persistDraft],
  );

  const selectedAudiencePills = useMemo(
    () => parseAudienceTokens(form.audience),
    [form.audience],
  );

  const primaryAudienceSelection = useMemo(
    () =>
      TARGET_AUDIENCE_OPTIONS.find((option) =>
        selectedAudiencePills.includes(option),
      ) ?? "",
    [selectedAudiencePills],
  );

  const selectedRevenueOption = useMemo(
    () =>
      REVENUE_MODEL_OPTIONS.find((option) => option.label === form.revenue) ??
      null,
    [form.revenue],
  );

  const addAudienceFromSelect = useCallback(
    (value: string) => {
      if (!value) return;
      const remaining = selectedAudiencePills.filter(
        (token) => !TARGET_AUDIENCE_OPTIONS.includes(token),
      );
      const merged = [value, ...remaining];
      updateFormValue("audience", merged.join(", "));
      setOpenMenu(null);
    },
    [selectedAudiencePills, updateFormValue],
  );

  const toggleAudiencePill = useCallback(
    (value: string) => {
      const next = selectedAudiencePills.includes(value)
        ? removeAudienceToken(selectedAudiencePills, value)
        : mergeAudienceToken(selectedAudiencePills, value);

      updateFormValue("audience", next.join(", "));
    },
    [selectedAudiencePills, updateFormValue],
  );

  const runAgent1 = async () => {
    if (!trimmedForm.appName || !trimmedForm.description) return;
    if (runningRef.current) return;
    runningRef.current = true;

    setStep("agent1");
    setError("");
    setGptError("");
    setCostRuns([]);
    setGptEval(null);

    const msg = `App: ${trimmedForm.appName}
What it does: ${trimmedForm.description}
Audience: ${trimmedForm.audience || "General mobile users"}
Execution speed: ${deploymentSpeed}
Budget: ${trimmedForm.budget || BUDGET_OPTIONS[1] || "$0 bootstrap"}
Revenue model: ${trimmedForm.revenue || REVENUE_MODEL_OPTIONS[0]?.label || "Open to suggestions"}`;

    // ── Run Claude + GPT-4o in parallel ──────────────────────────────────────
    const [claudeResult, gptResult] = await Promise.allSettled([
      callClaude(AGENT1_SYSTEM, msg, 3200),
      callOpenAI(AGENT1_SYSTEM, msg, 3200),
    ]);

    // Claude is required — if it fails, abort
    if (claudeResult.status === "rejected") {
      setError("Agent 1 failed: " + getErrorMessage(claudeResult.reason));
      setStep("input");
      runningRef.current = false;
      return;
    }

    // Claude succeeded
    try {
      const { text, usage } = claudeResult.value;
      addCost("Claude (Dario) — Evaluate", usage, false);
      const parsed = parseAgentJSON(text);
      setEval(normalizeEval(parsed));
    } catch (e) {
      setError("Agent 1 failed: " + getErrorMessage(e));
      setStep("input");
      runningRef.current = false;
      return;
    }

    // GPT-4o is non-fatal — show result if available, show warning if not
    if (gptResult.status === "fulfilled") {
      try {
        const { text: gptText, usage: gptUsage } = gptResult.value;
        addCost("GPT-4o (Sam) — Evaluate", gptUsage, true);
        const gptParsed = parseAgentJSON(gptText);
        setGptEval(normalizeEval(gptParsed));
      } catch (e) {
        setGptError("GPT-4o parse error: " + getErrorMessage(e));
      }
    } else {
      setGptError("GPT-4o unavailable: " + getErrorMessage(gptResult.reason));
    }

    setStep("done1");
    runningRef.current = false;
  };

  const runAgent2 = async () => {
    if (!evaluation) return;
    if (runningRef.current) return;
    runningRef.current = true;

    setStep("agent2");
    setError("");
    setCostRuns((prev) =>
      prev.filter((r) => !r.label.includes("UI (Sonnet 4.5)")),
    );

    const userMsg = `Design the core screen for this mobile app:

App name: "${trimmedForm.appName}"
What it does: ${trimmedForm.description}
Target audience: ${trimmedForm.audience || "general mobile users"}
Monetization: ${evaluation.monetizationStrategy}
Key features from evaluation: ${evaluation.devApproach}

Verdict: ${evaluation.verdict} — ${evaluation.verdictReason}

Design the MOST COMPELLING screen that shows this app's core value. Make it stunning.`;

    try {
      const { text: rawHTML, usage } = await callClaude(
        AGENT2_SYSTEM,
        userMsg,
        8000,
        "claude-sonnet-4-5-20250929",
        false,
      );
      addCost("Agent 2 — UI (Sonnet 4.5)", usage);

      const finalHTML = buildHTML(rawHTML);
      if (!finalHTML.includes("<!DOCTYPE") && !finalHTML.includes("<html")) {
        throw new Error("Model returned no HTML. Check API key and try again.");
      }

      setHTML(finalHTML);
      setStep("done2");
      setUiTab("preview");
    } catch (e) {
      setError("Agent 2 failed: " + getErrorMessage(e));
      setStep("done1");
    } finally {
      runningRef.current = false;
    }
  };

  const reset = () => {
    if (runningRef.current) return;
    setStep("input");
    setForm({ ...EMPTY_FORM });
    setDeploymentSpeed("Standard (60s Execution)");
    setOpenMenu(null);
    setEval(null);
    setGptEval(null);
    setGptError("");
    setHTML("");
    setError("");
    setCostRuns([]);
    setCtaState("idle");
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  };

  const [stitchCopied, setStitchCopied] = useState(false);

  const riskColor = (r: RiskLevel | CompetitionRisk) =>
    r === "Low"
      ? "var(--primary)"
      : r === "Medium"
        ? "var(--secondary)"
        : r === "High"
          ? "#ff8800"
          : "#ff4444";
  const canRun1 =
    trimmedForm.appName.length > 0 && trimmedForm.description.length > 0;
  const isRunning = ["agent1", "agent2"].includes(step);

  // ── Save as PDF ─────────────────────────────────────────────────────────────
  /* const savePDF = useCallback(() => {
    setPdfSaving(true);
    // Add print title
    const prevTitle = document.title;
    document.title = `${trimmedForm.appName} — AutoMark Evaluation`;
    document.title = `${trimmedForm.appName} — Automark AI Evaluation`;
    window.print();
    document.title = prevTitle;
    setTimeout(() => setPdfSaving(false), 1500);
  }, [trimmedForm.appName]); */

  // ── Google Stitch prompt ─────────────────────────────────────────────────────
  const buildStitchPrompt = useCallback(() => {
    if (!evaluation) return "";
    const e = evaluation;
    const scores = e.scores;
    return `Design a complete mobile app for "${trimmedForm.appName}".

CONCEPT:
${trimmedForm.description}

VERDICT: ${e.verdictLabel} (${e.confidence}% confidence) — ${e.executiveSummary}

CORE SCREENS TO DESIGN:
1. Onboarding / splash screen
2. Main dashboard / home screen
3. Core feature screen (primary action)
4. Profile / settings screen
5. Empty state / first-time user experience

DESIGN DIRECTION:
- Audience: ${trimmedForm.audience || "general mobile users"}
- Monetization: ${e.monetizationStrategy?.slice(0, 120) || "freemium"}
- Dev approach: ${e.devApproach?.slice(0, 120) || "standard mobile app"}
- AI Leverage score: ${scores.aiLeverage}/10 — lean into AI-powered features
- Viral potential: ${scores.viralPotential}/10 — ${scores.viralPotential >= 7 ? "build strong social/sharing mechanics" : "focus on retention over virality"}

STYLE:
- Modern, clean mobile UI (iOS/Android hybrid)
- Dark mode preferred
- Use bold typography and clear visual hierarchy
- Include realistic placeholder data (names, numbers, charts)
- Status bar, nav bar, bottom tab bar on all screens
- Micro-interactions and transitions should feel premium

CONSTRAINTS:
- 390×844px per screen (iPhone 15 dimensions)
- Each screen fully designed, no wireframes
- Consistent design system across all screens
- Component library: buttons, cards, inputs, tags`;
  }, [evaluation, trimmedForm]);

  const copyStitchPrompt = useCallback(async () => {
    const prompt = buildStitchPrompt();
    await copyToClipboard(prompt);
    setStitchCopied(true);
    setTimeout(() => setStitchCopied(false), 2000);
  }, [buildStitchPrompt, copyToClipboard]);

  useEffect(() => {
    if (step === "agent1") {
      setCtaState("running");
      return;
    }
    setCtaState(canRun1 ? "ready" : "idle");
  }, [canRun1, step]);

  const inputStyle: CSSProperties = {
    width: "100%",
    background: "#0d0d0d",
    border: "1px solid #2c2c2c",
    borderRadius: 6,
    color: "#e8e8e8",
    padding: "11px 14px",
    fontFamily: "var(--font-body), sans-serif",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };
  const labelStyle: CSSProperties = {
    display: "block",
    color: "#9eaca7",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 7,
  };
  const btnPrimary: CSSProperties = {
    background: "var(--primary)",
    color: "#000",
    border: "none",
    borderRadius: 6,
    padding: "13px 28px",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2,
    cursor: "pointer",
  };
  const btnGhost: CSSProperties = {
    background: "none",
    border: "1px solid #1e1e1e",
    color: "#a2afab",
    borderRadius: 6,
    padding: "13px 22px",
    fontFamily: "inherit",
    fontSize: 12,
    cursor: "pointer",
    letterSpacing: 1,
  };

  const ctaBtnStyle =
    ctaState === "ready"
      ? {
          ...btnPrimary,
          width: "100%",
          maxWidth: 360,
          display: "block",
          marginTop: 32,
          padding: "15px 28px",
          fontSize: 13,
          letterSpacing: 2.5,
          boxShadow:
            "0 0 24px var(--primary)33, 0 4px 16px rgba(0,255,157,0.2)",
          transition: "box-shadow 0.3s, transform 0.15s",
        }
      : ctaState === "running"
        ? {
            ...btnPrimary,
            width: "100%",
            maxWidth: 360,
            display: "block",
            marginTop: 32,
            padding: "15px 28px",
            fontSize: 13,
            letterSpacing: 2.5,
            background: "var(--primary)",
            cursor: "not-allowed",
            opacity: 0.9,
          }
        : {
            ...btnPrimary,
            width: "100%",
            maxWidth: 360,
            display: "block",
            marginTop: 32,
            padding: "15px 28px",
            fontSize: 13,
            letterSpacing: 2,
            background: "#111",
            color: "#7e8a86",
            border: "1px solid #222",
            cursor: "not-allowed",
            boxShadow: "none",
          };

  // Budget gap detection
  const hasBudgetGap = Boolean(
    evaluation &&
      evaluation.budgetAssessment.gap !== "none" &&
      evaluation.budgetAssessment.gap !== "",
  );
  const primaryAudienceDisplay =
    primaryAudienceSelection ||
    selectedAudiencePills[0] ||
    parseAudienceTokens(trimmedForm.audience)[0] ||
    "General audience";
  const competitionDensity =
    evaluation?.scores.competitionRisk === "High"
      ? "High Density"
      : evaluation?.scores.competitionRisk === "Medium"
        ? "Moderate Density"
        : "Low Density";
  const commercialBlocks = evaluation
    ? [
        {
          label: "Launch cost",
          value:
            evaluation.budgetAssessment.realistic || evaluation.scores.launchCost,
          sub: hasBudgetGap
            ? `Budget gap ${evaluation.budgetAssessment.gap}`
            : evaluation.budgetAssessment.note || "AI-assisted build estimate",
          warn: hasBudgetGap,
        },
        {
          label: "Time to revenue",
          value: evaluation.scores.timeToRevenue,
          sub: "Estimated path to first paying customer",
        },
        {
          label: "Competition density",
          value: competitionDensity,
          sub:
            evaluation.scores.competitionRisk === "High"
              ? "Funded incumbents and crowded alternatives"
              : evaluation.scores.competitionRisk === "Medium"
                ? "Comparable products already condition demand"
                : "Room to own a sharper market wedge",
          highlight: riskColor(evaluation.scores.competitionRisk),
        },
      ]
    : [];
  const financialModelRows = evaluation
    ? [
        {
          metric: "Break-even users",
          targetValue: "1,250 unit",
          probability:
            evaluation.confidence >= 70
              ? "Likely"
              : evaluation.confidence >= 50
                ? "Moderate"
                : "Stretch",
          accent:
            evaluation.confidence >= 70
              ? "var(--primary)"
              : evaluation.confidence >= 50
                ? "var(--secondary)"
                : "#d49a74",
        },
        {
          metric: "MRR target",
          targetValue: "$12,400.00",
          probability:
            evaluation.confidence >= 76
              ? "Likely"
              : evaluation.confidence >= 58
                ? "Moderate"
                : "Stretch",
          accent:
            evaluation.confidence >= 76
              ? "var(--primary)"
              : evaluation.confidence >= 58
                ? "var(--secondary)"
                : "#d49a74",
        },
        {
          metric: "Time to break-even",
          targetValue: "7.2 Months",
          probability:
            evaluation.riskLevel === "Low"
              ? "Likely"
              : evaluation.riskLevel === "Medium"
                ? "Moderate"
                : "Stretch",
          accent:
            evaluation.riskLevel === "Low"
              ? "var(--primary)"
              : evaluation.riskLevel === "Medium"
                ? "var(--secondary)"
                : "#d49a74",
        },
        {
          metric: "Year 1 revenue",
          targetValue: "$140k-$210k",
          probability:
            evaluation.riskLevel === "Low"
              ? "Moderate"
              : evaluation.riskLevel === "Medium"
                ? "Moderate"
                : "Stretch",
          accent:
            evaluation.riskLevel === "Critical"
              ? "#d49a74"
              : evaluation.riskLevel === "High"
                ? "#d49a74"
                : "var(--secondary)",
        },
      ]
    : [];
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080808",
        color: "#eef3f1",
        fontFamily: "var(--font-body), sans-serif",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 2px rgba(0,255,157,0.12), 0 0 12px rgba(0,255,157,0.08) !important;
        }
        input::placeholder, textarea::placeholder { color: #5a6662; opacity: 1; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes cta-pulse {
          0%, 100% { box-shadow: 0 0 24px var(--primary)33, 0 4px 16px rgba(0,255,157,0.2); }
          50%       { box-shadow: 0 0 36px var(--primary)55, 0 4px 20px rgba(0,255,157,0.35); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes reality-in {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes agent-pulse {
          0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
          50%       { transform: translate(-50%,-50%) scale(1.6); opacity: 0.5; }
        }
        @keyframes msg-fade {
          0%   { opacity: 0; transform: translateY(4px); }
          15%  { opacity: 1; transform: translateY(0); }
          85%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
        .cta-ready { animation: cta-pulse 2.4s ease-in-out infinite; }
        .cta-ready:hover { transform: translateY(-1px); transition: transform 0.15s; }
        .reveal-fields { animation: slide-in 0.25s ease forwards; }
        .dot1 { animation: dot-bounce 1.4s ease-in-out 0s   infinite; }
        .dot2 { animation: dot-bounce 1.4s ease-in-out 0.2s infinite; }
        .dot3 { animation: dot-bounce 1.4s ease-in-out 0.4s infinite; }
        .reality-item { animation: reality-in 0.3s ease forwards; }
        .pipeline-shell { display: flex; flex-direction: column; gap: 40px; }
        .pipeline-hero { max-width: 820px; }
        .validator-topbar { border-bottom: 1px solid rgba(79,219,202,0.1); background:
          linear-gradient(180deg, rgba(12,12,12,0.96) 0%, rgba(9,9,9,0.92) 100%),
          radial-gradient(circle at top left, rgba(79,219,202,0.1), transparent 34%);
          backdrop-filter: blur(16px);
          box-shadow: 0 10px 40px rgba(0,0,0,0.28); }
        .validator-brand-lockup { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .validator-brand-mark { width: 32px; height: 32px; border-radius: 10px; position: relative; display: grid; place-items: center; border: 1px solid rgba(79,219,202,0.24); background: linear-gradient(180deg, rgba(79,219,202,0.12), rgba(79,219,202,0.03)); box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 10px 26px rgba(0,0,0,0.22); }
        .validator-brand-mark::before, .validator-brand-mark::after { content: ""; position: absolute; border-radius: 999px; background: rgba(79,219,202,0.42); }
        .validator-brand-mark::before { width: 16px; height: 1px; }
        .validator-brand-mark::after { width: 1px; height: 16px; }
        .validator-brand-core { width: 8px; height: 8px; border-radius: 999px; background: var(--primary); box-shadow: 0 0 14px rgba(79,219,202,0.65); }
        .validator-brand-copy { min-width: 0; display: flex; flex-direction: column; gap: 2px; text-decoration: none; }
        .validator-brand-kicker { color: #7b8884; font-size: 9px; letter-spacing: 0.24em; text-transform: uppercase; }
        .validator-brand-title { color: #f5f6f5; font-size: 13px; letter-spacing: 0.16em; font-weight: 700; font-family: var(--font-heading), sans-serif; white-space: nowrap; }
        .validator-brand-divider { color: #41504d; font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; }
        .validator-brand-pill { padding: 6px 10px; border-radius: 999px; border: 1px solid rgba(79,219,202,0.18); background: rgba(79,219,202,0.06); color: #cfe6df; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; white-space: nowrap; }
        .validator-step { display: inline-flex; align-items: center; gap: 8px; padding: 8px 11px; border-radius: 999px; border: 1px solid rgba(56,65,63,0.8); background: rgba(16,16,16,0.8); transition: border-color 0.18s, background 0.18s, transform 0.18s; }
        .validator-step-line { color: #475451; font-size: 10px; letter-spacing: 0.18em; }
        .validator-step-dot { width: 7px; height: 7px; border-radius: 999px; background: #394441; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03); }
        .validator-step-label { font-size: 10px; letter-spacing: 0.15em; color: #8b9793; text-transform: uppercase; white-space: nowrap; }
        .validator-step.is-past { border-color: rgba(79,219,202,0.28); background: rgba(79,219,202,0.06); }
        .validator-step.is-past .validator-step-dot { background: var(--primary); box-shadow: 0 0 10px rgba(79,219,202,0.4); }
        .validator-step.is-past .validator-step-label { color: #d7ebe5; }
        .validator-step.is-active { border-color: rgba(79,219,202,0.55); background: linear-gradient(180deg, rgba(79,219,202,0.13), rgba(79,219,202,0.05)); box-shadow: 0 0 20px rgba(79,219,202,0.1); transform: translateY(-1px); }
        .validator-step.is-active .validator-step-dot { background: var(--primary); box-shadow: 0 0 12px rgba(79,219,202,0.45); }
        .validator-step.is-active .validator-step-label { color: #ffffff; }
        .validator-reset { background: rgba(14,14,14,0.9) !important; border: 1px solid rgba(79,219,202,0.18) !important; color: #d3ddd9 !important; border-radius: 999px !important; transition: transform 0.18s, border-color 0.18s, background 0.18s; }
        .validator-reset:not(:disabled):hover { transform: translateY(-1px); border-color: rgba(79,219,202,0.42) !important; background: rgba(79,219,202,0.08) !important; }
        .pipeline-kicker-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 18px; }
        .pipeline-status-row { display: inline-flex; align-items: center; gap: 10px; margin: 0; padding: 7px 12px; border-radius: 999px; border: 1px solid rgba(79,219,202,0.18); background: rgba(79,219,202,0.05); }
        .pipeline-status-dot { width: 8px; height: 8px; border-radius: 999px; background: var(--primary); box-shadow: 0 0 14px rgba(79,219,202,0.55); }
        .pipeline-status-label, .pipeline-micro-label, .pipeline-token-label { color: #96a29e; font-size: 10px; text-transform: uppercase; letter-spacing: 0.22em; }
        .pipeline-status-badge { padding: 7px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); color: #b8c4c0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; }
        .pipeline-hero-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(240px, 280px); gap: 24px; align-items: end; }
        .pipeline-hero-copy { max-width: 640px; }
        .pipeline-title { margin: 0 0 16px; line-height: 0.9; max-width: 11ch; display: flex; flex-direction: column; align-items: flex-start; }
        .pipeline-title-main { display: block; }
        .pipeline-title-accent { display: block; margin-top: 8px; padding-left: clamp(18px, 3vw, 42px); color: var(--primary); }
        .pipeline-lead { max-width: 620px; margin: 0; color: #b7c4c0; }
        .pipeline-hero-tags { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
        .pipeline-hero-tag { padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); color: #d7e1de; font-size: 11px; letter-spacing: 0.08em; }
        .pipeline-hero-card { padding: 18px 18px 16px; border-radius: 14px; border: 1px solid rgba(79,219,202,0.14); background: linear-gradient(180deg, rgba(19,21,21,0.96) 0%, rgba(12,12,12,0.9) 100%); box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 18px 40px rgba(0,0,0,0.2); }
        .pipeline-hero-card-label { color: #7f8a87; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; }
        .pipeline-hero-card-value { margin: 8px 0 18px; font-size: 28px; line-height: 0.95; font-family: var(--font-heading), sans-serif; color: #f5f7f6; letter-spacing: -0.06em; }
        .pipeline-hero-card-value span { color: var(--primary); }
        .pipeline-hero-card-copy { margin: 0; color: #99a6a2; font-size: 12px; line-height: 1.65; }
        .pipeline-layout { display: grid; grid-template-columns: minmax(0, 1.16fr) minmax(300px, 0.84fr); gap: 28px; align-items: start; }
        .pipeline-form-stack, .pipeline-side-stack { display: flex; flex-direction: column; gap: 22px; }
        .pipeline-panel { background: linear-gradient(180deg, rgba(32,31,31,0.95) 0%, rgba(23,23,23,0.95) 100%); border: 1px solid rgba(60,73,72,0.35); border-radius: 10px; box-shadow: 0 24px 60px rgba(0,0,0,0.22); }
        .pipeline-form-panel { padding: 28px; position: relative; overflow: hidden; }
        .pipeline-form-panel::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(135deg, rgba(79,219,202,0.08), transparent 28%, transparent 72%, rgba(79,219,202,0.05)); }
        .pipeline-example-header { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 14px; margin-bottom: 22px; }
        .pipeline-chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .pipeline-chip { margin: 0 !important; border-radius: 999px !important; padding: 6px 12px !important; background: rgba(11,11,11,0.66) !important; }
        .pipeline-field-stack { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 22px; }
        .pipeline-field-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 7px; }
        .pipeline-counter { color: #8d9894; font-size: 10px; font-family: monospace; }
        .pipeline-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
        .pipeline-select-card { background: rgba(13,13,13,0.72); border: 1px solid rgba(60,73,72,0.34); border-radius: 8px; padding: 14px 15px; }
        .pipeline-select-card.is-primary { position: relative; min-height: auto; padding: 14px 15px 15px; overflow: visible; background: linear-gradient(180deg, rgba(22,24,24,0.98) 0%, rgba(13,13,13,0.98) 100%); border-color: rgba(79,219,202,0.22); box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 10px 24px rgba(0,0,0,0.16); }
        .pipeline-select-card.is-primary .pipeline-micro-label { display: block; margin-bottom: 8px; }
        .pipeline-premium-select { position: relative; display: block; margin-top: 0; }
        .pipeline-premium-trigger { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 22px; padding: 0; border: none; background: transparent; color: #f2f6f4; font-family: var(--font-body), sans-serif; cursor: pointer; text-align: left; }
        .pipeline-premium-value { color: #f2f6f4; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
        .pipeline-premium-value.is-placeholder { color: #73807c; font-weight: 500; }
        .pipeline-premium-chevron { color: #8da5a0; font-size: 13px; line-height: 1; transition: transform 0.18s ease, color 0.18s ease; }
        .pipeline-premium-chevron.is-open { transform: rotate(180deg); color: var(--primary); }
        .pipeline-premium-menu { position: absolute; top: calc(100% + 12px); left: 0; width: min(100%, 320px); z-index: 30; padding: 12px 14px 10px; border: 1px solid rgba(79,219,202,0.2); border-radius: 10px; background: linear-gradient(180deg, rgba(18,21,21,0.98) 0%, rgba(11,12,12,0.98) 100%); box-shadow: 0 18px 40px rgba(0,0,0,0.32); max-height: 260px; overflow-y: auto; }
        .pipeline-premium-menu.is-end { left: auto; right: 0; }
        .pipeline-premium-option { width: 100%; display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 11px 0; border: none; border-bottom: 1px solid rgba(79,219,202,0.08); background: transparent; color: #d9e5e1; font-family: var(--font-body), sans-serif; font-size: 13px; text-align: left; cursor: pointer; transition: color 0.18s ease, transform 0.18s ease; }
        .pipeline-premium-option:last-child { border-bottom: none; padding-bottom: 2px; }
        .pipeline-premium-option:hover { color: #f2f6f4; transform: translateX(2px); }
        .pipeline-premium-option.is-active { color: var(--primary); }
        .pipeline-premium-option-copy { display: flex; flex-direction: column; gap: 4px; }
        .pipeline-premium-option-detail { color: #8fa09b; font-size: 11px; line-height: 1.45; }
        .pipeline-premium-option-meta { color: #7f908b; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; }
        .protocol-input { background: #0c0c0c !important; border: 1px solid rgba(60,73,72,0.48) !important; border-radius: 4px !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.02); }
        .protocol-textarea { min-height: 148px !important; }
        .protocol-select { width: 100%; margin-top: 10px; background: transparent; border: none; color: #e8e8e8; font-family: var(--font-body), sans-serif; font-size: 14px; outline: none; }
        .pipeline-pill-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .pipeline-audience-pill { width: 100%; display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 14px 15px; text-align: left; background: linear-gradient(180deg, rgba(18,20,20,0.96) 0%, rgba(10,11,11,0.96) 100%); border: 1px solid rgba(60,73,72,0.38); color: #d9e5e1; border-radius: 14px; cursor: pointer; font-family: inherit; transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; }
        .pipeline-audience-pill:hover { transform: translateY(-2px); border-color: rgba(79,219,202,0.42); box-shadow: 0 12px 24px rgba(0,0,0,0.2); }
        .pipeline-audience-pill.is-active { background: linear-gradient(180deg, rgba(20,33,31,0.98) 0%, rgba(12,20,19,0.98) 100%); border-color: rgba(79,219,202,0.6); box-shadow: inset 0 1px 0 rgba(255,255,255,0.02), 0 0 0 1px rgba(79,219,202,0.12), 0 16px 30px rgba(6,14,13,0.3); }
        .pipeline-audience-pill-copy { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .pipeline-audience-pill-title { color: #f2f6f4; font-size: 13px; font-weight: 600; letter-spacing: -0.01em; }
        .pipeline-audience-pill-detail { color: #8fa09b; font-size: 11px; line-height: 1.55; }
        .pipeline-audience-pill.is-active .pipeline-audience-pill-title { color: var(--primary); }
        .pipeline-audience-pill.is-active .pipeline-audience-pill-detail { color: #b7d1ca; }
        .pipeline-audience-pill-state { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; min-width: 62px; padding: 6px 9px; border-radius: 999px; border: 1px solid rgba(79,219,202,0.16); color: #7f908b; font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; background: rgba(255,255,255,0.02); }
        .pipeline-audience-pill.is-active .pipeline-audience-pill-state { border-color: rgba(79,219,202,0.4); color: var(--primary); background: rgba(79,219,202,0.1); }
        .pipeline-helper-copy { margin: 12px 0 0; color: #8fa09b; font-size: 11px; line-height: 1.6; }
        .pipeline-error-card { margin-top: 4px; background: #ff444411; border: 1px solid #ff444433; border-radius: 6px; padding: 10px 14px; }
        .pipeline-cta-wrap { position: relative; z-index: 1; margin-top: 8px; }
        .pipeline-cta-content, .pipeline-cta-running { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 14px; }
        .pipeline-cta-meta { opacity: 0.72; font-size: 11px; }
        .pipeline-run-dot { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #000; }
        .pipeline-meta-note { color: #73807c; font-size: 11px; margin: 12px 0 0; letter-spacing: 0.03em; }
        .pipeline-preview-panel { padding: 24px; }
        .pipeline-preview-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 22px; }
        .pipeline-preview-title, .pipeline-framework-title { margin: 0; font-family: var(--font-heading), sans-serif; color: #f2f4f3; font-size: 1.35rem; letter-spacing: -0.03em; }
        .pipeline-preview-tag { color: #7a8480; background: rgba(53,53,52,0.92); border-radius: 999px; padding: 4px 9px; font-size: 10px; letter-spacing: 0.08em; }
        .pipeline-metric-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .pipeline-metric-card { display: flex; flex-direction: column; gap: 10px; }
        .pipeline-metric-line { position: relative; height: 2px; background: rgba(79,219,202,0.14); overflow: hidden; }
        .pipeline-metric-line-fill { position: absolute; inset: 0 auto 0 0; background: linear-gradient(90deg, rgba(79,219,202,0.9), rgba(112,247,243,0.95)); }
        .pipeline-metric-label { margin: 0; color: #899591; font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; }
        .pipeline-metric-value { margin: 0; font-family: var(--font-heading), sans-serif; color: #f4f6f5; font-size: 1.8rem; letter-spacing: -0.05em; }
        .pipeline-preview-quote { margin-top: 24px; padding: 18px 18px 18px 20px; border-left: 2px solid var(--primary); background: rgba(0,0,0,0.22); color: #abb7b3; font-size: 13px; line-height: 1.75; font-style: italic; }
        .pipeline-fee-panel { padding: 18px 20px; display: flex; flex-direction: column; gap: 6px; }
        .pipeline-fee-label { color: #8f9a96; font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; }
        .pipeline-fee-value { font-family: var(--font-heading), sans-serif; color: var(--primary); font-size: 2.2rem; font-weight: 700; letter-spacing: -0.06em; }
        .pipeline-fee-unit { color: #8b9894; font-size: 12px; font-family: var(--font-body), sans-serif; font-weight: 500; letter-spacing: 0.02em; }
        .pipeline-visual-card { padding: 12px; overflow: hidden; }
        .protocol-visual-frame { position: relative; min-height: 250px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; background: linear-gradient(180deg, rgba(40,40,40,0.78) 0%, rgba(23,23,23,0.98) 100%); }
        .protocol-visual-glow { position: absolute; inset: 14% 10%; background: radial-gradient(circle, rgba(79,219,202,0.16) 0%, rgba(79,219,202,0.04) 35%, transparent 68%); filter: blur(18px); }
        .protocol-visual-svg { position: relative; width: 100%; height: 250px; opacity: 0.94; }
        .protocol-scan-line { position: absolute; left: 0; right: 0; height: 1.5px; background: linear-gradient(90deg, transparent, rgba(79,219,202,0.85), transparent); box-shadow: 0 0 18px rgba(79,219,202,0.32); }
        .pipeline-framework-card { padding: 22px 20px; }
        .pipeline-framework-list { display: flex; flex-direction: column; gap: 18px; margin-top: 20px; }
        .pipeline-framework-item { display: flex; gap: 14px; align-items: flex-start; }
        .pipeline-framework-icon { width: 30px; height: 30px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: rgba(79,219,202,0.14); border: 1px solid rgba(79,219,202,0.24); color: var(--primary); font-size: 12px; font-weight: 700; }
        .pipeline-framework-item-title { margin: 0 0 5px; color: #f1f4f3; font-size: 15px; letter-spacing: -0.02em; }
        .pipeline-framework-item-copy { margin: 0; color: #9ba8a4; font-size: 12px; line-height: 1.7; }
        .pipeline-token-strip { padding: 2px 4px; }
        .pipeline-token-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; color: #808b87; font-size: 11px; letter-spacing: 0.08em; }
        .validator-topbar { border-bottom: 1px solid rgba(60,73,72,0.2); background: rgba(19,19,19,0.8); backdrop-filter: blur(18px); box-shadow: none; }
        .validator-topbar-progress { border-bottom: 1px solid rgba(60,73,72,0.2); background: #0b0b0b; }
        .validator-nav-left, .validator-nav-right { display: flex; align-items: center; }
        .validator-nav-left { gap: 34px; }
        .validator-logo { color: #ffffff; font-size: 1.55rem; font-weight: 700; letter-spacing: -0.05em; text-decoration: none; font-family: var(--font-heading), sans-serif; }
        .validator-nav-links { display: flex; align-items: center; gap: 26px; }
        .validator-nav-link { color: #aeb8b4; font-size: 12px; text-decoration: none; letter-spacing: -0.01em; padding-bottom: 6px; border-bottom: 2px solid transparent; }
        .validator-nav-link.is-active { color: var(--primary); border-bottom-color: var(--primary); }
        .validator-nav-right { gap: 16px; }
        .validator-nav-button { border: none; background: var(--primary); color: #06211f; border-radius: 2px; padding: 10px 16px; font-size: 12px; font-weight: 800; letter-spacing: -0.01em; cursor: pointer; }
        .validator-avatar { width: 34px; height: 34px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: radial-gradient(circle at 30% 30%, #4b5451, #1d1d1d 70%); display: grid; place-items: center; color: #e5ece9; font-size: 10px; letter-spacing: 0.16em; }
        .pipeline-shell { gap: 64px; }
        .pipeline-hero { max-width: none; display: grid; gap: 0; }
        .pipeline-kicker-row { gap: 8px; margin-bottom: 14px; }
        .pipeline-status-row { padding: 0; border: none; background: transparent; }
        .pipeline-status-label { letter-spacing: 0.22em; }
        .pipeline-status-badge { display: none; }
        .pipeline-hero-grid { grid-template-columns: minmax(0, 1fr) minmax(220px, 280px); gap: 46px; align-items: end; }
        .pipeline-hero-copy { max-width: 760px; }
        .pipeline-title { margin: 0 0 24px; max-width: none; display: block; line-height: 0.92; font-size: clamp(2.8rem, 5vw, 4.6rem); letter-spacing: -0.07em; }
        .pipeline-title-main { display: inline; }
        .pipeline-title-accent { display: inline; margin-top: 0; padding-left: 0; color: var(--primary); }
        .pipeline-title-tail { color: #f3f4f3; }
        .pipeline-lead { max-width: 720px; color: #b7c4c0; font-size: 1.1rem; line-height: 1.72; }
        .pipeline-hero-tags, .pipeline-hero-card, .pipeline-example-header, .pipeline-hidden-advanced { display: none; }
        .pipeline-layout { grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.72fr); gap: 56px; }
        .pipeline-form-stack, .pipeline-side-stack { gap: 30px; }
        .pipeline-panel { border-radius: 4px; border-color: rgba(60,73,72,0.18); box-shadow: none; }
        .pipeline-form-panel { padding: 28px 18px 18px; background: #201f1f; }
        .pipeline-field-stack { gap: 26px; }
        .pipeline-field-head { margin-bottom: 10px; }
        .protocol-input { width: 100%; background: #0e0e0e !important; border: 0 !important; border-bottom: 1px solid rgba(60,73,72,0.48) !important; border-radius: 0 !important; box-shadow: none !important; padding: 18px 16px !important; font-size: 1.1rem; color: #e7e9e8; }
        .protocol-textarea { min-height: 128px !important; }
        .pipeline-field-grid { gap: 18px; }
        .pipeline-select-card { padding: 14px 16px; background: #1c1b1b; border-radius: 2px; border: 1px solid rgba(60,73,72,0.16); }
        .protocol-select { margin-top: 8px; color: #ffffff; font-size: 14px; font-weight: 500; appearance: none; }
        .pipeline-cta-wrap { margin-top: 10px; }
        .pipeline-cta { background: var(--primary) !important; color: #0b2320 !important; border: none !important; box-shadow: none !important; padding: 19px 22px !important; }
        .pipeline-cta-content, .pipeline-cta-running { align-items: center; }
        .pipeline-cta-content > span:first-child, .pipeline-cta-running { font-family: var(--font-heading), sans-serif; font-size: 1.05rem; font-weight: 700; letter-spacing: -0.02em; }
        .pipeline-cta-meta { color: rgba(6,33,31,0.72); font-size: 13px; }
        .pipeline-meta-note { display: none; }
        .pipeline-preview-panel { padding: 28px 16px 16px; background: rgba(28,27,27,0.54); border-color: rgba(60,73,72,0.14); }
        .pipeline-preview-head { margin-bottom: 18px; }
        .pipeline-preview-title, .pipeline-framework-title { font-size: 1.9rem; letter-spacing: -0.05em; }
        .pipeline-preview-tag { border-radius: 2px; padding: 4px 8px; }
        .pipeline-metric-grid { gap: 24px; }
        .pipeline-metric-value { font-size: 2rem; }
        .pipeline-preview-quote { margin-top: 26px; padding: 16px 14px; border-left-width: 3px; background: rgba(0,0,0,0.26); font-size: 12px; line-height: 1.72; }
        .pipeline-fee-panel { justify-self: end; width: 100%; max-width: 280px; padding: 22px 22px 20px; background: #2a2a2a; }
        .pipeline-fee-value { font-size: 3rem; }
        .pipeline-fee-unit { font-size: 11px; }
        .pipeline-visual-card { padding: 6px; background: #2a2a2a; }
        .protocol-visual-frame { min-height: 260px; border-radius: 2px; border-color: rgba(255,255,255,0.06); background: linear-gradient(180deg, rgba(55,55,55,0.48) 0%, rgba(30,30,30,0.9) 100%); }
        .protocol-visual-glow { inset: 22% 14%; background: radial-gradient(circle, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.01) 52%, transparent 74%); filter: blur(16px); }
        .pipeline-framework-card { padding: 10px 0 0; border: none; background: transparent; }
        .pipeline-framework-list { gap: 28px; }
        .pipeline-framework-item { gap: 18px; }
        .pipeline-framework-icon { width: 40px; height: 40px; border-radius: 2px; background: #201f1f; border: none; font-size: 13px; }
        .pipeline-framework-item-title { font-size: 1.2rem; margin-bottom: 6px; }
        .pipeline-framework-item-copy { font-size: 13px; line-height: 1.74; }
        .pipeline-token-strip { padding-top: 10px; border-top: 1px solid rgba(60,73,72,0.12); }
        .pipeline-token-label { text-align: center; display: block; }
        .pipeline-token-row { justify-content: space-between; font-family: var(--font-heading), sans-serif; font-size: 1rem; letter-spacing: -0.04em; }
        .validator-footer { margin-top: 72px; padding: 28px 0 0; border-top: 1px solid rgba(60,73,72,0.15); display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .validator-footer-brand { color: #ffffff; font-size: 0.95rem; font-weight: 700; letter-spacing: -0.04em; text-transform: uppercase; }
        .validator-footer-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; }
        .validator-footer-link, .validator-footer-copy { color: #a9b3b0; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; text-decoration: none; }
        @media (max-width: 1180px) {
          .pipeline-hero-grid { grid-template-columns: 1fr; }
          .pipeline-layout { grid-template-columns: 1fr; }
          .pipeline-side-stack { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
          .pipeline-framework-card { grid-column: 1 / -1; }
          .pipeline-token-strip { grid-column: 1 / -1; }
        }
        @media (max-width: 960px) {
          .g2 { grid-template-columns: 1fr !important; gap: 16px !important; }
          .chips { flex-wrap: wrap !important; gap: 8px !important; }
          .chips > div { flex: 1 1 calc(50% - 8px) !important; min-width: min(100%, 220px) !important; }
          .tbar { padding: 10px 20px !important; flex-wrap: wrap; gap: 10px; }
          .tbar > div:first-child { min-width: 0; flex: 1 1 auto; }
          .psteps { width: 100%; justify-content: flex-start; overflow-x: auto; padding-top: 4px; }
          .mpad { padding: 34px 20px !important; }
          .pipeline-shell { gap: 28px; }
          .validator-brand-divider { display: none; }
          .pipeline-field-grid { grid-template-columns: 1fr; }
          .pipeline-side-stack { grid-template-columns: 1fr; }
          .pipeline-metric-grid { grid-template-columns: 1fr; }
          .pipeline-preview-head { flex-direction: column; align-items: flex-start; }
          .pipeline-cta-content, .pipeline-cta-running { flex-direction: column; align-items: flex-start; }
          .validator-hero-title { font-size: clamp(2.1rem, 5vw, 2.5rem) !important; }
          .validator-hero-lead { font-size: 14px !important; line-height: 1.65 !important; }
          .validator-cta { max-width: 100% !important; padding: 14px 22px !important; font-size: 12px !important; letter-spacing: 1.8px !important; }
          .pscale{ transform: scale(0.84) !important; transform-origin: top center !important; margin-bottom: -110px !important; }
        }
        @media (max-width: 600px) {
          .g2 { grid-template-columns: 1fr !important; }
          .chips { flex-wrap: wrap !important; }
          .chips > div { flex-basis: 100% !important; min-width: 0 !important; }
          .psteps{ display: none !important; }
          .tbar  { padding: 10px 14px !important; gap: 8px; }
          .tbar > div:first-child { gap: 8px !important; }
          .validator-brand-pill { display: none; }
          .mpad  { padding: 24px 14px !important; }
          .pipeline-form-panel, .pipeline-preview-panel, .pipeline-framework-card { padding: 20px 16px; }
          .pipeline-fee-panel { padding: 16px; }
          .pipeline-title { line-height: 1; }
          .pipeline-title-accent { padding-left: 0; }
          .pipeline-pill-grid { grid-template-columns: 1fr; gap: 8px; }
          .pipeline-chip-row { gap: 6px; }
          .protocol-visual-frame, .protocol-visual-svg { min-height: 210px; height: 210px; }
          .validator-hero-title { font-size: 1.95rem !important; }
          .validator-hero-lead { font-size: 13px !important; }
          .validator-cta { padding: 13px 18px !important; font-size: 11px !important; letter-spacing: 1.5px !important; }
          .validator-reset { padding: 5px 10px !important; font-size: 9px !important; }
          .example-chip { padding: 4px 8px !important; font-size: 10px !important; }
          .pscale{ transform: scale(0.68) !important; transform-origin: top center !important; margin-bottom: -240px !important; }
        }
        @media print {
          body { background: #fff !important; color: #111 !important; }
          .no-print, .tbar { display: none !important; }
          .mpad { padding: 16px !important; max-width: 100% !important; }
          * { color-adjust: exact; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          div[style*="background: #080808"], div[style*="background:#080808"] { background: #fff !important; }
          @page { margin: 1.2cm; size: A4; }
        }
      `}</style>

      {/* ── Top bar ── */}
      {/* Top bar */}
      <div className="validator-topbar-progress sticky top-0 z-[100]">
        <div className="tbar mx-auto flex max-w-[1380px] items-center justify-between px-8 py-[11px]">
          <div className="validator-brand-lockup">
            <div className="validator-brand-mark" aria-hidden="true">
              <span className="validator-brand-core" />
            </div>
            <Link href="/" className="validator-brand-copy">
              <span className="validator-brand-kicker">Sovereign workspace</span>
              <span className="validator-brand-title">AUTOMARK AI</span>
            </Link>
            <span className="validator-brand-divider">/</span>
            <span className="validator-brand-pill">Idea Pipeline</span>
          </div>
          <div className="psteps flex items-center gap-1.5">
            {[
              { id: "input", l: "01 INPUT" },
              { id: "done1", l: "02 EVALUATE" },
              { id: "done2", l: "03 DESIGN" },
            ].map((s, i) => {
              const past =
                s.id === "input" ||
                (s.id === "done1" &&
                  ["done1", "agent2", "done2"].includes(step)) ||
                (s.id === "done2" && step === "done2");
              const active =
                (s.id === "input" && ["input", "agent1"].includes(step)) ||
                (s.id === "done1" && ["done1", "agent2"].includes(step)) ||
                (s.id === "done2" && step === "done2");
              return (
                <div key={s.id} className="flex items-center gap-1.5">
                  {i > 0 && <span className="validator-step-line">----</span>}
                  <span
                    className={`validator-step ${
                      active ? "is-active" : past ? "is-past" : ""
                    }`}
                  >
                    <span className="validator-step-dot" />
                    <span className="validator-step-label">
                      {past && !active ? "Done / " : ""}
                      {s.l}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
          {step !== "input" && (
            <button
              className={`validator-reset rounded-[4px] border border-[#2a2a2a] bg-transparent px-[14px] py-[5px] text-[10px] tracking-[0.1em] ${
                isRunning ? "cursor-not-allowed text-[#6d7874]" : "cursor-pointer text-[#c0cbc8]"
              }`}
              onClick={reset}
              disabled={isRunning}
            >
              ? RESET
            </button>
          )}
        </div>
      </div>
      {/* ── Main content ── */}
      <div className="mpad mx-auto max-w-[1380px] px-8 pb-14 pt-10">
        {/* ════ INPUT FORM ════ */}
        {step === "input" && (
          <div className="pipeline-shell">
            <motion.header
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="pipeline-hero"
            >
              <div className="pipeline-kicker-row">
                <div className="pipeline-status-row">
                  <span className="pipeline-status-dot" />
                  <span className="pipeline-status-label">
                    Sovereign Protocol Active
                  </span>
                </div>
              </div>
              <div className="pipeline-hero-grid">
                <div className="pipeline-hero-copy">
                  <h1 className="validator-hero-title pipeline-title">
                    <span className="pipeline-title-main">Idea Pipeline:</span>
                    <br />
                    <span className="pipeline-title-accent">
                      Intelligence-Driven
                    </span>
                    {" "}
                    <span className="pipeline-title-tail">Validation</span>
                  </h1>
                  <p className="validator-hero-lead pipeline-lead">
                    Deploy the Sovereign Architect protocol to verify market
                    saturation, technical feasibility, and economic viability.
                    High-fidelity intelligence reports generated in real-time.
                  </p>
                </div>
                <div className="pipeline-panel pipeline-fee-panel">
                  <div className="pipeline-fee-label">
                    Standard execution fee
                  </div>
                  <div className="pipeline-fee-value">
                    $5.00
                    <span className="pipeline-fee-unit"> / Validation</span>
                  </div>
                </div>
              </div>
            </motion.header>

            <div className="pipeline-layout">
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
                className="pipeline-form-stack"
              >
                <div className="pipeline-panel pipeline-form-panel">
                  <div className="pipeline-example-header">
                    <span className="pipeline-micro-label">
                      Project alias suggestions
                    </span>
                    <div className="pipeline-chip-row">
                      {EXAMPLE_IDEAS.map((ex) => (
                        <button
                          className="example-chip pipeline-chip"
                          key={ex.name}
                          onClick={() => {
                            const updated = {
                              ...form,
                              appName: ex.name,
                              description: ex.desc,
                            };
                            persistDraft(updated);
                          }}
                          onMouseEnter={(
                            e: ReactMouseEvent<HTMLButtonElement>,
                          ) => {
                            e.currentTarget.style.borderColor =
                              "var(--primary)66";
                            e.currentTarget.style.color = "var(--primary)";
                          }}
                          onMouseLeave={(
                            e: ReactMouseEvent<HTMLButtonElement>,
                          ) => {
                            e.currentTarget.style.borderColor = "#2a2a2a";
                            e.currentTarget.style.color = "#b0bbb8";
                          }}
                        >
                          {ex.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pipeline-field-stack">
                    <div className="pipeline-field">
                      <label style={labelStyle}>
                        App Name / Project Alias
                        <span style={{ color: "var(--primary)" }}> *</span>
                      </label>
                      <input
                        value={form.appName}
                        onChange={set("appName")}
                        placeholder="e.g. NeuralNode Infrastructure"
                        style={inputStyle}
                        className="protocol-input"
                        autoFocus
                      />
                    </div>

                    <div className="pipeline-field">
                      <div className="pipeline-field-head">
                        <label style={{ ...labelStyle, marginBottom: 0 }}>
                          Core Vision / Architectural Intent
                          <span style={{ color: "var(--primary)" }}> *</span>
                        </label>
                        <span className="pipeline-counter">
                          {form.description.length}/600
                        </span>
                      </div>
                      <textarea
                        value={form.description}
                        onChange={set("description")}
                        placeholder="Describe the high-signal quality and the technical gap this protocol fills..."
                        rows={6}
                        maxLength={600}
                        style={{
                          ...inputStyle,
                          resize: "vertical",
                          lineHeight: 1.8,
                          minHeight: 138,
                        }}
                        className="protocol-input protocol-textarea"
                      />
                    </div>

                    <div className="pipeline-field-grid">
                      <div className="pipeline-select-card is-primary">
                        <label className="pipeline-micro-label">
                          Target market segment
                        </label>
                        <div
                          className="pipeline-premium-select"
                          ref={audienceMenuRef}
                        >
                          <button
                            type="button"
                            className="pipeline-premium-trigger"
                            onClick={() =>
                              setOpenMenu((current) =>
                                current === "audience" ? null : "audience",
                              )
                            }
                            aria-haspopup="listbox"
                            aria-expanded={openMenu === "audience"}
                          >
                            <span
                              className={`pipeline-premium-value ${
                                primaryAudienceSelection
                                  ? ""
                                  : "is-placeholder"
                              }`}
                            >
                              {primaryAudienceSelection ||
                                "Select a primary audience"}
                            </span>
                            <span
                              className={`pipeline-premium-chevron ${
                                openMenu === "audience" ? "is-open" : ""
                              }`}
                            >
                              ˅
                            </span>
                          </button>

                          {openMenu === "audience" && (
                            <div
                              className="pipeline-premium-menu"
                              role="listbox"
                            >
                              {TARGET_AUDIENCE_OPTIONS.map((option) => {
                                const isActive =
                                  option === primaryAudienceSelection;

                                return (
                                  <button
                                    key={option}
                                    type="button"
                                    role="option"
                                    aria-selected={isActive}
                                    className={`pipeline-premium-option ${
                                      isActive ? "is-active" : ""
                                    }`}
                                    onClick={() => addAudienceFromSelect(option)}
                                  >
                                    <span>{option}</span>
                                    {isActive && (
                                      <span className="pipeline-premium-option-meta">
                                        Selected
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pipeline-select-card is-primary">
                        <label className="pipeline-micro-label">
                          Rough budget
                        </label>
                        <div
                          className="pipeline-premium-select"
                          ref={budgetMenuRef}
                        >
                          <button
                            type="button"
                            className="pipeline-premium-trigger"
                            onClick={() =>
                              setOpenMenu((current) =>
                                current === "budget" ? null : "budget",
                              )
                            }
                            aria-haspopup="listbox"
                            aria-expanded={openMenu === "budget"}
                          >
                            <span
                              className={`pipeline-premium-value ${
                                form.budget ? "" : "is-placeholder"
                              }`}
                            >
                              {form.budget || "Select budget range"}
                            </span>
                            <span
                              className={`pipeline-premium-chevron ${
                                openMenu === "budget" ? "is-open" : ""
                              }`}
                            >
                              ˅
                            </span>
                          </button>

                          {openMenu === "budget" && (
                            <div
                              className="pipeline-premium-menu is-end"
                              role="listbox"
                            >
                              {BUDGET_OPTIONS.map((option) => {
                                const isActive = option === form.budget;

                                return (
                                  <button
                                    key={option}
                                    type="button"
                                    role="option"
                                    aria-selected={isActive}
                                    className={`pipeline-premium-option ${
                                      isActive ? "is-active" : ""
                                    }`}
                                    onClick={() => {
                                      updateFormValue("budget", option);
                                      setOpenMenu(null);
                                    }}
                                  >
                                    <span>{option}</span>
                                    {isActive && (
                                      <span className="pipeline-premium-option-meta">
                                        Selected
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pipeline-select-card is-primary">
                      <label className="pipeline-micro-label">
                        Preferred revenue model
                      </label>
                      <div
                        className="pipeline-premium-select"
                        ref={revenueMenuRef}
                      >
                        <button
                          type="button"
                          className="pipeline-premium-trigger"
                          onClick={() =>
                            setOpenMenu((current) =>
                              current === "revenue" ? null : "revenue",
                            )
                          }
                          aria-haspopup="listbox"
                          aria-expanded={openMenu === "revenue"}
                        >
                          <span
                            className={`pipeline-premium-value ${
                              selectedRevenueOption ? "" : "is-placeholder"
                            }`}
                          >
                            {selectedRevenueOption?.label ||
                              "Select monetization model"}
                          </span>
                          <span
                            className={`pipeline-premium-chevron ${
                              openMenu === "revenue" ? "is-open" : ""
                            }`}
                          >
                            Ë…
                          </span>
                        </button>

                        {openMenu === "revenue" && (
                          <div
                            className="pipeline-premium-menu"
                            role="listbox"
                          >
                            {REVENUE_MODEL_OPTIONS.map((option) => {
                              const isActive = option.label === form.revenue;

                              return (
                                <button
                                  key={option.label}
                                  type="button"
                                  role="option"
                                  aria-selected={isActive}
                                  className={`pipeline-premium-option ${
                                    isActive ? "is-active" : ""
                                  }`}
                                  onClick={() => {
                                    updateFormValue("revenue", option.label);
                                    setOpenMenu(null);
                                  }}
                                >
                                  <span className="pipeline-premium-option-copy">
                                    <span>{option.label}</span>
                                    <span className="pipeline-premium-option-detail">
                                      {option.detail}
                                    </span>
                                  </span>
                                  {isActive && (
                                    <span className="pipeline-premium-option-meta">
                                      Selected
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pipeline-field">
                      <div className="pipeline-field-head">
                        <label className="pipeline-micro-label">
                          Audience signals
                        </label>
                        <span className="pipeline-counter">
                          {selectedAudiencePills.length}/
                          {AUDIENCE_PILL_OPTIONS.length} selected
                        </span>
                      </div>
                      <div className="pipeline-pill-grid">
                        {AUDIENCE_PILL_OPTIONS.map((option) => {
                          const active = selectedAudiencePills.includes(
                            option.label,
                          );

                          return (
                            <button
                              key={option.label}
                              type="button"
                              className={`pipeline-audience-pill ${
                                active ? "is-active" : ""
                              }`}
                              onClick={() => toggleAudiencePill(option.label)}
                            >
                              <span className="pipeline-audience-pill-copy">
                                <span className="pipeline-audience-pill-title">
                                  {option.label}
                                </span>
                                <span className="pipeline-audience-pill-detail">
                                  {option.detail}
                                </span>
                              </span>
                              <span className="pipeline-audience-pill-state">
                                {active ? "Selected" : "Add"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="pipeline-helper-copy">
                        {selectedAudiencePills.length > 0
                          ? `Selected: ${selectedAudiencePills.join(", ")}`
                          : "Pick multiple audience signals to help the validator understand who feels the pain most strongly."}
                      </p>
                    </div>

                  </div>

                  {error && (
                    <div className="pipeline-error-card">
                      <p style={{ color: "#ff7777", fontSize: 12 }}>
                        &#9888; {error}
                      </p>
                    </div>
                  )}

                  <div className="pipeline-cta-wrap">
                    <button
                      onClick={runAgent1}
                      disabled={!canRun1 || ctaState === "running"}
                      className={`validator-cta pipeline-cta ${
                        ctaState === "ready" ? "cta-ready" : ""
                      }`}
                      style={{
                        ...ctaBtnStyle,
                        maxWidth: "100%",
                        marginTop: 0,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      {ctaState === "running" ? (
                        <span className="pipeline-cta-running">
                          <span style={{ display: "inline-flex", gap: 4 }}>
                            <span className="dot1 pipeline-run-dot" />
                            <span className="dot2 pipeline-run-dot" />
                            <span className="dot3 pipeline-run-dot" />
                          </span>
                          SOVEREIGN PROTOCOL RUNNING...
                        </span>
                      ) : (
                        <span className="pipeline-cta-content">
                          <span>COMMENCE VALIDATION</span>
                          <span className="pipeline-cta-meta">$5.00 USD ?</span>
                        </span>
                      )}
                    </button>
                    <p className="pipeline-meta-note">
                      Claude + GPT-4o execute in parallel. Strategy view first,
                      UI concept second.
                    </p>
                  </div>
                </div>

                <div className="pipeline-panel pipeline-preview-panel">
                  <div className="pipeline-preview-head">
                    <h3 className="pipeline-preview-title">
                      Intelligence Blueprint Preview
                    </h3>
                    <span className="pipeline-preview-tag">
                      SAMPLE_DATA_SET_v5.0
                    </span>
                  </div>

                  <div className="pipeline-metric-grid">
                    {[
                      {
                        label: "Market viability",
                        value: "68.4%",
                        width: "68%",
                      },
                      {
                        label: "Saturation risk",
                        value: "24.1%",
                        width: "24%",
                      },
                      {
                        label: "Feasibility index",
                        value: "82.9%",
                        width: "83%",
                      },
                    ].map((metric) => (
                      <div key={metric.label} className="pipeline-metric-card">
                        <div className="pipeline-metric-line">
                          <span
                            className="pipeline-metric-line-fill"
                            style={{ width: metric.width }}
                          />
                        </div>
                        <p className="pipeline-metric-label">{metric.label}</p>
                        <p className="pipeline-metric-value">{metric.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pipeline-preview-quote">
                    &ldquo;The sovereign architect protocol identified a premium
                    opportunity when the wedge is clear, the audience is narrow
                    enough to own, and execution remains disciplined from day
                    one.&rdquo;
                  </div>
                </div>
              </motion.section>

              <motion.aside
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
                className="pipeline-side-stack"
              >
                <div className="pipeline-panel pipeline-visual-card">
                  <ProtocolWireframeVisual />
                </div>

                <div className="pipeline-panel pipeline-framework-card">
                  <h2 className="pipeline-framework-title">
                    Sovereign Validation Framework
                  </h2>
                  <div className="pipeline-framework-list">
                    {FRAMEWORK_POINTS.map((item, index) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.35,
                          delay: 0.18 + index * 0.08,
                          ease: "easeOut",
                        }}
                        className="pipeline-framework-item"
                      >
                        <div className="pipeline-framework-icon">
                          {item.code}
                        </div>
                        <div>
                          <h4 className="pipeline-framework-item-title">
                            {item.title}
                          </h4>
                          <p className="pipeline-framework-item-copy">
                            {item.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="pipeline-token-strip">
                  <div className="pipeline-token-label">
                    Powered by force intelligence tokens
                  </div>
                  <div className="pipeline-token-row">
                    {["HYBRID_PROTO", "MONOLITH_OS", "SOVEREIGN_V2"].map(
                      (token) => (
                        <span key={token}>{token}</span>
                      ),
                    )}
                  </div>
                </div>
              </motion.aside>
            </div>
          </div>
        )}

        {/* ════ LOADING ════ */}
        {step === "agent1" && <Spinner label="EVALUATING" />}
        {step === "agent2" && <Spinner label="DESIGNING" isAgent2 />}

        {/* ════ RESULTS ════ */}
        {(step === "done1" || step === "done2") && evaluation && (
          <div className="flex flex-col gap-6">
            <section className="relative border border-white/7 bg-[linear-gradient(180deg,rgba(19,19,19,0.98)_0%,rgba(11,11,11,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="grid gap-6 border-b border-white/4 px-[26px] pb-[22px] pt-[26px] xl:grid-cols-[minmax(0,1fr)_380px] xl:items-end">
                <div>
                  <p className="mb-3 inline-flex items-center gap-[7px] text-[10px] uppercase tracking-[0.22em] text-[#59d6cf]">
                    <span
                      aria-hidden="true"
                      className="h-[5px] w-[5px] bg-[#59d6cf] shadow-[0_0_10px_rgba(89,214,207,0.55)]"
                    />
                    Protocol active
                  </p>
                  <h1 className="m-0 font-heading text-[clamp(2.2rem,7vw,4.4rem)] uppercase leading-[0.9] tracking-[-0.07em]">
                    AI EVALUATION
                    <span className="block text-[#6f7774]">COMPLETE</span>
                  </h1>
                  <p className="mt-[14px] max-w-[58ch] text-[13px] leading-[1.7] text-[#9daba6]">
                    {trimmedForm.appName} is being pressure-tested against {primaryAudienceDisplay.toLowerCase()} demand,
                    launch feasibility, and commercial survivability.
                  </p>
                </div>
                <div className="self-stretch xl:pl-2">
                  <div className="grid h-full min-h-[132px] grid-cols-2 border border-white/6 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    <div className="flex flex-col justify-between px-[18px] py-[16px]">
                      <div className="text-[9px] uppercase tracking-[0.18em] text-[#7d8986]">
                        Confidence
                      </div>
                      <div className="font-heading text-[3rem] font-bold leading-none tracking-[-0.08em] text-[var(--primary)] xl:text-[3.25rem]">
                        {evaluation.confidence}%
                      </div>
                    </div>
                    <div className="flex flex-col justify-between border-l border-white/6 px-[18px] py-[16px]">
                      <div className="text-[9px] uppercase tracking-[0.18em] text-[#7d8986]">
                        Risk profile
                      </div>
                      <div className="font-heading text-[2rem] font-semibold leading-none tracking-[-0.06em] text-[#d49a74] xl:text-[2.2rem]">
                        {evaluation.riskLevel}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-[26px] pb-0 pt-5">
                <AIPersonasBar
                  claudeEval={evaluation}
                  gptEval={gptEval}
                  gptError={gptError}
                />
              </div>
            </section>

            <div className="grid gap-[18px] xl:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.65fr)]">
              <section className="relative border border-white/7 bg-[linear-gradient(180deg,rgba(19,19,19,0.98)_0%,rgba(11,11,11,0.98)_100%)] px-[18px] pb-4 pt-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="mb-[14px] text-[11px] uppercase tracking-[0.14em] text-[#e4e8e7]">Kill shots detected</p>
                <div className="grid gap-[10px]">
                  {(evaluation.killShots.length > 0
                    ? evaluation.killShots
                    : evaluation.keyDrivers.length > 0
                      ? evaluation.keyDrivers
                      : ["No structural kill shot surfaced in the current evaluation."])
                    .slice(0, 3)
                    .map((item, index) => (
                      <div key={`${item}-${index}`} className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3 border-t border-white/5 pt-[10px]">
                        <span className="font-mono text-[11px] tracking-[0.12em] text-[#7a6661]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <strong className="mb-1 block text-[11px] uppercase tracking-[0.04em] text-[#dde5e2]">
                            {index === 0
                              ? "Data asymmetry"
                              : index === 1
                                ? "Acquisition pressure"
                                : "Execution discipline"}
                          </strong>
                          <span className="text-[12px] leading-[1.65] text-[#93a19c]">{item}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </section>

              <section className="relative border border-white/7 bg-[linear-gradient(180deg,rgba(19,19,19,0.98)_0%,rgba(11,11,11,0.98)_100%)] px-[18px] pb-4 pt-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="mb-[14px] text-[11px] uppercase tracking-[0.14em] text-[#e4e8e7]">Founder reality check</p>
                <div className="grid gap-[10px]">
                  {(evaluation.founderRealityCheck.length > 0
                    ? evaluation.founderRealityCheck
                    : evaluation.keyDrivers)
                    .slice(0, 4)
                    .map((item, index) => (
                      <div key={`${item}-${index}`} className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3 border-t border-white/5 pt-[10px]">
                        <span className="font-mono text-[11px] tracking-[0.12em] text-[#7a6661]">+</span>
                        <div>
                          <strong className="mb-1 block text-[11px] uppercase tracking-[0.04em] text-[#dde5e2]">
                            {index === 0
                              ? "Truth"
                              : index === 1
                                ? "Market"
                                : index === 2
                                  ? "Moat"
                                  : "Constraint"}
                          </strong>
                          <span className="text-[12px] leading-[1.65] text-[#93a19c]">{item}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            </div>

            <section className="relative border border-white/7 bg-[linear-gradient(180deg,rgba(19,19,19,0.98)_0%,rgba(11,11,11,0.98)_100%)] px-[18px] pb-4 pt-[22px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="mb-[18px] text-center text-[12px] uppercase tracking-[0.18em] text-[#dfe6e4]">Architectural parameters</p>
              <div className="grid gap-[18px] sm:grid-cols-2 xl:grid-cols-5">
                <ProgressBar
                  label="Market viability"
                  metricKey="marketViability"
                  value={evaluation.scores.marketViability}
                />
                <ProgressBar
                  label="AI leverage"
                  metricKey="aiLeverage"
                  value={evaluation.scores.aiLeverage}
                />
                <ProgressBar
                  label="Monetization"
                  metricKey="monetizationPotential"
                  value={evaluation.scores.monetizationPotential}
                />
                <ProgressBar
                  label="Viral potential"
                  metricKey="viralPotential"
                  value={evaluation.scores.viralPotential}
                />
                <ProgressBar
                  label="Dev complexity"
                  metricKey="devComplexity"
                  value={evaluation.scores.devComplexity}
                  invert
                />
              </div>
            </section>

            <section className="relative border border-white/7 bg-[linear-gradient(180deg,rgba(19,19,19,0.98)_0%,rgba(11,11,11,0.98)_100%)] px-[18px] pb-4 pt-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="grid gap-6 xl:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.1fr)]">
                <div className="grid gap-[10px]">
                  <div className="mb-0.5 text-[9px] uppercase tracking-[0.2em] text-[#6f7c78]">
                    Commercial benchmarks
                  </div>
                  {commercialBlocks.map((block) => {
                    const tone = block.warn
                      ? "#ff9c9c"
                      : block.highlight || "#f2f6f4";
                    return (
                      <div
                        key={block.label}
                        className="border border-white/6 bg-[#131313] px-[16px] py-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                        style={{
                          borderColor: block.warn
                            ? "#ff5e5e22"
                            : block.highlight
                              ? `${block.highlight}26`
                              : "rgba(255,255,255,0.06)",
                        }}
                      >
                        <div className="mb-2 text-[9px] uppercase tracking-[0.18em] text-[#7b8884]">
                          {block.label}
                        </div>
                        <div
                          className="font-heading text-[1.35rem] leading-none tracking-[-0.05em]"
                          style={{ color: tone }}
                        >
                          {block.value}
                        </div>
                        <div
                          className={`mt-2 text-[11px] leading-[1.55] ${
                            block.warn ? "text-[#d39a9a]" : "text-[#8d9b96]"
                          }`}
                        >
                          {block.sub}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid content-start gap-1">
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(128px,148px)_88px] items-end gap-4 border-b border-white/6 pb-[10px]">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-[#6f7c78]">
                      Financial projection model
                    </div>
                    <div className="text-right text-[9px] uppercase tracking-[0.2em] text-[#55615d]">
                      Target value
                    </div>
                    <div className="text-right text-[9px] uppercase tracking-[0.2em] text-[#55615d]">
                      Probability
                    </div>
                  </div>
                  {financialModelRows.map((row) => (
                    <div
                      key={row.metric}
                      className="grid grid-cols-[minmax(0,1fr)_minmax(128px,148px)_88px] items-center gap-4 border-b border-white/6 py-[10px] last:border-b-0"
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-[#d8dfdc]">
                          {row.metric}
                        </div>
                      </div>
                      <div className="whitespace-nowrap text-right text-[12px] font-medium tabular-nums text-[#eef3f1] xl:text-[13px]">
                        {row.targetValue}
                      </div>
                      <div
                        className="whitespace-nowrap text-right text-[10px] uppercase tracking-[0.16em]"
                        style={{ color: row.accent }}
                      >
                        {row.probability}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </section>

            <section className="relative border border-white/7 bg-[linear-gradient(180deg,rgba(19,19,19,0.98)_0%,rgba(11,11,11,0.98)_100%)] px-[18px] pb-4 pt-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="mb-[14px] text-[11px] uppercase tracking-[0.14em] text-[#e4e8e7]">Strategic roadmap</p>
              <div className="grid gap-[10px]">
                {[
                  { t: "DEVELOPMENT APPROACH", v: evaluation.devApproach },
                  { t: "MONETIZATION STRATEGY", v: evaluation.monetizationStrategy },
                  { t: "MARKETING APPROACH", v: evaluation.marketingApproach },
                  {
                    t: "RISKS & LIMITATIONS",
                    v: evaluation.risks || evaluation.additionalInsights,
                    supplementary:
                      evaluation.dependencies.length > 0 ? (
                        <>
                          {evaluation.dependencies.slice(0, 4).map((dependency, index) => (
                            <Tag key={`${dependency}-${index}`}>{dependency}</Tag>
                          ))}
                        </>
                      ) : null,
                  },
                ]
                  .filter((sec) => sec.v)
                  .map((sec, index) => (
                    <CollapsibleSection
                      key={sec.t}
                      title={sec.t}
                      summary={sec.v.slice(0, 100) + (sec.v.length > 100 ? "..." : "")}
                      content={sec.v}
                      supplementary={sec.supplementary}
                      defaultOpen={index === 3}
                    />
                  ))}
              </div>
            </section>

            {error ? (
              <div className="border border-[#ff444433] bg-[#ff444411] px-[14px] py-[10px]">
                <p className="m-0 text-[12px] text-[#ff7777]">{error}</p>
              </div>
            ) : null}

            {step === "done1" && (
              <div className="pt-2 text-center">
                <button
                  onClick={runAgent2}
                  className="inline-flex bg-[var(--primary)] px-[34px] py-4 text-[13px] tracking-[0.16em] text-[#06211f] shadow-[0_0_28px_rgba(79,219,200,0.26)]"
                >
                  RUN AGENT 2
                </button>
                <p className="mt-[10px] text-[10px] uppercase tracking-[0.18em] text-[#6f7b77]">Design app screen protocol</p>
              </div>
            )}

            {/* ── Agent 2 output ── */}
            {step === "done2" && htmlOutput && (
              <div
                style={{
                  marginTop: 44,
                  borderTop: "1px solid #161616",
                  paddingTop: 40,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 24,
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <p
                      style={{
                        color: "var(--primary)",
                        fontSize: 10,
                        letterSpacing: 2,
                        marginBottom: 4,
                      }}
                    >
                      ✓ MOBILE SCREEN GENERATED
                    </p>
                    <p style={{ color: "#b0bbb8", fontSize: 11 }}>
                      iPhone 15 · 390×844px · Sonnet 4.5
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <div
                      style={{
                        display: "flex",
                        border: "1px solid #1e1e1e",
                        borderRadius: 6,
                        overflow: "hidden",
                      }}
                    >
                      {[
                        { id: "preview", l: "📱 PREVIEW" },
                        { id: "code", l: "</> CODE" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setUiTab(t.id as UiTab)}
                          style={{
                            background: uiTab === t.id ? "#1a1a1a" : "none",
                            border: "none",
                            color:
                              uiTab === t.id ? "var(--primary)" : "#bcc7c4",
                            padding: "8px 16px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            fontSize: 11,
                            letterSpacing: 1,
                          }}
                        >
                          {t.l}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => copyToClipboard(htmlOutput)}
                      style={{
                        background: "none",
                        border: "1px solid #2a2a2a",
                        color: "#bcc7c4",
                        padding: "8px 14px",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 11,
                        letterSpacing: 1,
                      }}
                    >
                      COPY HTML
                    </button>
                  </div>
                </div>

                {uiTab === "preview" && (
                  <div className="pscale">
                    <PhonePreview html={htmlOutput} />
                    <p
                      style={{
                        textAlign: "center",
                        color: "#adb8b5",
                        fontSize: 11,
                        marginTop: 4,
                      }}
                    >
                      {trimmedForm.appName} · Core screen mockup
                    </p>
                  </div>
                )}

                {uiTab === "code" && (
                  <div>
                    <pre
                      style={{
                        background: "#0d0d0d",
                        border: "1px solid #1a1a1a",
                        borderRadius: 8,
                        padding: "20px 18px",
                        fontSize: 11,
                        lineHeight: 1.8,
                        color: "#c2cdc9",
                        maxHeight: 560,
                        overflowY: "auto",
                        overflowX: "auto",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {htmlOutput}
                    </pre>
                    <p style={{ color: "#b0bbb8", fontSize: 11, marginTop: 10 }}>
                      Save as index.html · Open at 390px width for accurate
                      preview
                    </p>
                  </div>
                )}

                {/* ── Google Stitch Prompt ── */}
                <div
                  style={{
                    marginTop: 36,
                    border: "1px solid #1e2a1e",
                    background: "#0a120a",
                    borderRadius: 8,
                    padding: "20px 22px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: "var(--primary)",
                          fontSize: 10,
                          letterSpacing: 2,
                          marginBottom: 3,
                        }}
                      >
                        ✦ GOOGLE STITCH PROMPT
                      </p>
                      <p style={{ color: "#afbbb7", fontSize: 11 }}>
                        Paste into Google Stitch to generate the full app design
                      </p>
                    </div>
                    <button
                      onClick={copyStitchPrompt}
                      style={{
                        background: stitchCopied ? "var(--primary)15" : "none",
                        border: `1px solid ${stitchCopied ? "var(--primary)44" : "#2a2a2a"}`,
                        color: stitchCopied ? "var(--primary)" : "#bcc7c4",
                        padding: "7px 16px",
                        borderRadius: 5,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 10,
                        letterSpacing: 1.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.2s",
                      }}
                    >
                      <span>{stitchCopied ? "✓" : "⎘"}</span>
                      <span>{stitchCopied ? "COPIED!" : "COPY PROMPT"}</span>
                    </button>
                  </div>
                  <pre
                    style={{
                      background: "#060e06",
                      border: "1px solid #1a2a1a",
                      borderRadius: 6,
                      padding: "14px 16px",
                      fontSize: 11,
                      lineHeight: 1.8,
                      color: "#6a9a6a",
                      maxHeight: 220,
                      overflowY: "auto",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      margin: 0,
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {buildStitchPrompt()}
                  </pre>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 28,
                    flexWrap: "wrap",
                  }}
                >
                  <button onClick={reset} style={btnGhost}>
                    ↺ EVALUATE ANOTHER IDEA
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

