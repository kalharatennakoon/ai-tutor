"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { LabId } from "@/content/types";

/**
 * Labs are code-split and client-only: each is interactive, none render
 * meaningfully on the server, and a lesson typically uses at most one. The
 * `Record<LabId, …>` type means adding a `LabId` without a component here is a
 * compile error rather than a runtime blank.
 *
 * Import this only from other client components — see `meta.ts` for the
 * server-safe metadata.
 */

const Loading = () => (
  <div className="grid h-48 place-items-center rounded-xl border border-ink-800 bg-ink-950">
    <span className="text-sm text-ink-600">Loading lab…</span>
  </div>
);

// `next/dynamic` options must be inline object literals — the compiler reads
// them statically, so a shared `options` constant fails the build.
export const LABS: Record<LabId, ComponentType> = {
  tokenizer: dynamic(() => import("./TokenizerLab"), { ssr: false, loading: Loading }),
  embeddings: dynamic(() => import("./EmbeddingLab"), { ssr: false, loading: Loading }),
  "rag-pipeline": dynamic(() => import("./RagPipelineLab"), { ssr: false, loading: Loading }),
  "gradient-descent": dynamic(() => import("./GradientDescentLab"), { ssr: false, loading: Loading }),
  temperature: dynamic(() => import("./TemperatureLab"), { ssr: false, loading: Loading }),
};
