import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

export interface LoadedModel {
  geometry: THREE.BufferGeometry;
  triangles: number;
}

/** Collect every mesh geometry inside an Object3D, baked into world space. */
function flatten(object: THREE.Object3D): THREE.BufferGeometry {
  const geoms: THREE.BufferGeometry[] = [];
  object.updateMatrixWorld(true);
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh && mesh.geometry) {
      const g = mesh.geometry.clone();
      g.applyMatrix4(mesh.matrixWorld);
      // Drop attributes that differ between parts so merging can't fail.
      const pruned = new THREE.BufferGeometry();
      pruned.setAttribute("position", g.getAttribute("position"));
      if (g.index) pruned.setIndex(g.index);
      geoms.push(pruned.toNonIndexed());
    }
  });
  if (geoms.length === 0) throw new Error("no-mesh");
  const merged = BufferGeometryUtils.mergeGeometries(geoms, false);
  if (!merged) throw new Error("merge-failed");
  return merged;
}

function finalize(geometry: THREE.BufferGeometry): LoadedModel {
  geometry.deleteAttribute("normal");
  geometry.deleteAttribute("uv");
  geometry.computeVertexNormals();
  const pos = geometry.getAttribute("position");
  return { geometry, triangles: Math.round(pos.count / 3) };
}

export async function loadModelFile(file: File): Promise<LoadedModel> {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  const buf = await file.arrayBuffer();

  if (ext === "stl") {
    const geo = new STLLoader().parse(buf);
    return finalize(geo.toNonIndexed());
  }
  if (ext === "obj") {
    const text = new TextDecoder().decode(buf);
    const group = new OBJLoader().parse(text);
    return finalize(flatten(group));
  }
  if (ext === "3mf") {
    const obj = new ThreeMFLoader().parse(buf);
    return finalize(flatten(obj));
  }
  if (ext === "step" || ext === "stp") {
    return loadStep(buf);
  }
  throw new Error("unsupported-format");
}

// STEP/IGES via the OpenCascade (occt-import-js) WASM engine, loaded lazily the
// first time a CAD file is opened so the ~8 MB module isn't in the main bundle.
async function loadStep(buf: ArrayBuffer): Promise<LoadedModel> {
  const occtimportjs = (await import("occt-import-js")).default;
  const wasmUrl = (await import("occt-import-js/dist/occt-import-js.wasm?url")).default;
  const occt = await occtimportjs({ locateFile: () => wasmUrl });
  const result = occt.ReadStepFile(new Uint8Array(buf), null);
  if (!result.success || !result.meshes || result.meshes.length === 0) {
    throw new Error("step-failed");
  }
  let vTotal = 0;
  let iTotal = 0;
  for (const m of result.meshes) {
    vTotal += m.attributes.position.array.length;
    iTotal += m.index.array.length;
  }
  const positions = new Float32Array(vTotal);
  const indices = new Uint32Array(iTotal);
  let vo = 0;
  let io = 0;
  let base = 0;
  for (const m of result.meshes) {
    const pa = m.attributes.position.array;
    positions.set(pa, vo);
    const ia = m.index.array;
    for (let i = 0; i < ia.length; i++) indices[io + i] = ia[i] + base;
    base += pa.length / 3;
    vo += pa.length;
    io += ia.length;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setIndex(new THREE.BufferAttribute(indices, 1));
  return finalize(g.toNonIndexed());
}
