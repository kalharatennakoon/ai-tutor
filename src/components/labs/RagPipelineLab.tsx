"use client";

import { useMemo, useState } from "react";

/**
 * A working retrieval pipeline over a tiny corpus. Scoring runs entirely in the
 * browser: a lexical (BM25-flavoured) score and a keyword-expansion score that
 * stands in for dense retrieval, fused with Reciprocal Rank Fusion.
 */

type Chunk = { id: string; source: string; text: string };

const CORPUS: Chunk[] = [
  {
    id: "c1",
    source: "billing.md § Refunds",
    text: "Refunds are issued to the original payment method within 5–10 business days. Requests must be submitted within 30 days of the charge.",
  },
  {
    id: "c2",
    source: "billing.md § Plans",
    text: "Upgrading a plan takes effect immediately and is prorated. Downgrades apply at the end of the current billing cycle.",
  },
  {
    id: "c3",
    source: "auth.md § Password reset",
    text: "To reset a password, use the 'Forgot password' link on the sign-in page. The reset link expires after 60 minutes.",
  },
  {
    id: "c4",
    source: "auth.md § Lockouts",
    text: "Accounts lock after 10 failed sign-in attempts. A locked account unlocks automatically after 15 minutes, or an admin can unlock it immediately.",
  },
  {
    id: "c5",
    source: "api.md § Rate limits",
    text: "The API allows 1000 requests per minute per key. Exceeding the limit returns HTTP 429 with a Retry-After header. Error code ERR_4021 indicates a sustained overage.",
  },
  {
    id: "c6",
    source: "api.md § Authentication",
    text: "Authenticate API requests with a bearer token in the Authorization header. Tokens can be rotated from the dashboard without downtime.",
  },
  {
    id: "c7",
    source: "api.md § Webhooks",
    text: "Failed webhook deliveries retry with exponential backoff for up to 24 hours. Endpoints must respond within 5 seconds.",
  },
  {
    id: "c8",
    source: "security.md § Data handling",
    text: "Customer data is encrypted at rest with AES-256 and in transit with TLS 1.3. Backups are retained for 35 days.",
  },
];

/** Stand-in for an embedding model's learned synonymy. */
const SYNONYMS: Record<string, string[]> = {
  password: ["credentials", "login", "signin", "reset", "forgot"],
  login: ["signin", "password", "credentials", "authenticate"],
  refund: ["money", "back", "cancellation", "charge", "reimburse"],
  money: ["refund", "charge", "payment", "billing"],
  locked: ["lockout", "blocked", "attempts", "unlock"],
  slow: ["rate", "limit", "throttle", "429"],
  throttled: ["rate", "limit", "429", "overage"],
  secure: ["encrypted", "encryption", "security", "tls"],
  upgrade: ["plan", "prorated", "billing"],
};

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "do", "does", "how", "what", "my", "i", "to",
  "of", "for", "in", "on", "can", "it", "and", "why", "when", "me", "you",
]);

function terms(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Term match with a narrow allowance for inflection ("limit" ↔ "limits").
 * A naive `startsWith` is far too loose: it makes "back" match "backoff" and
 * "backups", so a refund question retrieves the webhook docs.
 */
function matches(a: string, b: string): boolean {
  if (a === b) return true;
  const [long, short] = a.length >= b.length ? [a, b] : [b, a];
  // Only long-enough stems, and only a short suffix (-s, -ed, -ing).
  return short.length >= 5 && long.startsWith(short) && long.length - short.length <= 3;
}

/** Lexical score: term overlap weighted by inverse document frequency. */
function lexicalScore(queryTerms: string[], chunk: Chunk): number {
  const chunkTerms = terms(chunk.text);
  let score = 0;

  for (const term of queryTerms) {
    const tf = chunkTerms.filter((t) => matches(t, term)).length;
    if (tf === 0) continue;
    const df = CORPUS.filter((c) => terms(c.text).some((t) => matches(t, term))).length;
    const idf = Math.log(1 + CORPUS.length / (df || 1));
    // Saturating term frequency, as BM25 does — the 5th occurrence
    // shouldn't count as much as the 1st.
    score += idf * (tf / (tf + 1.2));
  }
  return score;
}

/**
 * Opaque identifiers — error codes, SKUs, order numbers — carry almost no
 * semantic signal, so a real embedding model maps them near-generically and
 * ranks the exact-match chunk poorly. Digits are a good proxy for that class.
 */
function isOpaqueIdentifier(term: string): boolean {
  return /\d/.test(term);
}

/** Semantic stand-in: expand the query through synonyms, then match. */
function semanticScore(queryTerms: string[], chunk: Chunk): number {
  // Dropping identifiers here is what reproduces dense retrieval's blind spot.
  const meaningful = queryTerms.filter((t) => !isOpaqueIdentifier(t));
  const expanded = new Set(meaningful);
  for (const term of meaningful) {
    for (const syn of SYNONYMS[term] ?? []) expanded.add(syn);
  }

  const chunkTerms = terms(chunk.text);
  let hits = 0;
  for (const term of expanded) {
    if (chunkTerms.some((t) => matches(t, term))) hits++;
  }
  return expanded.size === 0 ? 0 : hits / expanded.size;
}

function rrf(rankings: string[][], k = 60): Map<string, number> {
  const scores = new Map<string, number>();
  for (const ranking of rankings) {
    ranking.forEach((id, index) => {
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + index + 1));
    });
  }
  return scores;
}

const EXAMPLE_QUERIES = [
  "I forgot my login credentials",
  "How do I get my money back?",
  "ERR_4021",
  "is my data encrypted",
];

export default function RagPipelineLab() {
  const [query, setQuery] = useState(EXAMPLE_QUERIES[0]);
  const [topK, setTopK] = useState(3);
  const [mode, setMode] = useState<"hybrid" | "semantic" | "lexical">("hybrid");

  const results = useMemo(() => {
    const queryTerms = terms(query);
    if (queryTerms.length === 0) return [];

    const scored = CORPUS.map((chunk) => ({
      chunk,
      lexical: lexicalScore(queryTerms, chunk),
      semantic: semanticScore(queryTerms, chunk),
    }));

    if (mode === "lexical") {
      return scored
        .filter((s) => s.lexical > 0)
        .sort((a, b) => b.lexical - a.lexical)
        .map((s) => ({ ...s, fused: s.lexical }));
    }

    if (mode === "semantic") {
      return scored
        .filter((s) => s.semantic > 0)
        .sort((a, b) => b.semantic - a.semantic)
        .map((s) => ({ ...s, fused: s.semantic }));
    }

    const lexicalRanking = [...scored]
      .filter((s) => s.lexical > 0)
      .sort((a, b) => b.lexical - a.lexical)
      .map((s) => s.chunk.id);
    const semanticRanking = [...scored]
      .filter((s) => s.semantic > 0)
      .sort((a, b) => b.semantic - a.semantic)
      .map((s) => s.chunk.id);

    const fusedScores = rrf([lexicalRanking, semanticRanking]);

    return scored
      .filter((s) => fusedScores.has(s.chunk.id))
      .map((s) => ({ ...s, fused: fusedScores.get(s.chunk.id) ?? 0 }))
      .sort((a, b) => b.fused - a.fused);
  }, [query, mode]);

  const retrieved = results.slice(0, topK);

  const assembledPrompt = [
    "Answer using only the context below. If the context is insufficient, say so.",
    "",
    "<context>",
    ...retrieved.map((r) => `[${r.chunk.source}]\n${r.chunk.text}`),
    "</context>",
    "",
    `Question: ${query}`,
  ].join("\n");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setQuery(q)}
            className="rounded-lg border border-ink-700 bg-ink-850 px-2.5 py-1 text-xs text-ink-300 transition-colors hover:border-indigo-500/50 hover:text-ink-100"
          >
            {q}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-500">
          Query
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-ink-100 outline-none transition-colors focus:border-indigo-500"
          placeholder="Ask the knowledge base something…"
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1.5">
          {(["hybrid", "semantic", "lexical"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                mode === m
                  ? "border-indigo-500 bg-indigo-500/15 text-indigo-200"
                  : "border-ink-700 bg-ink-850 text-ink-400 hover:text-ink-200"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs text-ink-400">
          <span className="font-mono">top-k = {topK}</span>
          <input
            type="range"
            min={1}
            max={6}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="w-28 accent-indigo-500"
          />
        </label>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-500">
          Retrieved chunks
        </div>
        {retrieved.length === 0 ? (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-200">
            Nothing matched.{" "}
            {mode === "lexical"
              ? "Lexical search needs literal word overlap — try switching to hybrid."
              : "Try one of the example queries above."}
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {retrieved.map((result, i) => (
              <li
                key={result.chunk.id}
                className="rounded-xl border border-ink-700 bg-ink-900/60 p-3"
              >
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="font-mono text-[11px] text-indigo-300">
                    {i + 1}. {result.chunk.source}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-ink-500">
                    {mode === "hybrid"
                      ? `rrf ${result.fused.toFixed(4)}`
                      : result.fused.toFixed(3)}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-ink-300">
                  {result.chunk.text}
                </p>
                {mode === "hybrid" && (
                  <div className="mt-2 flex gap-3 font-mono text-[10px] text-ink-600">
                    <span>lexical {result.lexical.toFixed(2)}</span>
                    <span>semantic {result.semantic.toFixed(2)}</span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      <details className="rounded-xl border border-ink-700 bg-ink-950">
        <summary className="cursor-pointer px-3.5 py-2.5 text-xs font-medium uppercase tracking-wider text-ink-400 transition-colors hover:text-ink-200">
          Assembled prompt ({assembledPrompt.length} chars)
        </summary>
        <pre className="overflow-x-auto border-t border-ink-800 px-3.5 py-3 font-mono text-[12px] leading-relaxed text-ink-300">
          {assembledPrompt}
        </pre>
      </details>

      <p className="text-xs leading-relaxed text-ink-500">
        Try{" "}
        <span className="font-mono text-ink-400">
          &quot;How do I get my money back?&quot;
        </span>{" "}
        in lexical mode — it finds nothing, because the refund policy never uses
        the words &quot;money&quot; or &quot;back&quot;. Switch to semantic and
        it surfaces immediately. Then try{" "}
        <span className="font-mono text-ink-400">ERR_4021</span> and watch the
        advantage flip: an opaque identifier carries almost no semantic signal,
        but keyword search nails it. Hybrid is the mode that handles both.
      </p>
    </div>
  );
}
