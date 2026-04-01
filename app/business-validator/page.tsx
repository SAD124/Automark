"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";

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

function calcGPTCost(usage: any) {
  if (!usage) return 0;
  return (
    Math.max(0, usage.prompt_tokens || 0) * PRICE_GPT4O.input +
    Math.max(0, usage.completion_tokens || 0) * PRICE_GPT4O.output
  );
}

function calcCost(usage: any) {
  if (!usage) return 0;
  return (
    Math.max(0, usage.input_tokens || 0) * PRICE.input +
    Math.max(0, usage.output_tokens || 0) * PRICE.output +
    Math.max(0, usage.cache_creation_input_tokens || 0) * PRICE.cacheWrite +
    Math.max(0, usage.cache_read_input_tokens || 0) * PRICE.cacheRead
  );
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

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
  systemPrompt: any,
  userMsg: any,
  maxTokens: any,
  signal: any,
  model = "claude-haiku-4-5-20251001",
  useCache = true,
) {
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
    } catch (_) {}
    throw new Error(msg);
  }

  const data = await res.json();

  if (data.error) {
    const err = Object.assign(new Error(data.error.message || "API error"), {
      status: res.status,
    });
    throw err;
  }

  const text = (data.content || []).map((b: any) => b.text || "").join("");
  return { text, usage: data.usage || {} };
}

async function callClaude(
  systemPrompt: any,
  userMsg: any,
  maxTokens: any,
  model = "claude-haiku-4-5-20251001",
  useCache = true,
) {
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
      const error = err as any;
      const isTimeout = error.name === "AbortError";
      const isTransient = TRANSIENT_CODES.has(error.status);
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
}

// ─── OpenAI call ─────────────────────────────────────────────────────────────
async function callOpenAI(systemPrompt: any, userMsg: any, maxTokens = 3200) {
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
        } catch (_) {}
        const err = Object.assign(new Error(msg), { status: res.status });
        if (attempt < 2 && [429, 500, 502, 503].includes(res.status)) {
          await new Promise((r) => setTimeout(r, attempt === 0 ? 1500 : 3000));
          continue;
        }
        throw err;
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "OpenAI error");

      const text = data.choices?.[0]?.message?.content || "";
      const usage = data.usage || {};
      return { text, usage };
    } catch (err) {
      clearTimeout(timer);
      const error = err as any;
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
}

// ─── JSON parse with truncation repair ───────────────────────────────────────
function repairTruncatedJSON(str: any) {
  // Walk the string tracking open braces/brackets/strings and close them
  let inString = false;
  let escape = false;
  const stack = [];
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\") {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
    } else if (!inString) {
      if (c === "{") stack.push("}");
      else if (c === "[") stack.push("]");
      else if (c === "}" || c === "]") stack.pop();
    }
  }
  // If we're mid-string, close it first
  let repaired = str;
  if (inString) repaired += '"';
  // Close any trailing comma before closing structure
  repaired = repaired.replace(/,\s*$/, "");
  // Close open structures in reverse order
  repaired += stack.reverse().join("");
  return repaired;
}

function parseAgentJSON(raw) {
  // Extract the outermost JSON object (handles preamble/postamble text)
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match)
    throw new Error(
      "Agent returned no JSON object. Raw output: " + raw.slice(0, 200),
    );
  const candidate = match[0];

  // Try clean parse first
  try {
    return JSON.parse(candidate);
  } catch (_) {}

  // Try repair (handles token-limit truncation mid-JSON)
  try {
    const repaired = repairTruncatedJSON(candidate);
    return JSON.parse(repaired);
  } catch (e) {
    throw new Error("Agent returned malformed JSON: " + e.message);
  }
}

// ─── HTML builder (repair truncation) ────────────────────────────────────────
function buildHTML(rawHTML) {
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
      const cutIdx = styleOpen + 7 + htmlLeak.index;
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

function normalizeEval(raw) {
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
      competitionRisk: VALID_RISKS.has(s.competitionRisk)
        ? s.competitionRisk
        : "Medium",
      viralPotential: clampScore(s.viralPotential),
    },
    verdict: VALID_VERDICTS.has(raw.verdict) ? raw.verdict : "MAYBE",
    verdictLabel: VALID_VERDICT_LABELS.has(raw.verdictLabel)
      ? raw.verdictLabel
      : raw.verdict === "GO"
        ? "CAUTIOUS GO"
        : raw.verdict === "NO-GO"
          ? "NO-GO"
          : "HIGH RISK",
    riskLevel: VALID_RISK_LEVELS.has(raw.riskLevel) ? raw.riskLevel : "Medium",
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

function clampScore(v) {
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

function ProgressBar({ label, metricKey, value, invert = false, benchmark }) {
  const safe = isNaN(value) ? 5 : value;
  const pct = (safe / 10) * 100;
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
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 5,
          alignItems: "baseline",
        }}
      >
        <span style={{ color: "#888", fontSize: 12 }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#444", fontSize: 10 }}>{contextLabel}</span>
          <span
            style={{
              color,
              fontSize: 12,
              fontFamily: "monospace",
              fontWeight: 700,
            }}
          >
            {safe}/10
          </span>
        </div>
      </div>
      <div
        style={{
          background: "#1a1a1a",
          borderRadius: 2,
          height: 4,
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            background: color,
            height: 4,
            borderRadius: 2,
            transition: "width 1.2s ease",
          }}
        />
        {bmPct !== null && (
          <div
            style={{
              position: "absolute",
              left: `${bmPct}%`,
              top: -2,
              width: 1,
              height: 8,
              background: "#333",
            }}
            title="Industry benchmark"
          />
        )}
      </div>
      {bm && (
        <div
          style={{
            color: "#555",
            fontSize: 9,
            marginTop: 3,
            letterSpacing: 0.5,
          }}
        >
          {bm.label}
        </div>
      )}
    </div>
  );
}

function Chip({ label, value, highlight, sub, warn }) {
  const color = highlight || "var(--primary)";
  return (
    <div
      style={{
        border: `1px solid ${warn ? "#ff444433" : color + "30"}`,
        background: warn ? "#ff444408" : `${color}0a`,
        borderRadius: 6,
        padding: "10px 14px",
        minWidth: 120,
      }}
    >
      <div
        style={{
          color: "#555",
          fontSize: 10,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: warn ? "#ff7777" : color,
          fontSize: 14,
          fontWeight: 700,
          fontFamily: "monospace",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            color: warn ? "#ff444488" : "#333",
            fontSize: 10,
            marginTop: 4,
            lineHeight: 1.4,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function Tag({ children }) {
  return (
    <span
      style={{
        background: "#111",
        border: "1px solid #222",
        color: "#777",
        fontSize: 11,
        padding: "3px 9px",
        borderRadius: 4,
        display: "inline-block",
        marginBottom: 4,
      }}
    >
      {children}
    </span>
  );
}

function CollapsibleSection({ title, summary, content }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        borderLeft: `2px solid ${open ? "var(--primary)44" : "#1e1e1e"}`,
        paddingLeft: 18,
        marginBottom: 16,
        transition: "border-color 0.2s",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: open
            ? "var(--primary)08"
            : hovered
              ? "#ffffff05"
              : "none",
          border: `1px solid ${open ? "var(--primary)22" : hovered ? "#2a2a2a" : "transparent"}`,
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
          padding: "7px 10px",
          borderRadius: 5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "background 0.15s, border-color 0.15s",
          marginLeft: -10,
        }}
      >
        <span
          style={{
            color: open ? "#ccc" : hovered ? "#aaa" : "#777",
            fontSize: 10,
            letterSpacing: 2,
            textTransform: "uppercase",
            transition: "color 0.15s",
          }}
        >
          {title}
        </span>
        <span
          style={{
            color: open ? "var(--primary)" : hovered ? "#aaa" : "#666",
            fontSize: 10,
            display: "flex",
            alignItems: "center",
            gap: 4,
            transition: "color 0.15s",
          }}
        >
          <span
            style={{
              display: "inline-block",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            ▼
          </span>
          <span>{open ? "collapse" : "expand"}</span>
        </span>
      </button>
      {/* Always-visible one-line summary when collapsed */}
      {!open && summary && (
        <p
          style={{
            color: "#666",
            fontSize: 12,
            marginTop: 7,
            lineHeight: 1.6,
            fontStyle: "italic",
          }}
        >
          {summary}
        </p>
      )}
      {/* Full content when expanded */}
      {open && (
        <p
          style={{
            color: "#bbb",
            fontSize: 13,
            lineHeight: 1.9,
            marginTop: 10,
            whiteSpace: "pre-wrap",
          }}
        >
          {content || "—"}
        </p>
      )}
    </div>
  );
}

function Spinner({ label, substep, isAgent2 }) {
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

function CostBar({ runs }) {
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
}

function PhonePreview({ html }) {
  const iframeRef = useRef(null);
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

function CeoAvatar({ name, accent, src }) {
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

// riskColor helper (used inside component, defined before main component)
const riskColorFn = (r) =>
  r === "Low"
    ? "var(--primary)"
    : r === "Medium"
      ? "var(--secondary)"
      : r === "High"
        ? "#ff8800"
        : "#ff4444";

const vlColorFn = (label) =>
  label === "STRONG GO"
    ? "var(--primary)"
    : label === "CAUTIOUS GO"
      ? "#a8ff78"
      : label === "HIGH RISK"
        ? "var(--secondary)"
        : "#ff4444";

function AIPersonasBar({ gptEval, gptError }) {
  const personas = [
    {
      key: "dario",
      name: "Dario Amodei",
      title: "CEO · Anthropic",
      model: "Claude Haiku 4.5",
      accent: "var(--primary)",
      eval: null, // Claude eval shown in main card, not here
      active: true,
      tag: "CLAUDE",
    },
    {
      key: "sam",
      name: "Sam Altman",
      title: "CEO · OpenAI",
      model: "GPT-4o",
      accent: "#74b9ff",
      eval: gptEval,
      active: true,
      tag: "GPT-4o",
    },
  ];

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
          const hasResult = p.key === "dario" || (p.key === "sam" && p.eval);
          const isLoading = p.key === "sam" && !p.eval && !gptError;
          const hasError = p.key === "sam" && gptError;
          return (
            <div
              key={p.key}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                background: "#0f0f0f",
                border: `1px solid ${p.accent}33`,
                borderRadius: 8,
                padding: "12px 14px",
                flex: "1 1 220px",
              }}
            >
              {/* Photo */}
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

              {/* Info + verdict */}
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

                {/* Claude always shows "see above" */}
                {p.key === "dario" && (
                  <div
                    style={{
                      color: "var(--primary)",
                      fontSize: 11,
                      fontStyle: "italic",
                    }}
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
                        "{p.eval.executiveSummary}"
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
      {gptEval && <ConsensusBar claudeEval={null} gptEval={gptEval} />}
    </div>
  );
}

// ─── Consensus Score ──────────────────────────────────────────────────────────
function ConsensusBar({ gptEval }) {
  if (!gptEval) return null;

  // Agreement is shown at the bottom of AIPersonasBar — this is a separate block
  return null; // handled inline above
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function AutoMarkBusinessValidator() {
  const [step, setStep] = useState("input");
  const [substep, setSubstep] = useState("");

  const savedDraft = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    } catch {
      return null;
    }
  }, []);

  const [form, setForm] = useState(
    savedDraft || {
      appName: "",
      description: "",
      audience: "",
      budget: "",
      revenue: "",
    },
  );
  const [optionsVisible, setOptionsVisible] = useState(
    !!(savedDraft?.audience || savedDraft?.budget || savedDraft?.revenue),
  );

  const [evaluation, setEval] = useState(null);
  const [gptEval, setGptEval] = useState(null); // OpenAI parallel result
  const [gptError, setGptError] = useState(""); // non-fatal if GPT fails
  const [htmlOutput, setHTML] = useState("");
  const [uiTab, setUiTab] = useState("preview");
  const [error, setError] = useState("");
  const [costRuns, setCostRuns] = useState([]);
  const [ctaState, setCtaState] = useState("idle");

  const runningRef = useRef(false);

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
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

  const addCost = useCallback((label, usage, isGPT = false) => {
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

  const set = (k) => (e) => {
    const updated = { ...form, [k]: e.target.value };
    setForm(updated);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
    } catch {}
    if ((k === "appName" || k === "description") && e.target.value.length > 0) {
      setOptionsVisible(true);
    }
  };

  const trimmedForm = {
    appName: form.appName.trim(),
    description: form.description.trim(),
    audience: form.audience.trim(),
    budget: form.budget.trim(),
    revenue: form.revenue.trim(),
  };

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
Budget: ${trimmedForm.budget || "$0 bootstrap"}
Revenue model: ${trimmedForm.revenue || "Open to suggestions"}`;

    // ── Run Claude + GPT-4o in parallel ──────────────────────────────────────
    const [claudeResult, gptResult] = await Promise.allSettled([
      callClaude(AGENT1_SYSTEM, msg, 3200),
      callOpenAI(AGENT1_SYSTEM, msg, 3200),
    ]);

    // Claude is required — if it fails, abort
    if (claudeResult.status === "rejected") {
      setError("Agent 1 failed: " + claudeResult.reason.message);
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
      setError("Agent 1 failed: " + e.message);
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
        setGptError("GPT-4o parse error: " + e.message);
      }
    } else {
      setGptError("GPT-4o unavailable: " + gptResult.reason.message);
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
    setCostRuns((prev) => prev.filter((r) => r.label === "Agent 1 — Evaluate"));

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
      setError("Agent 2 failed: " + e.message);
      setStep("done1");
    } finally {
      setSubstep("");
      runningRef.current = false;
    }
  };

  const reset = () => {
    if (runningRef.current) return;
    setStep("input");
    setSubstep("");
    setForm({
      appName: "",
      description: "",
      audience: "",
      budget: "",
      revenue: "",
    });
    setOptionsVisible(false);
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
  const [pdfCopied, setPdfSaving] = useState(false);

  const vColor =
    evaluation?.verdict === "GO"
      ? "var(--primary)"
      : evaluation?.verdict === "NO-GO"
        ? "#ff4444"
        : "var(--secondary)";
  const vlColor =
    evaluation?.verdictLabel === "STRONG GO"
      ? "var(--primary)"
      : evaluation?.verdictLabel === "CAUTIOUS GO"
        ? "#a8ff78"
        : evaluation?.verdictLabel === "HIGH RISK"
          ? "var(--secondary)"
          : "#ff4444";
  const riskColor = (r) =>
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
  const savePDF = useCallback(() => {
    setPdfSaving(true);
    // Add print title
    const prevTitle = document.title;
    document.title = `${trimmedForm.appName} — AutoMark Evaluation`;
    window.print();
    document.title = prevTitle;
    setTimeout(() => setPdfSaving(false), 1500);
  }, [trimmedForm.appName]);

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

  const inputStyle = {
    width: "100%",
    background: "#0d0d0d",
    border: "1px solid #2c2c2c",
    borderRadius: 6,
    color: "#e8e8e8",
    padding: "11px 14px",
    fontFamily: "'IBM Plex Mono',monospace",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };
  const labelStyle = {
    display: "block",
    color: "#666",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 7,
  };
  const secTitle = {
    color: "#777",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 7,
  };
  const btnPrimary = {
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
  const btnGhost = {
    background: "none",
    border: "1px solid #1e1e1e",
    color: "#444",
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
            color: "#333",
            border: "1px solid #222",
            cursor: "not-allowed",
            boxShadow: "none",
          };

  // Budget gap detection
  const hasBudgetGap =
    evaluation &&
    evaluation.budgetAssessment.gap !== "none" &&
    evaluation.budgetAssessment.gap !== "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080808",
        color: "#d8d8d8",
        fontFamily: "'IBM Plex Mono','Courier New',monospace",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 2px rgba(0,255,157,0.12), 0 0 12px rgba(0,255,157,0.08) !important;
        }
        input::placeholder, textarea::placeholder { color: #3a3a3a; }
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
        @media (max-width: 600px) {
          .g2    { grid-template-columns: 1fr !important; }
          .chips { flex-wrap: wrap !important; }
          .psteps{ display: none !important; }
          .tbar  { padding: 10px 16px !important; }
          .mpad  { padding: 28px 16px !important; }
          .pscale{ transform: scale(0.72) !important; transform-origin: top center !important; margin-bottom: -220px !important; }
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
      <div
        className="tbar"
        style={{
          borderBottom: "1px solid #161616",
          padding: "11px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#0b0b0b",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 7,
              height: 7,
              background: "var(--primary)",
              borderRadius: "50%",
              boxShadow: "0 0 8px var(--primary)66",
            }}
          />
          <span
            style={{
              color: "var(--primary)",
              fontSize: 12,
              letterSpacing: 3,
              fontWeight: 700,
            }}
          >
            TXLABZ
          </span>
          <span style={{ color: "#222" }}>/</span>
          <span style={{ color: "#888", fontSize: 12 }}>IDEA PIPELINE</span>
        </div>
        <div
          className="psteps"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
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
              <div
                key={s.id}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                {i > 0 && (
                  <span style={{ color: "#333", fontSize: 10 }}>────</span>
                )}
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: past ? "var(--primary)" : active ? "#fff" : "#555",
                  }}
                >
                  {past && !active ? "✓ " : ""}
                  {s.l}
                </span>
              </div>
            );
          })}
        </div>
        {step !== "input" && (
          <button
            onClick={reset}
            disabled={isRunning}
            style={{
              background: "none",
              border: "1px solid #2a2a2a",
              color: isRunning ? "#333" : "#777",
              padding: "5px 14px",
              borderRadius: 4,
              cursor: isRunning ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              fontSize: 10,
              letterSpacing: 1,
            }}
          >
            ↺ RESET
          </button>
        )}
      </div>

      {/* ── Main content ── */}
      <div
        className="mpad"
        style={{ maxWidth: 900, margin: "0 auto", padding: "44px 24px" }}
      >
        {/* ════ INPUT FORM ════ */}
        {step === "input" && (
          <div>
            <div style={{ marginBottom: 40 }}>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 10,
                  letterSpacing: -0.5,
                  lineHeight: 1.2,
                }}
              >
                Drop your app idea.
              </h1>
              <p
                style={{
                  color: "#aaa",
                  fontSize: 14,
                  lineHeight: 1.7,
                  maxWidth: 480,
                }}
              >
                Get an{" "}
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                  instant viability score
                </span>{" "}
                and{" "}
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                  live UI mock
                </span>{" "}
                — powered by a 2-agent AI pipeline.
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <span
                style={{
                  color: "#444",
                  fontSize: 10,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginRight: 10,
                }}
              >
                Try an example
              </span>
              {EXAMPLE_IDEAS.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const updated = {
                      ...form,
                      appName: ex.name,
                      description: ex.desc,
                    };
                    setForm(updated);
                    setOptionsVisible(true);
                    try {
                      localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
                    } catch {}
                  }}
                  style={{
                    background: "none",
                    border: "1px solid #2a2a2a",
                    color: "#555",
                    borderRadius: 4,
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 11,
                    marginRight: 8,
                    marginBottom: 6,
                    letterSpacing: 0.5,
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = "var(--primary)66";
                    e.target.style.color = "var(--primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = "#2a2a2a";
                    e.target.style.color = "#555";
                  }}
                >
                  {ex.name}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <label style={labelStyle}>
                  App Name <span style={{ color: "var(--primary)" }}>*</span>
                </label>
                <input
                  value={form.appName}
                  onChange={set("appName")}
                  placeholder="e.g. ReceiptRadar"
                  style={inputStyle}
                  autoFocus
                />
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 7,
                  }}
                >
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    What does it do?{" "}
                    <span style={{ color: "var(--primary)" }}>*</span>
                  </label>
                  <span
                    style={{
                      color:
                        form.description.length > 400
                          ? "var(--secondary)"
                          : "#333",
                      fontSize: 10,
                      fontFamily: "monospace",
                    }}
                  >
                    {form.description.length}/600
                  </span>
                </div>
                <textarea
                  value={form.description}
                  onChange={set("description")}
                  placeholder="Describe the core product, problem it solves, and key features..."
                  rows={7}
                  maxLength={600}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    lineHeight: 1.75,
                    minHeight: 130,
                  }}
                />
                <p
                  style={{
                    color: "#444",
                    fontSize: 11,
                    marginTop: 7,
                    lineHeight: 1.6,
                  }}
                >
                  <span style={{ color: "var(--primary)66" }}>tip:</span> Be
                  specific about the problem and key features. Better input =
                  better evaluation.
                </p>
              </div>

              {optionsVisible && (
                <div className="reveal-fields">
                  <div
                    style={{
                      borderTop: "1px solid #161616",
                      paddingTop: 20,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        color: "#666",
                        fontSize: 10,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                      }}
                    >
                      Optional · Improves accuracy
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 20,
                      marginTop: 16,
                    }}
                  >
                    <div
                      className="g2"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                      }}
                    >
                      <div>
                        <label style={labelStyle}>Target Audience</label>
                        <input
                          value={form.audience}
                          onChange={set("audience")}
                          placeholder="e.g. Freelancers, SaaS founders"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Rough Budget</label>
                        <input
                          value={form.budget}
                          onChange={set("budget")}
                          placeholder="e.g. $0 bootstrap"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Preferred Revenue Model</label>
                      <input
                        value={form.revenue}
                        onChange={set("revenue")}
                        placeholder="e.g. Monthly SaaS, freemium, one-time"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div
                style={{
                  marginTop: 20,
                  background: "#ff444411",
                  border: "1px solid #ff444433",
                  borderRadius: 6,
                  padding: "10px 14px",
                }}
              >
                <p style={{ color: "#ff7777", fontSize: 12 }}>
                  &#9888; {error}
                </p>
              </div>
            )}

            <div style={{ marginTop: 0 }}>
              <button
                onClick={runAgent1}
                disabled={!canRun1 || ctaState === "running"}
                className={ctaState === "ready" ? "cta-ready" : ""}
                style={ctaBtnStyle}
              >
                {ctaState === "running" ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ display: "inline-flex", gap: 4 }}>
                      <span
                        className="dot1"
                        style={{
                          display: "inline-block",
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "#000",
                        }}
                      />
                      <span
                        className="dot2"
                        style={{
                          display: "inline-block",
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "#000",
                        }}
                      />
                      <span
                        className="dot3"
                        style={{
                          display: "inline-block",
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "#000",
                        }}
                      />
                    </span>
                    AGENT ANALYZING...
                  </span>
                ) : (
                  "RUN AGENT 1 \u2192 EVALUATE"
                )}
              </button>
              <p
                style={{
                  color: "#555",
                  fontSize: 11,
                  marginTop: 12,
                  letterSpacing: 0.5,
                }}
              >
                <span style={{ color: "var(--primary)88" }}>Claude</span> +{" "}
                <span style={{ color: "#74b9ff88" }}>GPT-4o</span> run in
                parallel · 8 viability signals · ~15s
              </p>
            </div>
          </div>
        )}

        {/* ════ LOADING ════ */}
        {step === "agent1" && <Spinner label="EVALUATING" />}
        {step === "agent2" && <Spinner label="DESIGNING" isAgent2 />}

        {/* ════ RESULTS ════ */}
        {(step === "done1" || step === "done2") && evaluation && (
          <div>
            {/* ── Save PDF button ── */}
            <div
              className="no-print"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 16,
              }}
            >
              <button
                onClick={savePDF}
                disabled={pdfCopied}
                style={{
                  background: "none",
                  border: "1px solid #2a2a2a",
                  color: pdfCopied ? "var(--primary)" : "#777",
                  padding: "6px 14px",
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
                <span>{pdfCopied ? "✓" : "⬇"}</span>
                <span>{pdfCopied ? "OPENING PRINT..." : "SAVE AS PDF"}</span>
              </button>
            </div>

            {/* ── Layer 1: Executive Verdict Card ── */}
            <div
              style={{
                border: `1px solid ${vlColor}30`,
                background: `${vlColor}06`,
                borderRadius: 10,
                padding: "22px 24px",
                marginBottom: 24,
              }}
            >
              {/* Row 1: verdict label + risk + confidence + app name */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    color: vlColor,
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: 4,
                  }}
                >
                  {evaluation.verdictLabel}
                </span>
                <span
                  style={{
                    background: `${vlColor}18`,
                    color: vlColor,
                    fontSize: 10,
                    padding: "4px 10px",
                    borderRadius: 20,
                    letterSpacing: 1,
                  }}
                >
                  {evaluation.confidence}% confidence
                </span>
                <span
                  style={{
                    background: `${riskColor(evaluation.riskLevel)}18`,
                    color: riskColor(evaluation.riskLevel),
                    fontSize: 10,
                    padding: "4px 10px",
                    borderRadius: 20,
                    letterSpacing: 1,
                  }}
                >
                  {evaluation.riskLevel} risk
                </span>
                <span
                  style={{ color: "#666", fontSize: 11, marginLeft: "auto" }}
                >
                  {trimmedForm.appName}
                </span>
              </div>

              {/* Row 2: One-line executive summary */}
              {evaluation.executiveSummary && (
                <p
                  style={{
                    color: "#ccc",
                    fontSize: 14,
                    lineHeight: 1.6,
                    marginBottom: 14,
                    fontStyle: "italic",
                    borderLeft: `2px solid ${vlColor}44`,
                    paddingLeft: 12,
                  }}
                >
                  "{evaluation.executiveSummary}"
                </p>
              )}

              {/* Row 3: Key drivers */}
              {evaluation.keyDrivers.length > 0 && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {evaluation.keyDrivers.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          color: vlColor,
                          fontSize: 10,
                          marginTop: 2,
                          flexShrink: 0,
                        }}
                      >
                        ▸
                      </span>
                      <span
                        style={{ color: "#888", fontSize: 12, lineHeight: 1.5 }}
                      >
                        {d}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Consensus signal — when both AIs agree/disagree */}
              {gptEval &&
                (() => {
                  const claudeScore =
                    evaluation.scores.marketViability +
                    evaluation.scores.monetizationPotential +
                    evaluation.scores.aiLeverage;
                  const gptScore =
                    gptEval.scores.marketViability +
                    gptEval.scores.monetizationPotential +
                    gptEval.scores.aiLeverage;
                  const diff = Math.abs(claudeScore - gptScore);
                  const agreement =
                    diff <= 3 ? "High" : diff <= 6 ? "Moderate" : "Low";
                  const aColor =
                    agreement === "High"
                      ? "var(--primary)"
                      : agreement === "Moderate"
                        ? "var(--secondary)"
                        : "#ff4444";
                  return (
                    <div
                      style={{
                        marginTop: 12,
                        marginBottom: 4,
                        padding: "8px 12px",
                        background: `${aColor}08`,
                        border: `1px solid ${aColor}22`,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          color: aColor,
                          fontSize: 10,
                          letterSpacing: 1.5,
                        }}
                      >
                        AI CONSENSUS
                      </span>
                      <span
                        style={{ color: aColor, fontSize: 13, fontWeight: 700 }}
                      >
                        {agreement} agreement
                      </span>
                      <span
                        style={{
                          color: "#666",
                          fontSize: 10,
                          marginLeft: "auto",
                        }}
                      >
                        Claude: {evaluation.confidence}% · GPT-4o:{" "}
                        {gptEval.confidence}%
                      </span>
                    </div>
                  );
                })()}

              {/* Dual CEO attribution */}
              <AIPersonasBar gptEval={gptEval} gptError={gptError} />
            </div>

            {/* ── Kill Shots (if any) ── */}
            {evaluation.killShots.length > 0 && (
              <div
                style={{
                  border: "1px solid #ff444433",
                  background: "#ff44440a",
                  borderRadius: 8,
                  padding: "16px 20px",
                  marginBottom: 24,
                }}
              >
                <p
                  style={{
                    color: "#ff4444",
                    fontSize: 10,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  ⚠ KILL SHOTS DETECTED
                </p>
                {evaluation.killShots.map((k, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      marginBottom: 7,
                    }}
                  >
                    <span
                      style={{
                        color: "#ff4444",
                        fontSize: 12,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      ✕
                    </span>
                    <span
                      style={{
                        color: "#ff7777",
                        fontSize: 12,
                        lineHeight: 1.6,
                      }}
                    >
                      {k}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Founder Reality Check ── */}
            {evaluation.founderRealityCheck.length > 0 && (
              <div
                style={{
                  border: "1px solid #ff880033",
                  background: "#ff880007",
                  borderRadius: 8,
                  padding: "16px 20px",
                  marginBottom: 24,
                }}
              >
                <p
                  style={{
                    color: "#ff8800",
                    fontSize: 10,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  FOUNDER REALITY CHECK
                </p>
                {evaluation.founderRealityCheck.map((r, i) => (
                  <div
                    key={i}
                    className="reality-item"
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      marginBottom: 10,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  >
                    <span
                      style={{ color: "#ff8800", fontSize: 13, flexShrink: 0 }}
                    >
                      →
                    </span>
                    <span
                      style={{
                        color: "#cc8800",
                        fontSize: 13,
                        lineHeight: 1.65,
                      }}
                    >
                      {r}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Parameter Scores ── */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ ...secTitle, marginBottom: 16 }}>PARAMETER SCORES</p>
              <div
                className="g2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px 40px",
                }}
              >
                <ProgressBar
                  label="Market Viability"
                  metricKey="marketViability"
                  value={evaluation.scores.marketViability}
                />
                <ProgressBar
                  label="Monetization Potential"
                  metricKey="monetizationPotential"
                  value={evaluation.scores.monetizationPotential}
                />
                <ProgressBar
                  label="AI Leverage"
                  metricKey="aiLeverage"
                  value={evaluation.scores.aiLeverage}
                />
                <ProgressBar
                  label="Viral / Growth"
                  metricKey="viralPotential"
                  value={evaluation.scores.viralPotential}
                />
                <ProgressBar
                  label="Dev Complexity (lower=better)"
                  metricKey="devComplexity"
                  value={evaluation.scores.devComplexity}
                  invert
                />
              </div>
            </div>

            {/* ── Cost / Timeline Chips (with context) ── */}
            <div
              className="chips"
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 28,
                flexWrap: "wrap",
              }}
            >
              <Chip
                label="Launch Cost"
                value={
                  evaluation.budgetAssessment.realistic ||
                  evaluation.scores.launchCost
                }
                warn={hasBudgetGap}
                sub={
                  hasBudgetGap
                    ? `Your budget: ${evaluation.budgetAssessment.stated} · Gap: ${evaluation.budgetAssessment.gap}`
                    : evaluation.budgetAssessment.note || undefined
                }
              />
              <Chip
                label="Time to Revenue"
                value={evaluation.scores.timeToRevenue}
                sub="First paying customer"
              />
              <Chip
                label="Competition"
                value={evaluation.scores.competitionRisk}
                highlight={riskColor(evaluation.scores.competitionRisk)}
                sub={
                  evaluation.scores.competitionRisk === "High"
                    ? "Funded incumbents present"
                    : evaluation.scores.competitionRisk === "Medium"
                      ? "Multiple alternatives exist"
                      : "Underserved niche"
                }
              />
            </div>

            {/* ── Financial Projection ── */}
            {evaluation.financialProjection.breakEvenUsers !== "Unknown" && (
              <div
                style={{
                  border: "1px solid #2a2a2a",
                  background: "#0f0f0f",
                  borderRadius: 8,
                  padding: "18px 22px",
                  marginBottom: 28,
                }}
              >
                <p
                  style={{
                    color: "#777",
                    fontSize: 10,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 14,
                  }}
                >
                  FINANCIAL PROJECTION
                </p>
                <div
                  className="g2"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                    marginBottom: 12,
                  }}
                >
                  {[
                    {
                      label: "Break-even Users",
                      value: evaluation.financialProjection.breakEvenUsers,
                    },
                    {
                      label: "MRR Target",
                      value: evaluation.financialProjection.mrrTarget,
                    },
                    {
                      label: "Time to Break-even",
                      value: evaluation.financialProjection.timeToBreakEven,
                    },
                    {
                      label: "Year 1 Revenue Range",
                      value: `${evaluation.financialProjection.revenueYear1Low} – ${evaluation.financialProjection.revenueYear1High}`,
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div
                        style={{
                          color: "#555",
                          fontSize: 10,
                          letterSpacing: 1.5,
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          color: "#e0e0e0",
                          fontSize: 14,
                          fontWeight: 600,
                          fontFamily: "monospace",
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
                {evaluation.financialProjection.keyAssumptions && (
                  <p
                    style={{
                      color: "#666",
                      fontSize: 11,
                      lineHeight: 1.6,
                      borderTop: "1px solid #1a1a1a",
                      paddingTop: 10,
                    }}
                  >
                    <span style={{ color: "#888" }}>Assumptions: </span>
                    {evaluation.financialProjection.keyAssumptions}
                  </p>
                )}
              </div>
            )}

            {/* ── Collapsible Text Sections ── */}
            {[
              { t: "DEVELOPMENT APPROACH", v: evaluation.devApproach },
              {
                t: "MONETIZATION STRATEGY",
                v: evaluation.monetizationStrategy,
              },
              { t: "MARKETING APPROACH", v: evaluation.marketingApproach },
              { t: "RISKS & MITIGATIONS", v: evaluation.risks },
              { t: "ADDITIONAL INSIGHTS", v: evaluation.additionalInsights },
            ]
              .filter((sec) => sec.v)
              .map((sec) => (
                <CollapsibleSection
                  key={sec.t}
                  title={sec.t}
                  summary={
                    sec.v.slice(0, 100) + (sec.v.length > 100 ? "…" : "")
                  }
                  content={sec.v}
                />
              ))}

            {/* ── Dependencies ── */}
            <div
              style={{
                borderLeft: "2px solid #1a1a1a",
                paddingLeft: 18,
                marginBottom: 32,
              }}
            >
              <p style={secTitle}>DEPENDENCIES</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {evaluation.dependencies.length > 0 ? (
                  evaluation.dependencies.map((d, i) => <Tag key={i}>{d}</Tag>)
                ) : (
                  <span style={{ color: "#555", fontSize: 12 }}>
                    None specified
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginBottom: 16,
                  background: "#ff444411",
                  border: "1px solid #ff444433",
                  borderRadius: 6,
                  padding: "10px 14px",
                }}
              >
                <p style={{ color: "#ff7777", fontSize: 12 }}>⚠ {error}</p>
              </div>
            )}

            {/* ── Agent 2 CTA ── */}
            {step === "done1" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={runAgent2}
                    style={{
                      ...btnPrimary,
                      padding: "15px 32px",
                      fontSize: 13,
                      boxShadow: "0 0 20px var(--primary)22",
                    }}
                  >
                    RUN AGENT 2 → DESIGN APP SCREEN
                  </button>
                  <button onClick={reset} style={btnGhost}>
                    START OVER
                  </button>
                </div>
                <p style={{ color: "#666", fontSize: 11, letterSpacing: 0.5 }}>
                  Generate a production-ready UI concept · Powered by{" "}
                  <span style={{ color: "#888" }}>Claude Sonnet 4.5</span> ·
                  ~20s
                </p>
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
                    <p style={{ color: "#666", fontSize: 11 }}>
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
                          onClick={() => setUiTab(t.id)}
                          style={{
                            background: uiTab === t.id ? "#1a1a1a" : "none",
                            border: "none",
                            color:
                              uiTab === t.id ? "var(--primary)" : "#3a3a3a",
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
                        color: "#777",
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
                        color: "#666",
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
                        color: "#888",
                        maxHeight: 560,
                        overflowY: "auto",
                        overflowX: "auto",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {htmlOutput}
                    </pre>
                    <p style={{ color: "#666", fontSize: 11, marginTop: 10 }}>
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
                      <p style={{ color: "#555", fontSize: 11 }}>
                        Paste into Google Stitch to generate the full app design
                      </p>
                    </div>
                    <button
                      onClick={copyStitchPrompt}
                      style={{
                        background: stitchCopied ? "var(--primary)15" : "none",
                        border: `1px solid ${stitchCopied ? "var(--primary)44" : "#2a2a2a"}`,
                        color: stitchCopied ? "var(--primary)" : "#777",
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
