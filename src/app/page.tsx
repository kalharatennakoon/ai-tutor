import Link from "next/link";
import { courses, totalLessonCount } from "@/content/courses";
import CourseCard from "@/components/CourseCard";
import TutorChat from "@/components/TutorChat";
import { LAB_IDS, LAB_META } from "@/components/labs/meta";

export default function HomePage() {
  return (
    <>
      <div className="mx-auto max-w-6xl px-5">
        {/* Hero */}
        <section className="py-16 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/70 px-3 py-1 text-xs text-ink-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {courses.length} courses · {totalLessonCount} lessons · {LAB_IDS.length} interactive labs
          </span>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-ink-100 sm:text-5xl md:text-6xl">
            Learn how AI actually works —{" "}
            <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              by taking it apart
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-400">
            Not a video course. Every concept comes with something you can drag,
            tune, and break — a tokenizer, a retrieval pipeline, an optimizer
            that diverges when you push the learning rate too far. An AI tutor
            sits alongside every lesson to answer questions in context.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/learn/${courses[0].id}/${courses[0].lessons[0].id}`}
              className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
            >
              Start the first lesson
            </Link>
            <Link
              href="/playground"
              className="rounded-xl border border-ink-700 px-5 py-3 text-sm font-semibold text-ink-200 transition-colors hover:bg-ink-850"
            >
              Jump to the labs
            </Link>
          </div>
        </section>

        {/* Courses */}
        <section className="pb-16">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-500">
            Courses
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>

        {/* Labs */}
        <section className="pb-16">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-500">
              Interactive labs
            </h2>
            <Link
              href="/playground"
              className="text-xs text-indigo-400 transition-colors hover:text-indigo-300"
            >
              Open playground →
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LAB_IDS.map((id) => (
              <Link
                key={id}
                href={`/playground#${id}`}
                className="flex items-start gap-3 rounded-xl border border-ink-800 bg-ink-900/40 p-4 transition-colors hover:border-ink-600 hover:bg-ink-900"
              >
                <span aria-hidden="true" className="text-xl">
                  {LAB_META[id].glyph}
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink-100">
                    {LAB_META[id].title}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-500">
                    {LAB_META[id].blurb}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <TutorChat />
    </>
  );
}
