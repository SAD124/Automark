"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import {
  AI_READINESS_CATEGORY_LABELS,
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

  const totalQuestions = AI_READINESS_QUESTIONS.length;
  const currentQuestion = AI_READINESS_QUESTIONS[step];
  const currentAnswer = answers[currentQuestion.id];
  const progress = Math.round(((step + 1) / totalQuestions) * 100);

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
      setError("Select one option to continue.");
      return;
    }

    setStep((current) => Math.min(totalQuestions - 1, current + 1));
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentAnswer) {
      setError("Select one option to generate your score.");
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
        throw new Error(data.error || "Unable to generate the score.");
      }

      setResult(data.result);
    } catch (submissionError) {
      setResult(buildFallbackAIReadinessResult(answers));
      setError(
        submissionError instanceof Error
          ? `${submissionError.message} Showing the fallback score.`
          : "Unable to reach the scoring service. Showing the fallback score.",
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
      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
        <section className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(25,25,27,0.96),rgba(13,13,15,1))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:p-7">
          <div className="flex flex-col gap-5 sm:gap-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 sm:gap-5">
                <ScoreDial score={result.overallScore} />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">
                    Overall score
                  </p>
                  <h2 className="mt-2 font-heading text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">
                    {result.overallScore}
                  </h2>
                  <p className="mt-1 text-sm uppercase tracking-[0.16em] text-on-surface-variant">
                    {result.readinessBand}
                  </p>
                </div>
              </div>

              <ButtonLink
                href={bookingHref}
                target={bookingExternal ? "_blank" : undefined}
                rel={bookingExternal ? "noreferrer" : undefined}
                className="w-full sm:w-auto"
              >
                Book a Free AI Audit
              </ButtonLink>
            </div>

            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
              {result.summary}
            </p>

            {error ? (
              <div className="rounded-[1rem] border border-[#ff9e8d33] bg-[#ff9e8d12] px-4 py-3 text-sm text-[#ffd0c7]">
                {error}
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {result.categoryScores.map((category) => (
            <CategoryScoreCard key={category.id} category={category} />
          ))}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(24,24,26,0.96),rgba(12,12,14,1))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.3)] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-2xl font-bold tracking-[-0.05em] text-white">
                Next steps
              </h3>
              <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                3 actions
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {result.recommendations.map((recommendation, index) => (
                <div
                  key={`${recommendation}-${index}`}
                  className="flex items-start gap-3 rounded-[1.15rem] border border-white/7 bg-white/[0.03] px-4 py-4"
                >
                  <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-primary/12 text-[11px] font-semibold text-primary">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-7 text-on-surface-variant">
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(24,24,26,0.96),rgba(12,12,14,1))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.3)] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-2xl font-bold tracking-[-0.05em] text-white">
                Suggested tools
              </h3>
              <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                3 ideas
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {result.toolSuggestions.map((suggestion) => (
                <div
                  key={suggestion.name}
                  className="rounded-[1.15rem] border border-white/7 bg-white/[0.03] px-4 py-4"
                >
                  <p className="font-semibold tracking-[-0.03em] text-white">
                    {suggestion.name}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-on-surface-variant">
                    {suggestion.reason}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={resetAssessment}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold tracking-[-0.03em] text-on-background hover:border-primary/30 hover:text-primary sm:min-h-12 sm:px-6"
          >
            Retake
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-4xl rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(25,25,27,0.96),rgba(13,13,15,1))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.34)] sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">
            Question {step + 1} of {totalQuestions}
          </p>
          <p className="mt-2 text-sm uppercase tracking-[0.18em] text-on-surface-variant">
            {AI_READINESS_CATEGORY_LABELS[currentQuestion.category]}
          </p>
        </div>
        <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant sm:px-4 sm:text-[11px]">
          {progress}%
        </div>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/7">
        <div
          className="h-full rounded-full bg-linear-to-r from-primary to-primary-container"
          style={{ width: `${progress}%` }}
        />
      </div>

      <fieldset className="mt-7">
        <legend className="font-heading text-[2rem] font-bold leading-[1.02] tracking-[-0.06em] text-white sm:text-[2.6rem]">
          {currentQuestion.question}
        </legend>
        <p className="mt-3 hidden max-w-2xl text-sm leading-7 text-on-surface-variant sm:block">
          {currentQuestion.description}
        </p>

        <div className="mt-6 grid gap-3 sm:gap-4">
          {currentQuestion.options.map((option) => {
            const isSelected = currentAnswer === option.value;

            return (
              <label
                key={option.value}
                className={cn(
                  "block cursor-pointer rounded-[1.35rem] border px-4 py-4 transition-all sm:px-5 sm:py-5",
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

                <div className="flex items-start gap-3 sm:gap-4">
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
                    <p className="text-base font-semibold tracking-[-0.03em] text-white sm:text-lg">
                      {option.label}
                    </p>
                    <p className="mt-1 hidden text-sm leading-7 text-on-surface-variant sm:block">
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
        <div className="mt-5 rounded-[1rem] border border-[#ff9e8d33] bg-[#ff9e8d12] px-4 py-3 text-sm text-[#ffd0c7]">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0 || isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold tracking-[-0.03em] text-on-background disabled:cursor-not-allowed disabled:opacity-40 hover:border-primary/25 hover:text-primary sm:min-h-12 sm:px-6"
        >
          Back
        </button>

        {step < totalQuestions - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-linear-to-r from-primary to-primary-container px-5 py-2.5 text-sm font-semibold tracking-[-0.03em] text-on-primary shadow-[0_0_30px_rgba(79,219,200,0.18)] hover:shadow-[0_0_38px_rgba(79,219,200,0.24)] sm:min-h-12 sm:w-auto sm:px-6"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-linear-to-r from-primary to-primary-container px-5 py-2.5 text-sm font-semibold tracking-[-0.03em] text-on-primary shadow-[0_0_30px_rgba(79,219,200,0.18)] disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-12 sm:w-auto sm:px-6"
          >
            {isSubmitting ? "Scoring..." : "Get score"}
          </button>
        )}
      </div>
    </form>
  );
}

function ScoreDial({ score }: { score: number }) {
  return (
    <div
      className="relative flex h-24 w-24 flex-none items-center justify-center rounded-full sm:h-28 sm:w-28"
      style={{
        background: `conic-gradient(#4fdbc8 0 ${score}%, rgba(255,255,255,0.08) ${score}% 100%)`,
      }}
    >
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#101012] text-2xl font-bold tracking-[-0.05em] text-white sm:h-[84px] sm:w-[84px] sm:text-3xl">
        {score}
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
    <div className="rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(24,24,26,0.96),rgba(12,12,14,1))] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.26)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
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
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/7">
        <div
          className="h-full rounded-full bg-linear-to-r from-primary to-primary-container"
          style={{ width: `${category.score}%` }}
        />
      </div>
    </div>
  );
}
