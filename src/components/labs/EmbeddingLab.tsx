"use client";

import { useCallback, useRef, useState } from "react";
import { clamp, cosineSimilarity } from "@/lib/utils";

/**
 * A 2D stand-in for a high-dimensional embedding space. Documents are placed by
 * hand so the clusters are legible; the similarity maths is the real thing.
 */

type Doc = { id: string; label: string; topic: string; x: number; y: number };

// Coordinates are in a -1..1 space centred on the origin, so cosine
// similarity (which measures angle from the origin) behaves meaningfully.
const DOCS: Doc[] = [
  { id: "d1", label: "How to reset your password", topic: "auth", x: 0.72, y: 0.55 },
  { id: "d2", label: "Two-factor authentication setup", topic: "auth", x: 0.62, y: 0.71 },
  { id: "d3", label: "Recovering a locked account", topic: "auth", x: 0.81, y: 0.42 },
  { id: "d4", label: "Upgrading your billing plan", topic: "billing", x: -0.68, y: 0.5 },
  { id: "d5", label: "Refund and cancellation policy", topic: "billing", x: -0.78, y: 0.33 },
  { id: "d6", label: "Reading your monthly invoice", topic: "billing", x: -0.55, y: 0.64 },
  { id: "d7", label: "API rate limits explained", topic: "api", x: -0.6, y: -0.62 },
  { id: "d8", label: "Authenticating API requests", topic: "api", x: 0.18, y: -0.83 },
  { id: "d9", label: "Webhook retry behaviour", topic: "api", x: -0.42, y: -0.79 },
];

const TOPIC_STYLE: Record<string, { dot: string; text: string }> = {
  auth: { dot: "fill-sky-400", text: "text-sky-300" },
  billing: { dot: "fill-emerald-400", text: "text-emerald-300" },
  api: { dot: "fill-amber-400", text: "text-amber-300" },
};

const SIZE = 320;
const PADDING = 26;

/** Map a -1..1 coordinate onto SVG pixel space. */
function toPixels(value: number) {
  return PADDING + ((value + 1) / 2) * (SIZE - PADDING * 2);
}

/** Map an SVG pixel coordinate back to -1..1. */
function toUnit(pixel: number) {
  return clamp(((pixel - PADDING) / (SIZE - PADDING * 2)) * 2 - 1, -1, 1);
}

export default function EmbeddingLab() {
  const [query, setQuery] = useState({ x: 0.45, y: 0.2 });
  const [metric, setMetric] = useState<"cosine" | "euclidean">("cosine");
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const score = useCallback(
    (doc: Doc) =>
      metric === "cosine"
        ? cosineSimilarity([query.x, query.y], [doc.x, doc.y])
        : // Negate distance so that "higher is better" holds for both metrics.
          -Math.hypot(query.x - doc.x, query.y - doc.y),
    [query, metric],
  );

  const ranked = [...DOCS].sort((a, b) => score(b) - score(a));

  const moveTo = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    // The SVG scales responsively, so convert through its rendered size.
    const px = ((clientX - rect.left) / rect.width) * SIZE;
    const py = ((clientY - rect.top) / rect.height) * SIZE;
    setQuery({ x: toUnit(px), y: -toUnit(py) });
  }, []);

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <div className="flex-1">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {(["cosine", "euclidean"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                metric === m
                  ? "border-indigo-500 bg-indigo-500/15 text-indigo-200"
                  : "border-ink-700 bg-ink-850 text-ink-400 hover:text-ink-200"
              }`}
            >
              {m === "cosine" ? "Cosine similarity" : "Euclidean distance"}
            </button>
          ))}
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="application"
          aria-label="Draggable 2D embedding space. Use the sliders below for keyboard control."
          className="w-full max-w-md touch-none select-none rounded-xl border border-ink-700 bg-ink-950"
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            moveTo(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => dragging.current && moveTo(e.clientX, e.clientY)}
          onPointerUp={(e) => {
            dragging.current = false;
            e.currentTarget.releasePointerCapture(e.pointerId);
          }}
        >
          {/* Axes */}
          <line
            x1={PADDING} y1={SIZE / 2} x2={SIZE - PADDING} y2={SIZE / 2}
            className="stroke-ink-800" strokeWidth="1"
          />
          <line
            x1={SIZE / 2} y1={PADDING} x2={SIZE / 2} y2={SIZE - PADDING}
            className="stroke-ink-800" strokeWidth="1"
          />

          {/* Ray from origin through the query — cosine compares these angles. */}
          {metric === "cosine" && (
            <line
              x1={SIZE / 2}
              y1={SIZE / 2}
              x2={toPixels(query.x)}
              y2={toPixels(-query.y)}
              className="stroke-indigo-500/50"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Connector to the top match */}
          {ranked[0] && (
            <line
              x1={toPixels(query.x)}
              y1={toPixels(-query.y)}
              x2={toPixels(ranked[0].x)}
              y2={toPixels(-ranked[0].y)}
              className="stroke-indigo-400/60"
              strokeWidth="1.5"
            />
          )}

          {DOCS.map((doc) => {
            const isTop = ranked[0]?.id === doc.id;
            return (
              <g key={doc.id}>
                <circle
                  cx={toPixels(doc.x)}
                  cy={toPixels(-doc.y)}
                  r={isTop ? 7 : 5}
                  className={TOPIC_STYLE[doc.topic].dot}
                  opacity={isTop ? 1 : 0.75}
                />
                {isTop && (
                  <circle
                    cx={toPixels(doc.x)}
                    cy={toPixels(-doc.y)}
                    r={11}
                    className="fill-none stroke-indigo-300"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            );
          })}

          {/* Query point */}
          <circle
            cx={toPixels(query.x)}
            cy={toPixels(-query.y)}
            r={8}
            className="fill-indigo-500 stroke-white"
            strokeWidth="2"
          />
        </svg>

        <p className="mt-2 text-xs text-ink-500">
          Drag the white-ringed point, or use the sliders below.
        </p>

        {/* Keyboard/touch-accessible alternative to dragging. */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(["x", "y"] as const).map((axis) => (
            <label key={axis} className="flex flex-col gap-1">
              <span className="font-mono text-[11px] text-ink-500">
                query.{axis} = {query[axis].toFixed(2)}
              </span>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.01}
                value={query[axis]}
                onChange={(e) =>
                  setQuery((q) => ({ ...q, [axis]: Number(e.target.value) }))
                }
                className="accent-indigo-500"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-500">
          Ranked results
        </div>
        <ol className="flex flex-col gap-1.5">
          {ranked.map((doc, i) => {
            const value = score(doc);
            return (
              <li
                key={doc.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                  i === 0
                    ? "border-indigo-500/50 bg-indigo-500/10"
                    : "border-ink-800 bg-ink-900/50"
                }`}
              >
                <span className="w-4 shrink-0 font-mono text-xs text-ink-600">
                  {i + 1}
                </span>
                <span className="flex-1 text-[13px] leading-snug text-ink-200">
                  {doc.label}
                  <span
                    className={`ml-2 text-[10px] uppercase tracking-wide ${TOPIC_STYLE[doc.topic].text}`}
                  >
                    {doc.topic}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs text-ink-400">
                  {metric === "cosine" ? value.toFixed(3) : (-value).toFixed(3)}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs leading-relaxed text-ink-500">
          {metric === "cosine"
            ? "Cosine ignores distance from the origin — only the angle matters. Move the query far out along a ray and the ranking barely changes."
            : "Euclidean distance measures raw closeness, so moving the query away from the origin reshuffles results even when its direction is unchanged."}
        </p>
      </div>
    </div>
  );
}
