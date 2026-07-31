"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Fits `y = wx + b` to fixed noisy data with plain batch gradient descent, so
 * the learning-rate trade-off is visible rather than described.
 */

const TRUE_W = 1.6;
const TRUE_B = -0.4;

// Fixed sample (not random) so the lab is deterministic across reloads and
// two learners comparing notes see the same thing.
const DATA: { x: number; y: number }[] = [
  { x: -1.8, y: -3.1 }, { x: -1.4, y: -2.9 }, { x: -1.1, y: -2.0 },
  { x: -0.7, y: -1.8 }, { x: -0.3, y: -0.6 }, { x: 0.0, y: -0.7 },
  { x: 0.35, y: 0.4 }, { x: 0.7, y: 0.5 }, { x: 1.05, y: 1.5 },
  { x: 1.4, y: 1.6 }, { x: 1.75, y: 2.6 }, { x: 2.1, y: 2.9 },
];

const SIZE = 300;
const PAD = 30;
const RANGE = 3.4;

function toPx(value: number) {
  return PAD + ((value + RANGE) / (2 * RANGE)) * (SIZE - 2 * PAD);
}

function meanSquaredError(w: number, b: number) {
  return (
    DATA.reduce((sum, p) => sum + (w * p.x + b - p.y) ** 2, 0) / DATA.length
  );
}

function gradients(w: number, b: number) {
  let gradW = 0;
  let gradB = 0;
  for (const p of DATA) {
    const error = w * p.x + b - p.y;
    gradW += (2 / DATA.length) * error * p.x;
    gradB += (2 / DATA.length) * error;
  }
  return { gradW, gradB };
}

export default function GradientDescentLab() {
  const [lr, setLr] = useState(0.05);
  const [{ w, b }, setParams] = useState({ w: -1.5, b: 1.8 });
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<number[]>([meanSquaredError(-1.5, 1.8)]);

  const loss = meanSquaredError(w, b);
  const diverged = !Number.isFinite(loss) || loss > 1e6;

  const takeStep = useCallback(() => {
    setParams((prev) => {
      const { gradW, gradB } = gradients(prev.w, prev.b);
      const next = { w: prev.w - lr * gradW, b: prev.b - lr * gradB };
      setHistory((h) => [...h.slice(-119), meanSquaredError(next.w, next.b)]);
      return next;
    });
    setStep((s) => s + 1);
  }, [lr]);

  // Animate while running; stop automatically on divergence or convergence.
  useEffect(() => {
    if (!running) return;
    if (diverged) {
      setRunning(false);
      return;
    }
    const id = window.setTimeout(takeStep, 60);
    return () => window.clearTimeout(id);
  }, [running, takeStep, step, diverged]);

  const reset = () => {
    setRunning(false);
    setParams({ w: -1.5, b: 1.8 });
    setStep(0);
    setHistory([meanSquaredError(-1.5, 1.8)]);
  };

  const maxLoss = Math.max(...history.filter(Number.isFinite), 1);

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <div className="flex-1">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full max-w-sm rounded-xl border border-ink-700 bg-ink-950"
          role="img"
          aria-label={`Scatter plot with a fitted line. Current loss ${loss.toFixed(3)}.`}
        >
          <line x1={PAD} y1={toPx(0)} x2={SIZE - PAD} y2={toPx(0)} className="stroke-ink-800" />
          <line x1={toPx(0)} y1={PAD} x2={toPx(0)} y2={SIZE - PAD} className="stroke-ink-800" />

          {/* Target line the optimizer is trying to recover */}
          <line
            x1={toPx(-RANGE)}
            y1={toPx(-(TRUE_W * -RANGE + TRUE_B))}
            x2={toPx(RANGE)}
            y2={toPx(-(TRUE_W * RANGE + TRUE_B))}
            className="stroke-emerald-500/40"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Residuals */}
          {!diverged &&
            DATA.map((p, i) => (
              <line
                key={`r${i}`}
                x1={toPx(p.x)}
                y1={toPx(-p.y)}
                x2={toPx(p.x)}
                y2={toPx(-(w * p.x + b))}
                className="stroke-rose-500/40"
                strokeWidth="1"
              />
            ))}

          {/* Current fit */}
          {!diverged && (
            <line
              x1={toPx(-RANGE)}
              y1={toPx(-(w * -RANGE + b))}
              x2={toPx(RANGE)}
              y2={toPx(-(w * RANGE + b))}
              className="stroke-indigo-400"
              strokeWidth="2.5"
            />
          )}

          {DATA.map((p, i) => (
            <circle key={i} cx={toPx(p.x)} cy={toPx(-p.y)} r="3.5" className="fill-sky-400" />
          ))}
        </svg>

        <div className="mt-2 flex gap-4 text-[11px] text-ink-500">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-indigo-400" /> current fit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t border-dashed border-emerald-500" /> target
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-rose-500/60" /> error
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between text-xs text-ink-400">
            <span className="font-medium uppercase tracking-wider text-ink-500">
              Learning rate
            </span>
            <span className="font-mono text-ink-200">{lr.toFixed(3)}</span>
          </span>
          <input
            type="range"
            min={0.001}
            max={0.6}
            step={0.001}
            value={lr}
            onChange={(e) => setLr(Number(e.target.value))}
            className="accent-indigo-500"
          />
          <span className="text-[11px] text-ink-600">
            Above ~0.45 this problem diverges. Below ~0.01 it crawls.
          </span>
        </label>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "step", value: step },
            { label: "loss (MSE)", value: diverged ? "∞" : loss.toFixed(4) },
            { label: "w / b", value: diverged ? "—" : `${w.toFixed(2)} / ${b.toFixed(2)}` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-ink-700 bg-ink-850/60 px-2 py-2 text-center"
            >
              <div className="font-mono text-sm font-semibold text-ink-100">
                {stat.value}
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Loss curve */}
        <div>
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-ink-500">
            Loss over time
          </div>
          <svg
            viewBox="0 0 240 64"
            preserveAspectRatio="none"
            className="h-16 w-full rounded-lg border border-ink-700 bg-ink-950"
            role="img"
            aria-label="Loss curve"
          >
            <polyline
              fill="none"
              strokeWidth="1.5"
              className="stroke-indigo-400"
              points={history
                .map((value, i) => {
                  const x = (i / Math.max(history.length - 1, 1)) * 240;
                  const safe = Number.isFinite(value) ? value : maxLoss;
                  const y = 60 - (safe / maxLoss) * 56;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(" ")}
            />
          </svg>
        </div>

        {diverged && (
          <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            Diverged — the loss exploded. This is the NaN failure mode: each step
            overshoots and lands somewhere steeper. Lower the learning rate and
            reset.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            disabled={diverged}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {running ? "Pause" : "Train"}
          </button>
          <button
            type="button"
            onClick={takeStep}
            disabled={running || diverged}
            className="rounded-lg border border-ink-700 px-4 py-2 text-sm font-medium text-ink-200 transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Step
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-ink-700 px-4 py-2 text-sm font-medium text-ink-200 transition-colors hover:bg-ink-800"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
