import type { SGKData, Grade10VocabData, Grade10GrammarData } from "./types";

const cache = new Map<string, unknown>();

async function fetchJSON<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  const data = await res.json();
  cache.set(path, data);
  return data as T;
}

export async function loadSGKData(grade: number): Promise<SGKData> {
  return fetchJSON<SGKData>(`/data/sgk_eng${grade}_data.json`);
}

export async function loadGrade10Vocab(): Promise<Grade10VocabData> {
  return fetchJSON<Grade10VocabData>("/data/grade10_vocab.json");
}

export async function loadGrade10Grammar(): Promise<Grade10GrammarData> {
  return fetchJSON<Grade10GrammarData>("/data/grade10_grammar.json");
}

export async function loadGrade10Tests(): Promise<Record<string, unknown>> {
  return fetchJSON("/data/grade10_tests.json");
}

export async function loadGrade10Reading(): Promise<Record<string, unknown>> {
  return fetchJSON("/data/grade10_reading.json");
}

export async function loadGrade10Writing(): Promise<Record<string, unknown>> {
  return fetchJSON("/data/grade10_writing.json");
}
