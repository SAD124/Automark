export type AIReadinessCategoryId =
  | "systems"
  | "people"
  | "data"
  | "strategy";

export type AIReadinessQuestionId =
  | "tech_stack"
  | "automation_usage"
  | "team_readiness"
  | "ai_owner"
  | "data_quality"
  | "reporting_access"
  | "budget_openness"
  | "pain_point";

export type AIReadinessOption = {
  value: string;
  label: string;
  description: string;
  score: number;
};

export type AIReadinessQuestion = {
  id: AIReadinessQuestionId;
  category: AIReadinessCategoryId;
  question: string;
  description: string;
  options: readonly AIReadinessOption[];
};

export type AIReadinessAnswers = Record<AIReadinessQuestionId, string>;

export type AIReadinessCategoryScore = {
  id: AIReadinessCategoryId;
  label: string;
  score: number;
};

export type AIReadinessToolSuggestion = {
  name: string;
  reason: string;
};

export type AIReadinessResult = {
  overallScore: number;
  readinessBand: string;
  summary: string;
  categoryScores: AIReadinessCategoryScore[];
  recommendations: string[];
  toolSuggestions: AIReadinessToolSuggestion[];
};

export const AI_READINESS_CATEGORY_LABELS: Record<
  AIReadinessCategoryId,
  string
> = {
  systems: "Systems",
  people: "People",
  data: "Data",
  strategy: "Strategy",
};

export const AI_READINESS_QUESTIONS: readonly AIReadinessQuestion[] = [
  {
    id: "tech_stack",
    category: "systems",
    question: "How would you describe your current operating stack?",
    description:
      "This tells us how much existing infrastructure is already in place for AI to plug into.",
    options: [
      {
        value: "mostly_manual",
        label: "Mostly manual",
        description: "Email, spreadsheets, and disconnected tools run most of the business.",
        score: 18,
      },
      {
        value: "basic_stack",
        label: "Basic digital stack",
        description: "A CRM or project tool exists, but the workflow is still fragmented.",
        score: 42,
      },
      {
        value: "connected_stack",
        label: "Connected tools",
        description: "Core tools are digital and the team uses them consistently.",
        score: 71,
      },
      {
        value: "integrated_stack",
        label: "Integrated stack",
        description: "CRM, communication, and reporting systems already work together well.",
        score: 92,
      },
    ],
  },
  {
    id: "automation_usage",
    category: "systems",
    question: "How much automation is already part of your workflow?",
    description:
      "Existing automation usually means less friction when introducing AI into operations.",
    options: [
      {
        value: "none",
        label: "None yet",
        description: "Most handoffs and follow-ups are still done manually.",
        score: 14,
      },
      {
        value: "light",
        label: "A few automations",
        description: "You have some templates or reminders, but no end-to-end automation.",
        score: 39,
      },
      {
        value: "workflow_automation",
        label: "Workflow automation",
        description: "Zapier, Make, HubSpot, or similar tools already handle repeatable tasks.",
        score: 72,
      },
      {
        value: "advanced_automation",
        label: "Advanced automation",
        description: "Multi-step automations are already saving the team time every week.",
        score: 90,
      },
    ],
  },
  {
    id: "team_readiness",
    category: "people",
    question: "How digitally confident is the team that would use AI first?",
    description:
      "Readiness improves when the pilot group is comfortable testing new tools and processes.",
    options: [
      {
        value: "hesitant_team",
        label: "Low confidence",
        description: "The team prefers familiar processes and avoids new systems when possible.",
        score: 24,
      },
      {
        value: "mixed_team",
        label: "Mixed confidence",
        description: "A few people are comfortable with tools, but adoption is uneven.",
        score: 48,
      },
      {
        value: "capable_team",
        label: "Capable team",
        description: "Most people can learn new platforms with light guidance.",
        score: 74,
      },
      {
        value: "digital_first_team",
        label: "Digital-first team",
        description: "The team already experiments with software to move faster.",
        score: 91,
      },
    ],
  },
  {
    id: "ai_owner",
    category: "people",
    question: "Who would most likely own AI adoption internally?",
    description:
      "A clear owner usually determines whether an AI initiative stalls or gets implemented.",
    options: [
      {
        value: "no_owner",
        label: "No clear owner",
        description: "It would be everyone’s responsibility, which usually means nobody drives it.",
        score: 16,
      },
      {
        value: "part_time_owner",
        label: "Part-time owner",
        description: "Someone could lead it, but only alongside other priorities.",
        score: 44,
      },
      {
        value: "team_lead_owner",
        label: "Team lead owner",
        description: "A manager or operator can own rollout, feedback, and process changes.",
        score: 73,
      },
      {
        value: "dedicated_owner",
        label: "Dedicated owner",
        description: "There is clear internal accountability for testing and rollout.",
        score: 92,
      },
    ],
  },
  {
    id: "data_quality",
    category: "data",
    question: "How organized is the data AI would need to work with?",
    description:
      "Clean and centralized data shortens implementation time and improves result quality.",
    options: [
      {
        value: "scattered_data",
        label: "Scattered and inconsistent",
        description: "Data lives in inboxes, spreadsheets, chats, and people’s heads.",
        score: 12,
      },
      {
        value: "partial_data",
        label: "Partially organized",
        description: "Some important data is tracked, but it is not reliable or complete.",
        score: 38,
      },
      {
        value: "centralized_data",
        label: "Mostly centralized",
        description: "Customer and operational data is stored in a few trusted systems.",
        score: 74,
      },
      {
        value: "clean_data",
        label: "Clean and structured",
        description: "Your team trusts the data and can access it quickly.",
        score: 95,
      },
    ],
  },
  {
    id: "reporting_access",
    category: "data",
    question: "How easy is it to pull useful insights from your data today?",
    description:
      "Reporting maturity matters because AI works best when the business already measures outcomes.",
    options: [
      {
        value: "manual_reporting",
        label: "Hard and manual",
        description: "Reports are built by hand and often arrive too late to act on.",
        score: 18,
      },
      {
        value: "basic_reporting",
        label: "Basic visibility",
        description: "You can pull reports, but the process is slow or incomplete.",
        score: 43,
      },
      {
        value: "routine_reporting",
        label: "Routine reporting",
        description: "Dashboards or standard reports already inform decisions regularly.",
        score: 73,
      },
      {
        value: "real_time_reporting",
        label: "Near real-time insight",
        description: "Decision-makers can quickly see what is happening and where AI could help.",
        score: 91,
      },
    ],
  },
  {
    id: "budget_openness",
    category: "strategy",
    question: "How open is the business to investing in AI tools or implementation?",
    description:
      "Readiness includes commercial willingness, not just operational potential.",
    options: [
      {
        value: "no_budget",
        label: "No budget right now",
        description: "The business is curious, but there is no near-term budget to move.",
        score: 12,
      },
      {
        value: "testing_budget",
        label: "Small test budget",
        description: "A low-risk pilot budget is possible if the ROI is clear.",
        score: 45,
      },
      {
        value: "growth_budget",
        label: "Growth budget available",
        description: "The business is willing to fund a meaningful pilot if it saves time or revenue.",
        score: 76,
      },
      {
        value: "strategic_budget",
        label: "Strategic priority",
        description: "Leadership is ready to invest because AI is part of the operating plan.",
        score: 93,
      },
    ],
  },
  {
    id: "pain_point",
    category: "strategy",
    question: "Which pain point would you most want AI to solve first?",
    description:
      "A specific, urgent use case usually makes AI adoption much easier to justify and launch.",
    options: [
      {
        value: "lead_follow_up",
        label: "Lead follow-up and CRM admin",
        description: "Leads slip, follow-ups lag, or the pipeline is hard to keep current.",
        score: 84,
      },
      {
        value: "customer_support",
        label: "Customer support volume",
        description: "The team spends too much time answering repeat questions or routing requests.",
        score: 82,
      },
      {
        value: "reporting_data_entry",
        label: "Reporting and data entry",
        description: "Manual updates, reconciliations, and status reporting consume too much time.",
        score: 88,
      },
      {
        value: "content_outreach",
        label: "Content and outbound production",
        description: "Marketing output depends on too much manual writing and repetition.",
        score: 76,
      },
      {
        value: "internal_operations",
        label: "Internal operations and handoffs",
        description: "Knowledge gets lost between teams, tools, or steps in the workflow.",
        score: 79,
      },
      {
        value: "not_sure",
        label: "We are not sure yet",
        description: "There is interest in AI, but no clear first use case has been chosen.",
        score: 34,
      },
    ],
  },
] as const;

const painPointTools: Record<string, AIReadinessToolSuggestion[]> = {
  lead_follow_up: [
    {
      name: "AI lead qualification assistant",
      reason: "Scores incoming leads, drafts replies, and keeps first-touch follow-up from slipping.",
    },
    {
      name: "CRM update copilot",
      reason: "Summarizes calls, updates records, and removes manual pipeline admin.",
    },
    {
      name: "Meeting prep agent",
      reason: "Builds account briefs and next-step prompts before sales conversations.",
    },
  ],
  customer_support: [
    {
      name: "AI support concierge",
      reason: "Handles repetitive customer questions instantly and escalates edge cases to humans.",
    },
    {
      name: "Knowledge base copilot",
      reason: "Turns internal docs and FAQs into fast, searchable answers for the team and customers.",
    },
    {
      name: "Ticket triage assistant",
      reason: "Tags, routes, and prioritizes support requests before the team touches them.",
    },
  ],
  reporting_data_entry: [
    {
      name: "Reporting copilot",
      reason: "Pulls data from core systems and assembles recurring reports automatically.",
    },
    {
      name: "Workflow automation layer",
      reason: "Removes manual copy-paste steps between forms, spreadsheets, and internal systems.",
    },
    {
      name: "Data cleanup assistant",
      reason: "Finds duplicates, fills missing fields, and improves dataset quality over time.",
    },
  ],
  content_outreach: [
    {
      name: "Content repurposing engine",
      reason: "Turns one source asset into campaign-ready emails, posts, and sales collateral.",
    },
    {
      name: "Outbound personalization assistant",
      reason: "Drafts tailored outreach based on account context, offers, and timing.",
    },
    {
      name: "Editorial planning copilot",
      reason: "Keeps content calendars moving with briefs, hooks, and draft structure.",
    },
  ],
  internal_operations: [
    {
      name: "SOP copilot",
      reason: "Guides team members through repeatable processes without searching across tools.",
    },
    {
      name: "Task orchestration assistant",
      reason: "Creates summaries, assignments, and follow-ups across internal handoffs.",
    },
    {
      name: "Internal search assistant",
      reason: "Lets staff retrieve answers from docs, notes, and process history in seconds.",
    },
  ],
  not_sure: [
    {
      name: "AI opportunity mapper",
      reason: "Surfaces which workflows waste the most time so the first AI use case is easier to choose.",
    },
    {
      name: "Team knowledge assistant",
      reason: "A low-risk first step that improves speed before deeper workflow automation.",
    },
    {
      name: "Process audit dashboard",
      reason: "Highlights repetitive work, response delays, and manual bottlenecks worth automating.",
    },
  ],
};

const weakestCategoryTools: Record<
  AIReadinessCategoryId,
  AIReadinessToolSuggestion
> = {
  systems: {
    name: "Workflow integration layer",
    reason: "Connects your core tools first so future AI automations have a reliable foundation.",
  },
  people: {
    name: "Internal AI enablement workspace",
    reason: "Gives the rollout owner a safer way to train the team and collect feedback quickly.",
  },
  data: {
    name: "Data readiness monitor",
    reason: "Flags missing fields and fragmented records before they weaken AI outputs.",
  },
  strategy: {
    name: "AI pilot ROI tracker",
    reason: "Keeps investment decisions tied to time saved, revenue impact, and rollout milestones.",
  },
};

export function getEmptyAIReadinessAnswers(): AIReadinessAnswers {
  return AI_READINESS_QUESTIONS.reduce((accumulator, question) => {
    accumulator[question.id] = "";
    return accumulator;
  }, {} as AIReadinessAnswers);
}

export function normalizeAIReadinessAnswers(
  value: unknown,
): AIReadinessAnswers | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const normalized = getEmptyAIReadinessAnswers();

  for (const question of AI_READINESS_QUESTIONS) {
    const answer = candidate[question.id];

    if (typeof answer !== "string") {
      return null;
    }

    const isValidOption = question.options.some((option) => option.value === answer);

    if (!isValidOption) {
      return null;
    }

    normalized[question.id] = answer;
  }

  return normalized;
}

export function buildAIReadinessAnswerSummary(
  answers: AIReadinessAnswers,
): string {
  return AI_READINESS_QUESTIONS.map((question) => {
    const option = question.options.find(
      (entry) => entry.value === answers[question.id],
    );

    return [
      `Question: ${question.question}`,
      `Selected option: ${option?.label ?? "Unknown"}`,
      `Context: ${option?.description ?? "Unknown"}`,
    ].join("\n");
  }).join("\n\n");
}

export function buildFallbackAIReadinessResult(
  answers: AIReadinessAnswers,
): AIReadinessResult {
  const categoryScores = (
    Object.keys(AI_READINESS_CATEGORY_LABELS) as AIReadinessCategoryId[]
  ).map((categoryId) => {
    const categoryQuestions = AI_READINESS_QUESTIONS.filter(
      (question) => question.category === categoryId,
    );
    const total = categoryQuestions.reduce((sum, question) => {
      const option = question.options.find(
        (entry) => entry.value === answers[question.id],
      );

      return sum + (option?.score ?? 0);
    }, 0);

    return {
      id: categoryId,
      label: AI_READINESS_CATEGORY_LABELS[categoryId],
      score: clampScore(Math.round(total / categoryQuestions.length)),
    };
  });

  const overallScore = clampScore(
    Math.round(
      categoryScores.reduce((sum, category) => sum + category.score, 0) /
        categoryScores.length,
    ),
  );

  const readinessBand = getReadinessBand(overallScore);
  const weakestCategory = [...categoryScores].sort((left, right) => left.score - right.score)[0];
  const strongestCategory = [...categoryScores].sort((left, right) => right.score - left.score)[0];
  const painPoint = answers.pain_point;

  const recommendations = buildRecommendations(
    categoryScores,
    painPoint,
    overallScore,
  );

  const toolSuggestions = buildToolSuggestions(categoryScores, painPoint);

  const summary = buildSummary(
    overallScore,
    readinessBand,
    weakestCategory.label,
    strongestCategory.label,
  );

  return {
    overallScore,
    readinessBand,
    summary,
    categoryScores,
    recommendations,
    toolSuggestions,
  };
}

function buildRecommendations(
  categoryScores: AIReadinessCategoryScore[],
  painPoint: string,
  overallScore: number,
) {
  const recommendations: string[] = [];
  const scoreMap = Object.fromEntries(
    categoryScores.map((category) => [category.id, category.score]),
  ) as Record<AIReadinessCategoryId, number>;

  if (scoreMap.systems < 55) {
    recommendations.push(
      "Standardize the core operating stack first so AI can plug into a stable workflow instead of scattered tools.",
    );
  }

  if (scoreMap.people < 55) {
    recommendations.push(
      "Assign one internal owner and run a single pilot workflow before asking the wider team to change behavior.",
    );
  }

  if (scoreMap.data < 55) {
    recommendations.push(
      "Clean up the most important customer and operational data before relying on AI to generate actions or insights.",
    );
  }

  if (scoreMap.strategy < 55) {
    recommendations.push(
      "Define a 60-day AI budget, one business metric, and one narrow use case so the pilot has a clear success condition.",
    );
  }

  if (recommendations.length < 3) {
    const painPointRecommendation =
      painPoint === "lead_follow_up"
        ? "Start with lead response and CRM hygiene, because that is one of the fastest AI pilots to measure."
        : painPoint === "customer_support"
          ? "Begin with repetitive support questions where AI can cut response time without changing the whole business."
          : painPoint === "reporting_data_entry"
            ? "Target reporting and data-entry work first, since these tasks create clear time savings and quick ROI."
            : painPoint === "content_outreach"
              ? "Use AI to speed up content and outbound production, but keep human review on messaging and brand quality."
              : painPoint === "internal_operations"
                ? "Focus on internal handoffs and documentation so the team feels operational relief early."
                : "Choose one measurable workflow before expanding the AI roadmap beyond the pilot phase.";

    recommendations.push(painPointRecommendation);
  }

  if (recommendations.length < 3) {
    recommendations.push(
      overallScore >= 70
        ? "You are ready for a production-minded pilot, so prioritize integration, governance, and clear rollout milestones."
        : "Treat the first implementation as an operational experiment and prove value with one workflow before scaling.",
    );
  }

  return recommendations.slice(0, 3);
}

function buildToolSuggestions(
  categoryScores: AIReadinessCategoryScore[],
  painPoint: string,
) {
  const suggestions = [...(painPointTools[painPoint] ?? painPointTools.not_sure)];
  const weakestCategory = [...categoryScores].sort((left, right) => left.score - right.score)[0];
  const supportingSuggestion = weakestCategoryTools[weakestCategory.id];

  if (!suggestions.some((item) => item.name === supportingSuggestion.name)) {
    suggestions.push(supportingSuggestion);
  }

  return suggestions.slice(0, 3);
}

function buildSummary(
  overallScore: number,
  readinessBand: string,
  weakestCategory: string,
  strongestCategory: string,
) {
  if (overallScore >= 75) {
    return `Your business looks ${readinessBand.toLowerCase()}, with ${strongestCategory.toLowerCase()} already supporting a meaningful AI pilot and ${weakestCategory.toLowerCase()} as the main execution gap to tighten.`;
  }

  if (overallScore >= 50) {
    return `You have enough foundation to begin, but ${weakestCategory.toLowerCase()} needs attention before AI adoption becomes repeatable and scalable.`;
  }

  return `There is clear interest in AI, but ${weakestCategory.toLowerCase()} is still limiting execution and should be stabilized before a bigger rollout.`;
}

function getReadinessBand(overallScore: number) {
  if (overallScore >= 75) {
    return "AI-ready operator";
  }

  if (overallScore >= 50) {
    return "Emerging adopter";
  }

  return "Foundation building";
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}
