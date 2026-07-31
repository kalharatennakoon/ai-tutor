"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "ai-tutor:progress:v1";

/** Completed lesson keys, stored as `${courseId}/${lessonId}`. */
type ProgressState = Record<string, boolean>;

const listeners = new Set<() => void>();

/**
 * Cached snapshot. `useSyncExternalStore` compares snapshots by reference and
 * will loop forever if `getSnapshot` returns a fresh object each call, so we
 * only rebuild this when the underlying storage actually changes.
 */
let snapshot: ProgressState = {};
let hydrated = false;

/** Stable empty object for SSR — must be referentially constant. */
const SERVER_SNAPSHOT: ProgressState = {};

function read(): ProgressState {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressState) : {};
  } catch {
    // Private browsing, quota errors, or corrupt JSON — degrade to no progress.
    return {};
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  if (!hydrated) {
    snapshot = read();
    hydrated = true;
  }
  listeners.add(listener);

  // Keep multiple tabs in sync.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      snapshot = read();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): ProgressState {
  return hydrated ? snapshot : SERVER_SNAPSHOT;
}

function getServerSnapshot(): ProgressState {
  return SERVER_SNAPSHOT;
}

function write(next: ProgressState) {
  snapshot = next;
  hydrated = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — keep the in-memory value so the session still works.
  }
  emit();
}

export function lessonKey(courseId: string, lessonId: string) {
  return `${courseId}/${lessonId}`;
}

export function useProgress() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isComplete = useCallback(
    (courseId: string, lessonId: string) => !!state[lessonKey(courseId, lessonId)],
    [state],
  );

  const setComplete = useCallback(
    (courseId: string, lessonId: string, complete: boolean) => {
      const key = lessonKey(courseId, lessonId);
      const next = { ...snapshot };
      if (complete) {
        next[key] = true;
      } else {
        delete next[key];
      }
      write(next);
    },
    [],
  );

  const completedInCourse = useCallback(
    (courseId: string, lessonIds: string[]) =>
      lessonIds.filter((id) => state[lessonKey(courseId, id)]).length,
    [state],
  );

  const reset = useCallback(() => write({}), []);

  const totalCompleted = Object.keys(state).length;

  return { isComplete, setComplete, completedInCourse, totalCompleted, reset };
}
