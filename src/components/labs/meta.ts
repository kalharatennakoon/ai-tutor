import type { LabId } from "@/content/types";

/**
 * Plain data, deliberately kept out of `registry.tsx`. That file is a client
 * module, and a Server Component importing a value from a client module gets a
 * client *reference*, not the value — so `LAB_IDS.map` there would be undefined
 * at render time.
 */
export const LAB_META: Record<
  LabId,
  { title: string; blurb: string; glyph: string }
> = {
  tokenizer: {
    title: "Tokenizer",
    blurb: "See text split into the subword units a model actually reads.",
    glyph: "🔤",
  },
  embeddings: {
    title: "Vector similarity",
    blurb: "Drag a query through a 2D embedding space and watch ranking change.",
    glyph: "📐",
  },
  "rag-pipeline": {
    title: "RAG pipeline",
    blurb: "Run queries through hybrid retrieval and inspect the assembled prompt.",
    glyph: "🔍",
  },
  "gradient-descent": {
    title: "Gradient descent",
    blurb: "Fit a line, tune the learning rate, and make training diverge.",
    glyph: "📉",
  },
  temperature: {
    title: "Temperature & top-p",
    blurb: "Reshape a probability distribution with the sampling knobs.",
    glyph: "🌡️",
  },
};

export const LAB_IDS = Object.keys(LAB_META) as LabId[];
