import * as THREE from "three";
import Module from "manifold-3d";
import wasmUrl from "manifold-3d/manifold.wasm?url";
import type { ManifoldToplevel } from "manifold-3d";

// Real mesh boolean via the manifold-3d WASM engine (Apache-2.0). Loaded lazily
// the first time the user cuts something.
let instance: ManifoldToplevel | null = null;
async function getManifold(): Promise<ManifoldToplevel> {
  if (!instance) {
    const wasm = await Module({ locateFile: () => wasmUrl });
    wasm.setup();
    instance = wasm;
  }
  return instance;
}

function toManifold(wasm: ManifoldToplevel, geom: THREE.BufferGeometry) {
  const src = geom.index ? geom.toNonIndexed() : geom;
  const pos = src.getAttribute("position").array as Float32Array;
  const triVerts = new Uint32Array(pos.length / 3);
  for (let i = 0; i < triVerts.length; i++) triVerts[i] = i;
  const mesh = new wasm.Mesh({
    numProp: 3,
    vertProperties: new Float32Array(pos),
    triVerts,
  });
  mesh.merge(); // weld coincident vertices so the solid is watertight
  return new wasm.Manifold(mesh);
}

function toGeometry(mesh: {
  numProp: number;
  vertProperties: Float32Array;
  triVerts: Uint32Array;
}): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const stride = mesh.numProp;
  let positions: Float32Array;
  if (stride === 3) {
    positions = new Float32Array(mesh.vertProperties);
  } else {
    const n = mesh.vertProperties.length / stride;
    positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      positions[i * 3] = mesh.vertProperties[i * stride];
      positions[i * 3 + 1] = mesh.vertProperties[i * stride + 1];
      positions[i * 3 + 2] = mesh.vertProperties[i * stride + 2];
    }
  }
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(mesh.triVerts), 1));
  g.computeVertexNormals();
  return g;
}

export interface CutResult {
  lower: THREE.BufferGeometry | null; // z <= height
  upper: THREE.BufferGeometry | null; // z >= height
}

/**
 * Cut a (world-space) geometry by the horizontal plane z = height.
 * Returns two capped solids. Throws "not-watertight" if the engine can't
 * build a valid solid from the mesh.
 */
export async function cutByZ(geomWorld: THREE.BufferGeometry, height: number): Promise<CutResult> {
  const wasm = await getManifold();
  const solid = toManifold(wasm, geomWorld);
  try {
    if (solid.isEmpty()) throw new Error("not-watertight");
    const lowerM = solid.trimByPlane([0, 0, -1], -height);
    const upperM = solid.trimByPlane([0, 0, 1], height);
    const lower = lowerM.isEmpty() ? null : toGeometry(lowerM.getMesh());
    const upper = upperM.isEmpty() ? null : toGeometry(upperM.getMesh());
    lowerM.delete();
    upperM.delete();
    return { lower, upper };
  } finally {
    solid.delete();
  }
}
