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
export type GizmoMode = "translate" | "rotate" | "scale";

export interface CutUi {
  h: number;
  min: number;
  max: number;
}

interface AppState {
  models: ModelInfo[];
  theme: Theme;
  gizmo: GizmoMode;
  loading: boolean;
  error: string | null;
  cut: CutUi | null;
  setModels: (m: ModelInfo[]) => void;
  setTheme: (t: Theme) => void;
  setGizmo: (g: GizmoMode) => void;
  setLoading: (b: boolean) => void;
  setError: (e: string | null) => void;
  setCut: (c: CutUi | null) => void;
}

const initialTheme: Theme =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";

export const useStore = create<AppState>((set) => ({
  models: [],
  theme: initialTheme,
  gizmo: "translate",
  loading: false,
  error: null,
  cut: null,
  setModels: (models) => set({ models }),
  setTheme: (theme) => set({ theme }),
  setGizmo: (gizmo) => set({ gizmo }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCut: (cut) => set({ cut }),
}));

export const selectedModel = (s: AppState): ModelInfo | undefined =>
  s.models.find((m) => m.selected);
