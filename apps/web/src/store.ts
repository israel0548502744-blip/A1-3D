import { create } from "zustand";
import { DEFAULT_PRINTER_ID, getPrinter } from "./printers/catalog";

/** UI-facing snapshot of one model. The Viewer owns the real geometry. */
export interface ModelInfo {
  id: string;
  name: string;
  selected: boolean;
  outOfBounds: boolean;
  dims: { x: number; y: number; z: number }; // mm, after scale
  scalePct: number; // uniform scale shown in the panel
  rotDeg: { x: number; y: number; z: number };
  pos: { x: number; y: number }; // centre on bed, mm
  triangles: number;
}

export type Theme = "dark" | "light";
/** The user's appearance choice: follow the phone, or always dark / light. */
export type Look = "auto" | "dark" | "light";
export type Screen = "home" | "editor" | "printer" | "more";
export type EditorTab = "info" | "edit" | "cut" | "export";

export interface Bed {
  x: number;
  y: number;
  z: number;
}

export interface CutUi {
  h: number;
  min: number;
  max: number;
}

interface AppState {
  models: ModelInfo[];
  look: Look;
  theme: Theme; // resolved from look + system preference
  screen: Screen;
  editorTab: EditorTab;
  loading: boolean;
  error: string | null;
  cut: CutUi | null;
  printerId: string;
  /** False until the user picks a printer the first time (shows the picker). */
  printerChosen: boolean;
  /** User-edited build volumes, by printer id. */
  bedOverrides: Record<string, Bed>;
  setPrinter: (id: string) => void;
  setBedOverride: (id: string, bed: Bed | null) => void;
  setModels: (m: ModelInfo[]) => void;
  setLook: (l: Look) => void;
  setSystemDark: (dark: boolean) => void;
  setScreen: (s: Screen) => void;
  setEditorTab: (t: EditorTab) => void;
  setLoading: (b: boolean) => void;
  setError: (e: string | null) => void;
  setCut: (c: CutUi | null) => void;
}

const LOOK_KEY = "bcs.look";
const PRINTER_KEY = "bcs.printer";
const BEDS_KEY = "bcs.beds";

function readJson<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* not persisted; still applied for this session */
  }
}

function readLook(): Look {
  try {
    const v = localStorage.getItem(LOOK_KEY);
    if (v === "auto" || v === "dark" || v === "light") return v;
  } catch {
    /* storage unavailable: fall back to auto */
  }
  return "auto";
}

function systemDark(): boolean {
  return !(
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  );
}

const resolve = (look: Look, sysDark: boolean): Theme =>
  look === "auto" ? (sysDark ? "dark" : "light") : look;

const initialLook = readLook();
let sysDark = systemDark();

export const useStore = create<AppState>((set, get) => ({
  models: [],
  look: initialLook,
  theme: resolve(initialLook, sysDark),
  screen: "home",
  editorTab: "info",
  loading: false,
  error: null,
  cut: null,
  printerId: readJson<string | null>(PRINTER_KEY, null) ?? DEFAULT_PRINTER_ID,
  printerChosen: readJson<string | null>(PRINTER_KEY, null) !== null,
  bedOverrides: readJson<Record<string, Bed>>(BEDS_KEY, {}),
  setPrinter: (id) => {
    writeJson(PRINTER_KEY, id);
    set({ printerId: id, printerChosen: true });
  },
  setBedOverride: (id, bed) => {
    const next = { ...get().bedOverrides };
    if (bed) next[id] = bed;
    else delete next[id];
    writeJson(BEDS_KEY, next);
    set({ bedOverrides: next });
  },
  setModels: (models) => set({ models }),
  setLook: (look) => {
    try {
      localStorage.setItem(LOOK_KEY, look);
    } catch {
      /* not persisted; still applied for this session */
    }
    set({ look, theme: resolve(look, sysDark) });
  },
  setSystemDark: (dark) => {
    sysDark = dark;
    set({ theme: resolve(get().look, dark) });
  },
  setScreen: (screen) => set({ screen }),
  setEditorTab: (editorTab) => set({ editorTab }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCut: (cut) => set({ cut }),
}));

export const selectedModel = (s: AppState): ModelInfo | undefined =>
  s.models.find((m) => m.selected);

export const currentPrinter = (s: AppState) => getPrinter(s.printerId);
/** The build volume in use: the user's edit if any, else the catalog spec. */
export const currentBed = (s: AppState): Bed => s.bedOverrides[s.printerId] ?? getPrinter(s.printerId).bed;
