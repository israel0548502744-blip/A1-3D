// Material and time estimates from real toolpath lengths.
import type { LayerPaths } from "./toolpath";
import type { SliceSettings } from "./toolpath";

export interface MachineSettings extends SliceSettings {
  filamentDiameter: number; // mm
  density: number; // g/cm^3
  printSpeed: number; // mm/s
  firstLayerSpeed: number;
  travelSpeed: number;
  pricePerKg: number; // currency per kg
}

export interface Estimate {
  grams: number;
  meters: number; // filament length
  cm3: number;
  timeSec: number;
  cost: number;
}

const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay);

export function estimate(layers: LayerPaths[], s: MachineSettings): Estimate {
  let extrudeLen = 0; // mm of toolpath that extrudes
  let travelLen = 0;
  let timeSec = 0;

  layers.forEach((layer, i) => {
    const speed = i === 0 ? s.firstLayerSpeed : s.printSpeed;
    let lastX = 0;
    let lastY = 0;
    let have = false;
    let layerExtrude = 0;
    for (const p of layer.paths) {
      if (p.pts.length < 2) continue;
      const first = p.pts[0];
      if (have) travelLen += dist(lastX, lastY, first.x, first.y);
      let len = 0;
      for (let k = 1; k < p.pts.length; k++) len += dist(p.pts[k - 1].x, p.pts[k - 1].y, p.pts[k].x, p.pts[k].y);
      if (p.closed && p.pts.length > 2) len += dist(p.pts[p.pts.length - 1].x, p.pts[p.pts.length - 1].y, first.x, first.y);
      layerExtrude += len;
      const last = p.pts[p.pts.length - 1];
      lastX = p.closed ? first.x : last.x;
      lastY = p.closed ? first.y : last.y;
      have = true;
    }
    extrudeLen += layerExtrude;
    timeSec += layerExtrude / speed;
  });
  timeSec += travelLen / s.travelSpeed;

  // Volume of extruded plastic ≈ path length × line cross-section.
  const cross = s.lineWidth * s.layerHeight; // mm^2
  const volMm3 = extrudeLen * cross;
  const cm3 = volMm3 / 1000;
  const grams = cm3 * s.density;
  const filArea = Math.PI * (s.filamentDiameter / 2) ** 2;
  const meters = volMm3 / filArea / 1000;
  const cost = (grams / 1000) * s.pricePerKg;

  return { grams, meters, cm3, timeSec, cost };
}

export const A1_DEFAULTS: MachineSettings = {
  layerHeight: 0.2,
  firstLayerHeight: 0.2,
  lineWidth: 0.42,
  wallCount: 2,
  infillDensity: 0.15,
  filamentDiameter: 1.75,
  density: 1.24, // PLA
  printSpeed: 150,
  firstLayerSpeed: 50,
  travelSpeed: 250,
  pricePerKg: 100, // ₪
};
