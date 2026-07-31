"use client";

import Link from "next/link";
import type { Course } from "@/content/types";
import { useProgress } from "@/lib/progress";

export default function LessonList({ course }: { course: Course }) {
  const { isComplete, completedInCourse } = useProgress();
  const done = completedInCourse(
    course.id,
    course.lessons.map((l) => l.id),
  );
  const percent = Math.round((done / course.lessons.length) * 100);

  // Resume at the first incomplete lesson, or the first lesson if none are done.
  const nextLesson =
    course.lessons.find((l) => !isComplete(course.id, l.id)) ?? course.lessons[0];

  return (
    <section className="mt-10">
      <div className="mb-5 rounded-2xl border border-ink-700 bg-ink-900/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink-100">
              {done === 0
                ? "Not started"
                : done === course.lessons.length
                  ? "Course complete"
                  : `${done} of ${course.lessons.length} lessons done`}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              Progress is saved in this browser.
            </p>
          </div>
          <Link
            href={`/learn/${course.id}/${nextLesson.id}`}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
          >
            {done === 0
              ? "Start course"
              : done === course.lessons.length
                ? "Review"
                : "Continue"}
          </Link>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-800">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${course.gradient} transition-[width] duration-500`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ol className="flex flex-col gap-2">
        {course.lessons.map((lesson, i) => {
          const complete = isComplete(course.id, lesson.id);
          return (
            <li key={lesson.id}>
              <Link
                href={`/learn/${course.id}/${lesson.id}`}
                className="group flex items-center gap-4 rounded-xl border border-ink-800 bg-ink-900/40 px-4 py-3.5 transition-colors hover:border-ink-600 hover:bg-ink-900"
              >
                <span
                  aria-hidden="true"
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-xs font-semibold transition-colors ${
                    complete
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                      : "border-ink-700 bg-ink-850 text-ink-500 group-hover:text-ink-300"
                  }`}
                >
                  {complete ? "✓" : i + 1}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-ink-100">
                    {lesson.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-ink-500">
                    {lesson.summary}
                  </span>
                </span>

                <span className="shrink-0 font-mono text-[11px] text-ink-600">
                  {lesson.minutes}m
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
