/**
 * Content loader with Firestore → JSON fallback.
 *
 * Strategy: for each dataset we try Firestore first (where new admin-imported
 * content lives), fall back to the legacy JSON file in `/data/` (fast, shipped
 * with the bundle, never deleted per `feedback_no_delete_data`). Once the
 * teacher imports a unit/topic into Firestore it overrides the JSON baseline.
 *
 * Both sources are merged into the expected shape the pages already consume,
 * so page code doesn't need to change.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  SGKData,
  Grade10VocabData,
  Grade10GrammarData,
  Grade10WritingData,
} from "./types";

const cache = new Map<string, unknown>();

async function fetchJSON<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  const data = await res.json();
  cache.set(path, data);
  return data as T;
}

// ─── SGK grades 3-9 ────────────────────────────────────────────────────────

export async function loadSGKData(grade: number): Promise<SGKData> {
  const cacheKey = `sgk:${grade}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey) as SGKData;

  const base = await fetchJSON<SGKData>(`/data/sgk_eng${grade}_data.json`);

  try {
    const col = collection(db, "sgk", `grade${grade}`, "units");
    const snap = await getDocs(col);
    if (!snap.empty) {
      const merged: SGKData = {
        ...base,
        units: { ...(base.units ?? {}) },
      };
      snap.forEach((d) => {
        const data = d.data() as {
          unitKey?: string;
          title?: string;
          vocabulary?: SGKData["units"][string]["vocabulary"];
          grammar?: SGKData["units"][string]["grammar"];
          grammar_notes?: string;
          exercises?: SGKData["units"][string]["exercises"];
        };
        const key = data.unitKey ?? d.id;
        if (data.title && data.vocabulary && data.exercises) {
          merged.units[key] = {
            title: data.title,
            vocabulary: data.vocabulary,
            grammar: data.grammar,
            grammar_notes: data.grammar_notes,
            exercises: data.exercises,
          };
        }
      });
      cache.set(cacheKey, merged);
      return merged;
    }
  } catch (e) {
    console.warn(`Firestore SGK fetch failed for grade ${grade}, using JSON fallback:`, e);
  }

  cache.set(cacheKey, base);
  return base;
}

// ─── Grade 10 datasets ─────────────────────────────────────────────────────

export async function loadGrade10Vocab(): Promise<Grade10VocabData> {
  const cacheKey = "g10:vocab";
  if (cache.has(cacheKey)) return cache.get(cacheKey) as Grade10VocabData;
  const base = await fetchJSON<Grade10VocabData>("/data/grade10_vocab.json");
  const merged = await mergeFromFirestore(
    base,
    "grade10_vocab",
    (d) => d.id,
    (data, id) => ({ name: String(data.name ?? id), questions: data.questions }),
  );
  cache.set(cacheKey, merged);
  return merged as Grade10VocabData;
}

export async function loadGrade10Grammar(): Promise<Grade10GrammarData> {
  const cacheKey = "g10:grammar";
  if (cache.has(cacheKey)) return cache.get(cacheKey) as Grade10GrammarData;
  const base = await fetchJSON<Grade10GrammarData>("/data/grade10_grammar.json");
  const merged = await mergeFromFirestore(
    base,
    "grade10_grammar",
    (d) => d.id,
    (data, id) => ({ name: String(data.name ?? id), exercises: data.exercises }),
  );
  cache.set(cacheKey, merged);
  return merged as Grade10GrammarData;
}

export async function loadGrade10Tests(): Promise<Record<string, unknown>> {
  const cacheKey = "g10:tests";
  if (cache.has(cacheKey)) return cache.get(cacheKey) as Record<string, unknown>;
  const base = await fetchJSON<Record<string, unknown>>("/data/grade10_tests.json");

  try {
    const col = collection(db, "exams", "grade10", "tests");
    const snap = await getDocs(col);
    const merged: Record<string, unknown> = { ...base };
    snap.forEach((d) => {
      const data = d.data();
      // Store Firestore-sourced exams under their doc id to avoid clobbering
      // "test1/test2/..." JSON keys.
      merged[d.id] = data;
    });
    cache.set(cacheKey, merged);
    return merged;
  } catch (e) {
    console.warn("Firestore exams fetch failed, using JSON only:", e);
    cache.set(cacheKey, base);
    return base;
  }
}

export async function loadGrade10Reading(): Promise<Record<string, unknown>> {
  return fetchJSON("/data/grade10_reading.json");
}

export async function loadGrade10Writing(): Promise<Grade10WritingData> {
  return fetchJSON<Grade10WritingData>("/data/grade10_writing.json");
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generic merge: take a base JSON object (keyed by topic id) and overlay
 * anything found in a Firestore collection. Firestore docs win when keys
 * collide.
 */
async function mergeFromFirestore<T extends Record<string, unknown>>(
  base: T,
  collectionPath: string,
  keyOf: (doc: { id: string }) => string,
  shape: (data: Record<string, unknown>, id: string) => unknown,
): Promise<T> {
  try {
    const parts = collectionPath.split("/").filter(Boolean);
    // Firestore requires an odd number of path segments for a collection.
    // Callers pass something like "grade10/vocab" (2 parts) or
    // "exams/grade10/tests" (3 parts). `collection()` is variadic.
    const col = collection(db, parts[0], ...parts.slice(1));
    const snap = await getDocs(col);
    if (snap.empty) return base;
    const merged = { ...base } as Record<string, unknown>;
    snap.forEach((d) => {
      merged[keyOf(d)] = shape(d.data(), d.id);
    });
    return merged as T;
  } catch (e) {
    console.warn(`Firestore merge failed for ${collectionPath}:`, e);
    return base;
  }
}

/** Clear the in-memory cache (useful after admin saves new content). */
export function clearContentCache() {
  cache.clear();
}

/** Peek at a single Firestore doc — used by admin preview / diff tools. */
export async function peekFirestoreDoc(
  path: string,
): Promise<Record<string, unknown> | null> {
  const ref = doc(db, path);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
}
