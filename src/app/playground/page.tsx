import type { Metadata } from "next";
import LabShowcase from "@/components/labs/LabShowcase";
import { LAB_IDS, LAB_META } from "@/components/labs/meta";
import TutorChat from "@/components/TutorChat";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "Every interactive lab in one place — tokenization, embeddings, retrieval, gradient descent, and sampling.",
};

export default function PlaygroundPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-5 py-12">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-100 sm:text-4xl">
            Playground
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-400">
            Every lab from the courses, free of lesson context. Nothing here
            calls an API — the maths runs in your browser, so you can poke at it
            as long as you like.
          </p>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2">
          {LAB_IDS.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs text-ink-300 transition-colors hover:border-indigo-500/50 hover:text-ink-100"
            >
              {LAB_META[id].glyph} {LAB_META[id].title}
            </a>
          ))}
        </nav>

        <LabShowcase />
      </div>

      <TutorChat />
    </>
  );
}
