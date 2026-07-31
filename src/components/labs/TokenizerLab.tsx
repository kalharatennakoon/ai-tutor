"use client";

import { useMemo, useState } from "react";

/**
 * Approximates subword tokenization well enough to build intuition, without
 * shipping a real BPE vocabulary to the browser. Real tokenizers are learned
 * from data; this one applies the *rules* those tokenizers tend to discover:
 * common short words stay whole, long words split, and unusual characters
 * fragment aggressively.
 */

const COMMON_WORDS = new Set([
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "it", "for", "not",
  "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by",
  "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one",
  "all", "would", "there", "their", "what", "so", "up", "out", "if", "about",
  "who", "get", "which", "go", "me", "when", "make", "can", "like", "time",
  "no", "just", "him", "know", "take", "people", "into", "year", "your",
  "good", "some", "could", "them", "see", "other", "than", "then", "now",
  "look", "only", "come", "its", "over", "think", "also", "back", "after",
  "use", "two", "how", "our", "work", "first", "well", "way", "even", "new",
  "want", "because", "any", "these", "give", "day", "most", "us", "is", "are",
  "was", "were", "has", "had", "model", "data", "text", "token", "word",
]);

/** Suffixes a BPE vocabulary almost always learns as standalone units. */
const SUFFIXES = ["ization", "ations", "ation", "ingly", "ments", "ment", "ings",
  "ing", "ness", "able", "ible", "tion", "sion", "ical", "ies", "ers", "est",
  "ed", "er", "ly", "es", "s"];

function splitWord(word: string): string[] {
  const lower = word.toLowerCase();

  // Short or very common words survive as a single token.
  if (word.length <= 4 || COMMON_WORDS.has(lower)) return [word];

  for (const suffix of SUFFIXES) {
    if (lower.length > suffix.length + 2 && lower.endsWith(suffix)) {
      const stem = word.slice(0, word.length - suffix.length);
      return [...splitWord(stem), word.slice(word.length - suffix.length)];
    }
  }

  // No recognizable suffix — chop into ~4-character pieces, the average
  // token length real tokenizers converge on for English.
  if (word.length > 7) {
    const pieces: string[] = [];
    for (let i = 0; i < word.length; i += 4) pieces.push(word.slice(i, i + 4));
    return pieces;
  }

  return [word];
}

function tokenize(text: string): string[] {
  if (!text) return [];
  const tokens: string[] = [];

  // Split into words (with any leading whitespace attached, as real
  // tokenizers do), standalone punctuation, and everything else.
  const chunks = text.match(/\s*[A-Za-z]+|\s*\d+|\s*[^\sA-Za-z\d]|\s+/g) ?? [];

  for (const chunk of chunks) {
    const leading = chunk.match(/^\s*/)?.[0] ?? "";
    const core = chunk.slice(leading.length);

    if (core === "") {
      tokens.push(chunk);
      continue;
    }

    if (/^[A-Za-z]+$/.test(core)) {
      const parts = splitWord(core);
      // The leading space rides along with the first piece.
      tokens.push(leading + parts[0], ...parts.slice(1));
    } else if (/^\d+$/.test(core)) {
      // Digits usually split into small groups, which is why long-number
      // arithmetic is awkward for models.
      const groups = core.match(/\d{1,3}/g) ?? [core];
      tokens.push(leading + groups[0], ...groups.slice(1));
    } else {
      // Punctuation, emoji, and other symbols: one token each, and
      // multi-byte characters often cost several.
      const units = Array.from(core);
      tokens.push(leading + units[0], ...units.slice(1));
    }
  }

  return tokens.filter((t) => t !== "");
}

const PRESETS = [
  { label: "Plain English", text: "The model predicts the next token in the sequence." },
  { label: "Technical", text: "Retrieval-augmented generation improves factual grounding." },
  { label: "Long word", text: "Immunoelectrophoresis and antidisestablishmentarianism" },
  { label: "Numbers", text: "Order 4815162342 shipped on 2026-07-31 for $1,299.99" },
  { label: "Emoji", text: "Shipping it 🚀🚀 — the team is thrilled 🎉" },
];

const CHIP_COLORS = [
  "bg-sky-500/15 text-sky-200 border-sky-500/30",
  "bg-violet-500/15 text-violet-200 border-violet-500/30",
  "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  "bg-amber-500/15 text-amber-200 border-amber-500/30",
  "bg-rose-500/15 text-rose-200 border-rose-500/30",
];

export default function TokenizerLab() {
  const [text, setText] = useState(PRESETS[0].text);
  const tokens = useMemo(() => tokenize(text), [text]);

  const charsPerToken = tokens.length > 0 ? text.length / tokens.length : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setText(preset.text)}
            className="rounded-lg border border-ink-700 bg-ink-850 px-2.5 py-1 text-xs text-ink-300 transition-colors hover:border-indigo-500/50 hover:text-ink-100"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-500">
          Your text
        </span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          spellCheck={false}
          className="w-full resize-y rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-3 font-mono text-sm text-ink-100 outline-none transition-colors placeholder:text-ink-600 focus:border-indigo-500"
          placeholder="Type anything…"
        />
      </label>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Characters", value: text.length },
          { label: "Tokens", value: tokens.length },
          { label: "Chars / token", value: charsPerToken.toFixed(2) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-ink-700 bg-ink-850/60 px-3 py-2.5 text-center"
          >
            <div className="font-mono text-lg font-semibold text-ink-100">
              {stat.value}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-500">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-500">
          Tokens
        </div>
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-ink-700 bg-ink-950 p-3 min-h-20">
          {tokens.length === 0 ? (
            <span className="text-sm text-ink-600">Nothing to tokenize yet.</span>
          ) : (
            tokens.map((token, i) => (
              <span
                key={i}
                title={`Token ${i + 1}`}
                className={`rounded-md border px-1.5 py-0.5 font-mono text-[13px] whitespace-pre ${
                  CHIP_COLORS[i % CHIP_COLORS.length]
                }`}
              >
                {token.replace(/ /g, "·")}
              </span>
            ))
          )}
        </div>
        <p className="mt-2 text-xs text-ink-500">
          <span className="font-mono">·</span> marks a leading space — most
          tokenizers attach it to the following word, so{" "}
          <span className="font-mono text-ink-400">&quot;cat&quot;</span> and{" "}
          <span className="font-mono text-ink-400">&quot;·cat&quot;</span> are different tokens.
        </p>
      </div>
    </div>
  );
}
