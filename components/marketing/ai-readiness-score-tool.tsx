"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import {
  AI_READINESS_QUESTIONS,
  buildFallbackAIReadinessResult,
  getEmptyAIReadinessAnswers,
  type AIReadinessAnswers,
  type AIReadinessCategoryScore,
  type AIReadinessResult,
} from "@/lib/ai-readiness";
import { cn } from "@/lib/utils";

type AIReadinessScoreToolProps = {
  bookingHref: string;
  bookingExternal?: boolean;
};

type AIReadinessResponse = {
  result?: AIReadinessResult;
  error?: string;
};

const scoreToneClasses = {
  high: "text-primary",
  medium: "text-[#f5cf78]",
  low: "text-[#ff9e8d]",
};

export function AIReadinessScoreTool({
  bookingHref,
  bookingExternal = false,
}: AIReadinessScoreToolProps) {
  const [answers, setAnswers] = useState<AIReadinessAnswers>(
    getEmptyAIReadinessAnswers(),
  );
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AIReadinessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = AI_READINESS_QUESTIONS[step];
  const currentAnswer = answers[currentQuestion.id];
  const progress = Math.round(((step + 1) / AI_READINESS_QUESTIONS.length) * 100);
  const answeredCount = AI_READINESS_QUESTIONS.filter(
    (question) => answers[question.id],
  ).length;

  function updateAnswer(value: string) {
    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: value,
    }));
    setError(null);
  }

  function goBack() {
    setStep((current) => Math.max(0, current - 1));
  }

  function goNext() {
    if (!currentAnswer) {
      setError("Choose one option before moving on.");
      return;
    }

    setStep((current) =>
      Math.min(AI_READINESS_QUESTIONS.length - 1, current + 1),
    );
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentAnswer) {
      setError("Choose one option before generating the score.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-readiness-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });

      const data = (await response.json()) as AIReadinessResponse;

      if (!response.ok || !data.result) {
        throw new Error(data.error || "Unable to generate the AI readiness score.");
      }

      setResult(data.result);
    } catch (submissionError) {
      const fallback = buildFallbackAIReadinessResult(answers);
      setResult(fallback);
      setError(
        submissionError instanceof Error
          ? `${submissionError.message} Showing the rule-based score so the flow stays usable.`
          : "Unable to reach the scoring service. Showing the rule-based score instead.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetAssessment() {
    setAnswers(getEmptyAIReadinessAnswers());
    setStep(0);
    setResult(null);
    setError(null);
    setIsSubmitting(false);
  }

  if (result) {
    return (
      <div className="grid gap-8 xl:grid-cols-[0.62fr_1.38fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(25,25,27,0.96),rgba(13,13,15,1))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.36)] sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/85">
              Assessment result
            </p>
            <div className="mt-6 flex items-center gap-6">
              <ScoreDial score={result.overallScore} />
              <div className="space-y-3">
                <p className="font-heading text-2xl font-bold tracking-[-0.05em] text-white sm:text-3xl">
                  {result.readinessBand}
                </p>
                <p className="max-w-sm text-sm leading-7 text-on-surface-variant sm:text-base">
                  {result.summary}
                </p>
              </div>
            </div>
            {error ? (
              <div className="mt-6 rounded-[1.2rem] border border-[#ff9e8d33] bg-[#ff9e8d12] px-4 py-3 text-sm leading-6 text-[#ffd0c7]">
                {error}
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(24,24,26,0.96),rgba(12,12,14,1))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/75">
              Next move
            </p>
            <h3 className="mt-4 font-heading text-2xl font-bold tracking-[-0.05em] text-white">
              Book a Free AI Audit
            </h3>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">
              Use this score as a starting point, then map the first AI pilot around your highest-value bottleneck.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                href={bookingHref}
                target={bookingExternal ? "_blank" : undefined}
                rel={bookingExternal ? "noreferrer" : undefined}
                className="w-full sm:w-auto"
              >
                Book a Free AI Audit
              </ButtonLink>
              <button
                type="button"
                onClick={resetAssessment}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold tracking-[-0.03em] text-on-background hover:border-primary/35 hover:text-primary sm:min-h-12 sm:px-6"
              >
                Retake assessment
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(25,25,27,0.96),rgba(13,13,15,1))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/75">
                  Category breakdown
                </p>
                <h3 className="mt-3 font-heading text-2xl font-bold tracking-[-0.05em] text-white">
                  Where your readiness is strongest
                </h3>
              </div>
              <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                {result.categoryScores.length} scored areas
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {result.categoryScores.map((category) => (
                <CategoryScoreCard key={category.id} category={category} />
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(24,24,26,0.96),rgba(12,12,14,1))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/75">
                Recommendations
              </p>
              <div className="mt-5 space-y-3">
                {result.recommendations.map((recommendation, index) => (
                  <div
                    key={`${recommendation}-${index}`}
                    className="rounded-[1.25rem] border border-white/7 bg-white/[0.03] px-4 py-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-primary/12 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-7 text-on-surface-variant">
                        {recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(24,24,26,0.96),rgba(12,12,14,1))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/75">
                Suggested AI tools
              </p>
              <div className="mt-5 space-y-3">
                {result.toolSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.name}
                    className="rounded-[1.25rem] border border-white/7 bg-white/[0.03] px-4 py-4"
                  >
                    <p className="font-heading text-xl font-bold tracking-[-0.04em] text-white">
                      {suggestion.name}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                      {suggestion.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[0.62fr_1.38fr]">
      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(25,25,27,0.96),rgba(13,13,15,1))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/85">
            2 minute assessment
          </p>
          <h3 className="mt-4 font-heading text-3xl font-bold tracking-[-0.05em] text-white">
            Answer 8 questions and get a practical AI starting point.
          </h3>
          <p className="mt-4 text-sm leading-7 text-on-surface-variant sm:text-base">
            The score looks at your systems, team readiness, data quality, and
            budget intent so the next step is grounded in how the business
            actually operates.
          </p>
          <div className="mt-6 grid gap-3">
            {[
              `${AI_READINESS_QUESTIONS.length} multiple-choice questions`,
              "0-100 overall score plus category breakdown",
              "Tailored recommendations and AI tool ideas",
            ].map((item) => (
              <div
                key={item}
                className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-on-surface-variant"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(24,24,26,0.96),rgba(12,12,14,1))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/75">
              Progress
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
              {answeredCount}/{AI_READINESS_QUESTIONS.length} answered
            </p>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/7">
            <div
              className="h-full rounded-full bg-linear-to-r from-primary to-primary-container"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-6 space-y-3">
            {AI_READINESS_QUESTIONS.map((question, index) => {
              const isCurrent = index === step;
              const isAnswered = Boolean(answers[question.id]);

              return (
                <div
                  key={question.id}
                  className={cn(
                    "rounded-[1.2rem] border px-4 py-3 text-sm transition-colors",
                    isCurrent
                      ? "border-primary/35 bg-primary/10"
                      : "border-white/6 bg-white/[0.02]",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border text-[11px] font-semibold uppercase tracking-[0.14em]",
                        isAnswered
                          ? "border-primary/35 bg-primary/12 text-primary"
                          : "border-white/10 text-on-surface-variant",
                      )}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-white">{question.question}</p>
                      <p className="mt-1 text-xs leading-6 text-on-surface-variant">
                        {question.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(25,25,27,0.96),rgba(13,13,15,1))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.34)] sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/75">
              Question {step + 1}
            </p>
            <p className="mt-2 text-sm uppercase tracking-[0.18em] text-on-surface-variant">
              {currentQuestion.category}
            </p>
          </div>
          <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
            {progress}% complete
          </div>
        </div>

        <fieldset className="mt-8">
          <legend className="font-heading text-3xl font-bold tracking-[-0.05em] text-white sm:text-4xl">
            {currentQuestion.question}
          </legend>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-on-surface-variant sm:text-base">
            {currentQuestion.description}
          </p>

          <div className="mt-8 grid gap-4">
            {currentQuestion.options.map((option) => {
              const isSelected = currentAnswer === option.value;

              return (
                <label
                  key={option.value}
                  className={cn(
                    "group block cursor-pointer rounded-[1.45rem] border px-5 py-5 transition-all",
                    isSelected
                      ? "border-primary/40 bg-primary/10 shadow-[0_0_0_1px_rgba(79,219,200,0.05)]"
                      : "border-white/7 bg-white/[0.02] hover:border-primary/20 hover:bg-white/[0.035]",
                  )}
                >
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option.value}
                    checked={isSelected}
                    onChange={() => updateAnswer(option.value)}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-4">
                    <span
                      className={cn(
                        "mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border",
                        isSelected ? "border-primary bg-primary" : "border-white/20",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full bg-[#072924]",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </span>
                    <div>
                      <p className="text-lg font-semibold tracking-[-0.03em] text-white">
                        {option.label}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>

        {error ? (
          <div className="mt-6 rounded-[1.2rem] border border-[#ff9e8d33] bg-[#ff9e8d12] px-4 py-3 text-sm leading-6 text-[#ffd0c7]">
            {error}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0 || isSubmitting}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold tracking-[-0.03em] text-on-background disabled:cursor-not-allowed disabled:opacity-40 hover:border-primary/25 hover:text-primary sm:min-h-12 sm:px-6"
          >
            Back
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            {step < AI_READINESS_QUESTIONS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-linear-to-r from-primary to-primary-container px-5 py-2.5 text-sm font-semibold tracking-[-0.03em] text-on-primary shadow-[0_0_30px_rgba(79,219,200,0.18)] hover:shadow-[0_0_38px_rgba(79,219,200,0.24)] sm:min-h-12 sm:px-6"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-linear-to-r from-primary to-primary-container px-5 py-2.5 text-sm font-semibold tracking-[-0.03em] text-on-primary shadow-[0_0_30px_rgba(79,219,200,0.18)] disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-12 sm:px-6"
              >
                {isSubmitting ? "Scoring your business..." : "Get my AI readiness score"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function ScoreDial({ score }: { score: number }) {
  return (
    <div
      className="relative flex h-32 w-32 flex-none items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#4fdbc8 0 ${score}%, rgba(255,255,255,0.08) ${score}% 100%)`,
      }}
    >
      <div className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full bg-[#101012]">
        <span className="font-heading text-4xl font-bold tracking-[-0.05em] text-white">
          {score}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
          out of 100
        </span>
      </div>
    </div>
  );
}

function CategoryScoreCard({
  category,
}: {
  category: AIReadinessCategoryScore;
}) {
  const tone =
    category.score >= 70 ? "high" : category.score >= 50 ? "medium" : "low";

  return (
    <div className="rounded-[1.5rem] border border-white/7 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
          {category.label}
        </p>
        <p
          className={cn(
            "font-heading text-2xl font-bold tracking-[-0.05em]",
            scoreToneClasses[tone],
          )}
        >
          {category.score}
        </p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/7">
        <div
          className="h-full rounded-full bg-linear-to-r from-primary to-primary-container"
          style={{ width: `${category.score}%` }}
        />
      </div>
    </div>
  );
}
