"use client";

import { useMemo, useState } from "react";

/**
 * Reshapes a fixed set of logits with temperature and top-p so the sampling
 * knobs stop being abstract. The maths here is exactly what an inference
 * server does at each generation step.
 */

// Plausible continuations of "The weather today is ___", with raw logits.
const CANDIDATES: { token: string; logit: number }[] = [
  { token: " sunny", logit: 3.2 },
  { token: " cold", logit: 2.7 },
  { token: " nice", logit: 2.4 },
  { token: " warm", logit: 2.2 },
  { token: " terrible", logit: 1.4 },
  { token: " unpredictable", logit: 0.9 },
  { token: " purple", logit: -0.6 },
  { token: " Tuesday", logit: -1.5 },
];

function softmax(logits: number[], temperature: number): number[] {
  // Greedy decoding: temperature 0 puts all mass on the argmax.
  if (temperature <= 0.01) {
    const maxIndex = logits.indexOf(Math.max(...logits));
    return logits.map((_, i) => (i === maxIndex ? 1 : 0));
  }

  const scaled = logits.map((l) => l / temperature);
  // Subtract the max before exponentiating — standard guard against overflow.
  const max = Math.max(...scaled);
  const exps = scaled.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export default function TemperatureLab() {
  const [temperature, setTemperature] = useState(1);
  const [topP, setTopP] = useState(1);

  const rows = useMemo(() => {
    const probs = softmax(
      CANDIDATES.map((c) => c.logit),
      temperature,
    );

    const ordered = CANDIDATES.map((c, i) => ({ ...c, prob: probs[i] })).sort(
      (a, b) => b.prob - a.prob,
    );

    // Nucleus sampling: keep the smallest prefix whose mass reaches topP,
    // then renormalize over the survivors.
    let cumulative = 0;
    let cutoff = ordered.length;
    for (let i = 0; i < ordered.length; i++) {
      cumulative += ordered[i].prob;
      if (cumulative >= topP) {
        cutoff = i + 1;
        break;
      }
    }

    const kept = ordered.slice(0, cutoff);
    const keptMass = kept.reduce((sum, r) => sum + r.prob, 0) || 1;

    return ordered.map((row, i) => ({
      ...row,
      included: i < cutoff,
      finalProb: i < cutoff ? row.prob / keptMass : 0,
    }));
  }, [temperature, topP]);

  const survivors = rows.filter((r) => r.included).length;
  const maxProb = Math.max(...rows.map((r) => r.finalProb), 0.001);

  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 font-mono text-sm text-ink-300">
        The weather today is
        <span className="ml-1 rounded bg-indigo-500/20 px-1.5 py-0.5 text-indigo-200">
          ___
        </span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between text-xs">
            <span className="font-medium uppercase tracking-wider text-ink-500">
              Temperature
            </span>
            <span className="font-mono text-ink-200">{temperature.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.01}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="accent-indigo-500"
          />
          <span className="text-[11px] text-ink-600">
            0 = greedy · 1 = raw distribution · 2 = very flat
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between text-xs">
            <span className="font-medium uppercase tracking-wider text-ink-500">
              Top-p
            </span>
            <span className="font-mono text-ink-200">{topP.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.01}
            value={topP}
            onChange={(e) => setTopP(Number(e.target.value))}
            className="accent-indigo-500"
          />
          <span className="text-[11px] text-ink-600">
            {survivors} of {rows.length} tokens survive the nucleus
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.token} className="flex items-center gap-3">
            <span
              className={`w-32 shrink-0 truncate font-mono text-[13px] ${
                row.included ? "text-ink-200" : "text-ink-600 line-through"
              }`}
            >
              {row.token.replace(/^ /, "·")}
            </span>

            <div className="h-5 flex-1 overflow-hidden rounded bg-ink-900">
              <div
                className={`h-full rounded transition-[width] duration-200 ${
                  row.included
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500"
                    : "bg-ink-700"
                }`}
                style={{ width: `${(row.finalProb / maxProb) * 100}%` }}
              />
            </div>

            <span
              className={`w-14 shrink-0 text-right font-mono text-[12px] ${
                row.included ? "text-ink-300" : "text-ink-600"
              }`}
            >
              {(row.finalProb * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-ink-500">
        Drag temperature to 0 and one bar takes everything — that&apos;s greedy
        decoding, fully deterministic. Push it to 2 and{" "}
        <span className="font-mono text-ink-400">·purple</span> becomes a real
        possibility. Then pull top-p down to 0.5 and watch the tail get cut off
        regardless of temperature — the two knobs compose.
      </p>
    </div>
  );
}
