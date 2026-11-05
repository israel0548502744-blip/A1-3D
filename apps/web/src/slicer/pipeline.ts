import { sliceMesh } from "./slice";
import { planLayers, type LayerPaths } from "./toolpath";
import { estimate, type MachineSettings, type Estimate } from "./estimate";

export interface SliceResult {
  layers: LayerPaths[];
  estimate: Estimate;
  settings: MachineSettings;
}

/** Full slice: world-space triangle soup -> toolpaths + estimates. */
export function runSlicer(positions: Float32Array, s: MachineSettings): SliceResult {
  const raw = sliceMesh(positions, { layerHeight: s.layerHeight, firstLayerHeight: s.firstLayerHeight });
  const layers = planLayers(raw, s);
  return { layers, estimate: estimate(layers, s), settings: s };
}
