// Tiny local store: all data saved in the browser (localStorage), single user, works offline.
import { useSyncExternalStore } from "react";
import type { AppData, Collection, Settings } from "./types";
import { makeDemoData } from "./demo";

const KEY = "student360:data:v2";

export const defaultSettings: Settings = {
  target: 75,
  gradeScale: [
    { grade: "O", min: 90, points: 10 },
    { grade: "A+", min: 80, points: 9 },
    { grade: "A", min: 70, points: 8 },
    { grade: "B+", min: 60, points: 7 },
    { grade: "B", min: 50, points: 6 },
    { grade: "C", min: 45, points: 5 },
    { grade: "P", min: 40, points: 4 },
    { grade: "F", min: 0, points: 0 },
  ],
  internalWeight: 40,
  endWeight: 60,
  semesters: ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"],
  budget: 6000,
  focusMin: 25,
  breakMin: 5,
  weeklyGoal: 12,
  theme: "light",
};

export const emptyData = (): AppData => ({
  subjects: [], slots: [], records: [], marks: [], tests: [], exams: [],
  assignments: [], study: [], expenses: [], events: [], settings: { ...defaultSettings },
});

const SERVER = emptyData();
let state: AppData = SERVER;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...emptyData(), ...parsed, settings: { ...defaultSettings, ...parsed.settings } };
    } else {
  state = emptyData(); // first run: start with nothing
  persist();
}
  } catch {
    state = emptyData();
  }
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full */ }
}
function set(next: AppData) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const store = {
  get: () => { load(); return state; },
  upsert<C extends Collection>(c: C, item: AppData[C][number]) {
    const list = state[c] as { id: string }[];
    const exists = list.some((x) => x.id === (item as { id: string }).id);
    const next = exists ? list.map((x) => (x.id === (item as { id: string }).id ? item : x)) : [...list, item];
    set({ ...state, [c]: next });
  },
  remove(c: Collection, id: string) {
    set({ ...state, [c]: (state[c] as { id: string }[]).filter((x) => x.id !== id) });
  },
  replace(c: Collection, list: unknown[]) { set({ ...state, [c]: list }); },
  setSettings(p: Partial<Settings>) { set({ ...state, settings: { ...state.settings, ...p } }); },
  importAll(d: AppData) { set({ ...emptyData(), ...d, settings: { ...defaultSettings, ...d.settings } }); },
  reset() { set({ ...emptyData(), settings: state.settings }); },
  loadDemo() { set(makeDemoData(state.settings)); },
};

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** React hook: returns the whole data object and re-renders on change. */
export function useData(): AppData {
  return useSyncExternalStore(subscribe, store.get, () => SERVER);
}
