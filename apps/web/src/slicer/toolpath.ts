// Turn per-layer contours into printable toolpaths: concentric walls plus a
// rectilinear infill. Uses clipper-lib for polygon offsetting and clipping.
import ClipperLib from "clipper-lib";
import type { IntPoint } from "clipper-lib";
import type { Pt, Layer } from "./slice";

export interface ToolPath {
  type: "outer" | "inner" | "infill";
  closed: boolean;
  pts: Pt[];
}
export interface LayerPaths {
  z: number;
  paths: ToolPath[];
}
export interface SliceSettings {
  lineWidth: number; // mm
  layerHeight: number;
  firstLayerHeight: number;
  wallCount: number;
  infillDensity: number; // 0..1
}

const S = 1000; // integer scale for clipper (micron)

const toInt = (c: Pt[][]): IntPoint[][] =>
  c.map((poly) => poly.map((p) => ({ X: Math.round(p.x * S), Y: Math.round(p.y * S) })));
const toMm = (p: IntPoint[][]): Pt[][] =>
  p.map((poly) => poly.map((q) => ({ x: q.X / S, y: q.Y / S })));

function offset(region: IntPoint[][], deltaMm: number): IntPoint[][] {
  const co = new ClipperLib.ClipperOffset(2, 0.25 * S);
  co.AddPaths(region, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
  const sol: IntPoint[][] = [];
  co.Execute(sol, deltaMm * S);
  return sol;
}

function rotate(paths: IntPoint[][], a: number): IntPoint[][] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return paths.map((poly) =>
    poly.map((p) => ({ X: Math.round(p.X * c - p.Y * s), Y: Math.round(p.X * s + p.Y * c) })),
  );
}

function bounds(paths: IntPoint[][]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const poly of paths)
    for (const p of poly) {
      if (p.X < minX) minX = p.X;
      if (p.Y < minY) minY = p.Y;
      if (p.X > maxX) maxX = p.X;
      if (p.Y > maxY) maxY = p.Y;
    }
  return { minX, minY, maxX, maxY };
}

function infillLines(region: IntPoint[][], spacingMm: number, angleRad: number): IntPoint[][] {
  if (region.length === 0) return [];
  const rot = rotate(region, -angleRad);
  const bb = bounds(rot);
  const step = Math.max(1, Math.round(spacingMm * S));
  const lines: IntPoint[][] = [];
  for (let y = Math.ceil(bb.minY / step) * step; y <= bb.maxY; y += step) {
    lines.push([{ X: bb.minX - step, Y: y }, { X: bb.maxX + step, Y: y }]);
  }
  if (lines.length === 0) return [];
  const clip = new ClipperLib.Clipper();
  clip.AddPaths(lines, ClipperLib.PolyType.ptSubject, false);
  clip.AddPaths(rot, ClipperLib.PolyType.ptClip, true);
  const tree = new ClipperLib.PolyTree();
  clip.Execute(
    ClipperLib.ClipType.ctIntersection,
    tree,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftEvenOdd,
  );
  const open = ClipperLib.Clipper.OpenPathsFromPolyTree(tree);
  return rotate(open, angleRad);
}

export function layerToolpaths(
  contours: Pt[][],
  s: SliceSettings,
  layerIndex: number,
): ToolPath[] {
  const region0 = ClipperLib.Clipper.SimplifyPolygons(
    toInt(contours),
    ClipperLib.PolyFillType.pftEvenOdd,
  );
  const region = ClipperLib.Clipper.CleanPolygons(region0, 0.005 * S);
  const out: ToolPath[] = [];

  for (let k = 0; k < s.wallCount; k++) {
    const loops = offset(region, -s.lineWidth * (k + 0.5));
    for (const loop of toMm(loops)) {
      out.push({ type: k === 0 ? "outer" : "inner", closed: true, pts: loop });
    }
  }

  if (s.infillDensity > 0) {
    const innerRegion = s.wallCount > 0 ? offset(region, -s.lineWidth * s.wallCount) : region;
    const spacing = s.lineWidth / s.infillDensity;
    const angle = layerIndex % 2 === 0 ? Math.PI / 4 : -Math.PI / 4;
    for (const line of toMm(infillLines(innerRegion, spacing, angle))) {
      if (line.length >= 2) out.push({ type: "infill", closed: false, pts: line });
    }
  }
  return out;
}

export function planLayers(layers: Layer[], s: SliceSettings): LayerPaths[] {
  return layers.map((layer, i) => ({ z: layer.z, paths: layerToolpaths(layer.contours, s, i) }));
}
