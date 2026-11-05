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
  throw new Error("unsupported-format");
}
