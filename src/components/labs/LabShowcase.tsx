"use client";

import { LABS } from "@/components/labs/registry";
import { LAB_IDS, LAB_META } from "@/components/labs/meta";

/**
 * Renders every lab for the playground page. This has to be a client component
 * because `LABS` holds dynamically-imported client components.
 */
export default function LabShowcase() {
  return (
    <div className="mt-10 flex flex-col gap-10">
      {LAB_IDS.map((id) => {
        const Lab = LABS[id];
        const meta = LAB_META[id];
        return (
          <section
            key={id}
            id={id}
            className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/60"
          >
            <div className="border-b border-ink-800 bg-ink-850/50 px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-100">
                <span aria-hidden="true">{meta.glyph}</span>
                {meta.title}
              </h2>
              <p className="mt-1 text-[13px] text-ink-500">{meta.blurb}</p>
            </div>
            <div className="p-5">
              <Lab />
            </div>
          </section>
        );
      })}
    </div>
  );
}
