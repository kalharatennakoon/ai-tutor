"use client";

import { useState } from "react";
import type { QuizOption } from "@/content/types";
import Markdown from "@/components/Markdown";
import { cx } from "@/lib/utils";

export default function Quiz({
  question,
  options,
}: {
  question: string;
  options: QuizOption[];
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = answered && options[picked].correct;

  return (
    <section className="my-8 overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/70">
      <div className="border-b border-ink-800 bg-ink-850/60 px-5 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-400">
          Check yourself
        </span>
      </div>

      <div className="p-5">
        <p className="text-[15px] font-medium leading-relaxed text-ink-100">
          {question}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {options.map((option, i) => {
            const isPicked = picked === i;
            // Reveal the right answer once any choice is made.
            const reveal = answered && (isPicked || option.correct);

            return (
              <button
                key={i}
                type="button"
                onClick={() => !answered && setPicked(i)}
                disabled={answered}
                aria-pressed={isPicked}
                className={cx(
                  "rounded-xl border px-4 py-3 text-left text-sm transition-all",
                  !answered &&
                    "border-ink-700 bg-ink-850/50 text-ink-300 hover:border-indigo-500/60 hover:bg-ink-800 hover:text-ink-100",
                  answered && !reveal && "border-ink-800 bg-ink-900 text-ink-500",
                  reveal &&
                    option.correct &&
                    "border-emerald-500/50 bg-emerald-500/10 text-emerald-100",
                  reveal &&
                    !option.correct &&
                    "border-rose-500/50 bg-rose-500/10 text-rose-100",
                )}
              >
                <span className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={cx(
                      "mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold",
                      !answered && "border-ink-600 text-ink-500",
                      reveal && option.correct && "border-emerald-400 text-emerald-300",
                      reveal && !option.correct && "border-rose-400 text-rose-300",
                      answered && !reveal && "border-ink-700 text-ink-600",
                    )}
                  >
                    {reveal ? (option.correct ? "✓" : "✕") : String.fromCharCode(65 + i)}
                  </span>
                  <span>{option.text}</span>
                </span>

                {reveal && (
                  <span className="mt-2.5 block border-t border-white/10 pt-2.5 text-[13px] leading-relaxed text-ink-300">
                    {option.explanation}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-4 flex items-center justify-between gap-4">
            <p
              className={cx(
                "text-sm font-medium",
                correct ? "text-emerald-300" : "text-amber-300",
              )}
              role="status"
            >
              {correct
                ? "Correct — that's the reasoning to carry forward."
                : "Not quite. Read the explanations above, then try again."}
            </p>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="shrink-0 rounded-lg border border-ink-700 px-3 py-1.5 text-xs font-medium text-ink-300 transition-colors hover:bg-ink-800 hover:text-ink-100"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/** Small helper so lesson blocks can render an optional intro above a quiz. */
export function QuizIntro({ body }: { body: string }) {
  return <Markdown body={body} />;
}
