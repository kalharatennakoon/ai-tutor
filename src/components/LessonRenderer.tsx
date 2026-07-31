"use client";

import type { Block } from "@/content/types";
import Markdown from "@/components/Markdown";
import Quiz from "@/components/Quiz";
import CodeBlock from "@/components/CodeBlock";
import { LABS } from "@/components/labs/registry";

const CALLOUT_STYLES = {
  info: {
    wrap: "border-sky-500/30 bg-sky-500/[0.07]",
    label: "text-sky-300",
    glyph: "ℹ",
  },
  warn: {
    wrap: "border-amber-500/30 bg-amber-500/[0.07]",
    label: "text-amber-300",
    glyph: "⚠",
  },
  key: {
    wrap: "border-violet-500/30 bg-violet-500/[0.07]",
    label: "text-violet-300",
    glyph: "★",
  },
} as const;

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "text":
      return <Markdown body={block.body} />;

    case "heading":
      return (
        <h2 className="mt-10 mb-3 text-xl font-semibold tracking-tight text-ink-100">
          {block.text}
        </h2>
      );

    case "callout": {
      const style = CALLOUT_STYLES[block.tone];
      return (
        <aside className={`my-6 rounded-2xl border p-4 ${style.wrap}`}>
          <div className={`flex items-center gap-2 text-sm font-semibold ${style.label}`}>
            <span aria-hidden="true">{style.glyph}</span>
            <span>{block.title}</span>
          </div>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-300">
            {block.body}
          </p>
        </aside>
      );
    }

    case "code":
      return <CodeBlock lang={block.lang} caption={block.caption} code={block.body} />;

    case "quiz":
      return <Quiz question={block.question} options={block.options} />;

    case "lab": {
      const Lab = LABS[block.lab];
      return (
        <section className="my-8 overflow-hidden rounded-2xl border border-indigo-500/25 bg-ink-900/70">
          <div className="flex items-center gap-2 border-b border-ink-800 bg-indigo-500/[0.07] px-5 py-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-300">
              Interactive lab
            </span>
            <span className="text-sm font-medium text-ink-200">{block.title}</span>
          </div>
          <div className="p-5">
            {block.body && (
              <p className="mb-5 text-[14px] leading-relaxed text-ink-400">
                {block.body}
              </p>
            )}
            <Lab />
          </div>
        </section>
      );
    }
  }
}

export default function LessonRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div>
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}
