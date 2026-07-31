"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Lesson } from "@/content/types";
import { useProgress } from "@/lib/progress";

export default function LessonFooter({
  courseId,
  lessonId,
  prev,
  next,
}: {
  courseId: string;
  lessonId: string;
  prev?: Lesson;
  next?: Lesson;
}) {
  const router = useRouter();
  const { isComplete, setComplete } = useProgress();
  const complete = isComplete(courseId, lessonId);

  const finish = () => {
    setComplete(courseId, lessonId, true);
    // Marking complete is almost always followed by moving on, so do it for them.
    router.push(next ? `/learn/${courseId}/${next.id}` : `/learn/${courseId}`);
  };

  return (
    <footer className="mt-12 border-t border-ink-800 pt-8">
      <div className="rounded-2xl border border-ink-700 bg-ink-900/50 p-5">
        {complete ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
              <span aria-hidden="true">✓</span> Marked complete
            </p>
            <button
              type="button"
              onClick={() => setComplete(courseId, lessonId, false)}
              className="rounded-lg border border-ink-700 px-3 py-1.5 text-xs text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-200"
            >
              Undo
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-400">
              Finished this lesson? Mark it done to track your progress.
            </p>
            <button
              type="button"
              onClick={finish}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
            >
              {next ? "Complete & continue" : "Complete lesson"}
            </button>
          </div>
        )}
      </div>

      <nav className="mt-4 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/learn/${courseId}/${prev.id}`}
            className="rounded-xl border border-ink-800 bg-ink-900/40 p-4 transition-colors hover:border-ink-600 hover:bg-ink-900"
          >
            <span className="block text-[11px] uppercase tracking-wider text-ink-600">
              ← Previous
            </span>
            <span className="mt-1 block text-sm font-medium text-ink-200">
              {prev.title}
            </span>
          </Link>
        ) : (
          <span />
        )}

        {next && (
          <Link
            href={`/learn/${courseId}/${next.id}`}
            className="rounded-xl border border-ink-800 bg-ink-900/40 p-4 text-right transition-colors hover:border-ink-600 hover:bg-ink-900 sm:col-start-2"
          >
            <span className="block text-[11px] uppercase tracking-wider text-ink-600">
              Next →
            </span>
            <span className="mt-1 block text-sm font-medium text-ink-200">
              {next.title}
            </span>
          </Link>
        )}
      </nav>
    </footer>
  );
}
