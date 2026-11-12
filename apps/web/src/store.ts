import { create } from "zustand";

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
