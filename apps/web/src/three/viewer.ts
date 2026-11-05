import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { loadModelFile } from "./loaders";
import { cutByZ } from "./cut";
import type { ModelInfo, Theme } from "../store";

export interface CutState {
  h: number;
  min: number;
  max: number;
}

export const BED = 256;
const HALF = BED / 2;
const HEIGHT = 256;

interface Entry {
  id: string;
  name: string;
  mesh: THREE.Mesh;
  scalePct: number;
}

const PALETTE = {
  dark: { bg: 0x0e1012, bed: 0x171a1d, grid: 0x2a2f35, model: 0x4a90d9, bad: 0xe05260 },
  light: { bg: 0xf6f7f9, bed: 0xe9edf2, grid: 0xb9c0ca, model: 0x2f6fbf, bad: 0xd23140 },
};

/** Owns the three.js scene. React drives it; it pushes ModelInfo[] back out. */
export class Viewer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private entries: Entry[] = [];
  private selectedId: string | null = null;
  private theme: Theme = "dark";
  private bedGroup = new THREE.Group();
  private onChange: (m: ModelInfo[]) => void;
  private onCut: (c: CutState | null) => void;
  private cut: { id: string; h: number; min: number; max: number; plane: THREE.Mesh } | null = null;
  private seq = 0;
  private raf = 0;

  constructor(
    container: HTMLElement,
    onChange: (m: ModelInfo[]) => void,
    onCut: (c: CutState | null) => void = () => {},
  ) {
    this.onChange = onChange;
    this.onCut = onCut;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      1,
      5000,
    );
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(360, -360, 300);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 60);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.maxDistance = 1600;
    this.controls.minDistance = 60;

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.1));
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(200, -150, 400);
    this.scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.5);
    dir2.position.set(-200, 200, 200);
    this.scene.add(dir2);

    this.scene.add(this.bedGroup);
    this.buildBed();
    this.applyTheme(this.theme);

    this.renderer.domElement.addEventListener("pointerdown", this.onPointerDown);
    this.loop();
  }

  private buildBed() {
    this.bedGroup.clear();
    const p = PALETTE[this.theme];

    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(BED, BED),
      new THREE.MeshStandardMaterial({ color: p.bed, roughness: 0.95, metalness: 0 }),
    );
    plate.name = "plate";
    this.bedGroup.add(plate);

    const grid = new THREE.GridHelper(BED, 32, p.grid, p.grid);
    grid.rotation.x = Math.PI / 2; // GridHelper is XZ by default; put it on XY
    grid.position.z = 0.1;
    (grid.material as THREE.Material).opacity = 0.5;
    (grid.material as THREE.Material).transparent = true;
    this.bedGroup.add(grid);

    const box = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(BED, BED, HEIGHT)),
      new THREE.LineBasicMaterial({ color: p.grid, transparent: true, opacity: 0.35 }),
    );
    box.position.set(0, 0, HEIGHT / 2);
    this.bedGroup.add(box);

    // Front-left corner marker = bed origin, to orient the user.
    const origin = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ae42 }),
    );
    origin.position.set(-HALF, -HALF, 0);
    this.bedGroup.add(origin);
  }

  applyTheme(theme: Theme) {
    this.theme = theme;
    this.scene.background = new THREE.Color(PALETTE[theme].bg);
    this.buildBed();
    this.refreshMaterials();
  }

  async load(file: File) {
    const { geometry, triangles } = await loadModelFile(file);
    // Centre footprint on origin and drop onto the bed (minZ = 0).
    geometry.computeBoundingBox();
    const bb = geometry.boundingBox!;
    const cx = (bb.min.x + bb.max.x) / 2;
    const cy = (bb.min.y + bb.max.y) / 2;
    geometry.translate(-cx, -cy, -bb.min.z);

    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05 }),
    );
    mesh.userData.triangles = triangles;
    const id = `m${++this.seq}`;
    const entry: Entry = { id, name: file.name.replace(/\.[^.]+$/, ""), mesh, scalePct: 100 };
    this.entries.push(entry);
    this.scene.add(mesh);
    this.selectedId = id;
    if (this.entries.length === 1) this.centerOnBed(id);
    else this.autoArrange();
    this.fitView();
    this.emit();
  }

  private onPointerDown = (e: PointerEvent) => {
    if (this.cut) return; // don't change selection mid-cut
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.entries.map((x) => x.mesh), false);
    if (hits.length > 0) {
      const mesh = hits[0].object as THREE.Mesh;
      const hit = this.entries.find((x) => x.mesh === mesh);
      if (hit) {
        this.selectedId = hit.id;
        this.emit();
      }
    }
  };

  select(id: string) {
    this.selectedId = id;
    this.emit();
  }

  remove(id: string) {
    const i = this.entries.findIndex((x) => x.id === id);
    if (i < 0) return;
    const [e] = this.entries.splice(i, 1);
    this.scene.remove(e.mesh);
    e.mesh.geometry.dispose();
    (e.mesh.material as THREE.Material).dispose();
    if (this.selectedId === id) this.selectedId = this.entries[0]?.id ?? null;
    this.emit();
  }

  duplicate(id: string) {
    const e = this.entries.find((x) => x.id === id);
    if (!e) return;
    const mesh = e.mesh.clone();
    mesh.geometry = e.mesh.geometry.clone();
    mesh.material = (e.mesh.material as THREE.Material).clone();
    const nid = `m${++this.seq}`;
    this.entries.push({ id: nid, name: `${e.name}-copy`, mesh, scalePct: e.scalePct });
    this.scene.add(mesh);
    this.selectedId = nid;
    this.autoArrange();
    this.emit();
  }

  setPosition(id: string, x: number, y: number) {
    const e = this.entries.find((v) => v.id === id);
    if (!e) return;
    e.mesh.position.x = x;
    e.mesh.position.y = y;
    this.emit();
  }

  setRotationDeg(id: string, axis: "x" | "y" | "z", deg: number) {
    const e = this.entries.find((v) => v.id === id);
    if (!e) return;
    e.mesh.rotation[axis] = THREE.MathUtils.degToRad(deg);
    this.dropToBed(id, false);
    this.emit();
  }

  rotate90(id: string, axis: "x" | "y" | "z") {
    const e = this.entries.find((v) => v.id === id);
    if (!e) return;
    e.mesh.rotation[axis] += Math.PI / 2;
    this.dropToBed(id, false);
    this.emit();
  }

  resetRotation(id: string) {
    const e = this.entries.find((v) => v.id === id);
    if (!e) return;
    e.mesh.rotation.set(0, 0, 0);
    this.dropToBed(id, false);
    this.emit();
  }

  setUniformScalePct(id: string, pct: number) {
    const e = this.entries.find((v) => v.id === id);
    if (!e || pct <= 0) return;
    const s = pct / 100;
    e.mesh.scale.set(s, s, s);
    e.scalePct = pct;
    this.dropToBed(id, false);
    this.emit();
  }

  /** Set one world dimension in mm, keeping proportions if asked. */
  setSizeMm(id: string, axis: "x" | "y" | "z", mm: number, lock: boolean) {
    const e = this.entries.find((v) => v.id === id);
    if (!e || mm <= 0) return;
    const base = this.localSize(e.mesh)[axis]; // size at scale 1
    if (base <= 0) return;
    const target = mm / base;
    if (lock) {
      e.mesh.scale.set(target, target, target);
      e.scalePct = Math.round(target * 100);
    } else {
      e.mesh.scale[axis] = target;
    }
    this.dropToBed(id, false);
    this.emit();
  }

  mirror(id: string, axis: "x" | "y" | "z") {
    const e = this.entries.find((v) => v.id === id);
    if (!e) return;
    e.mesh.scale[axis] *= -1;
    this.dropToBed(id, false);
    this.emit();
  }

  dropToBed(id: string, emit = true) {
    const e = this.entries.find((v) => v.id === id);
    if (!e) return;
    const bb = new THREE.Box3().setFromObject(e.mesh);
    e.mesh.position.z -= bb.min.z; // sit exactly on z=0
    if (emit) this.emit();
  }

  centerOnBed(id: string) {
    const e = this.entries.find((v) => v.id === id);
    if (!e) return;
    const bb = new THREE.Box3().setFromObject(e.mesh);
    const cx = (bb.min.x + bb.max.x) / 2;
    const cy = (bb.min.y + bb.max.y) / 2;
    e.mesh.position.x -= cx;
    e.mesh.position.y -= cy;
    this.emit();
  }

  /** Simple shelf packing by footprint, centred on the bed. */
  autoArrange() {
    const gap = 6;
    const items = this.entries.map((e) => {
      const s = new THREE.Box3().setFromObject(e.mesh).getSize(new THREE.Vector3());
      return { e, w: s.x, d: s.y };
    });
    items.sort((a, b) => b.d - a.d);
    let x = -HALF + gap;
    let y = -HALF + gap;
    let rowDepth = 0;
    for (const it of items) {
      if (x + it.w > HALF - gap) {
        x = -HALF + gap;
        y += rowDepth + gap;
        rowDepth = 0;
      }
      // place: object centre so its min corner is at (x,y)
      const bb = new THREE.Box3().setFromObject(it.e.mesh);
      const cx = (bb.min.x + bb.max.x) / 2;
      const cy = (bb.min.y + bb.max.y) / 2;
      it.e.mesh.position.x += x + it.w / 2 - cx;
      it.e.mesh.position.y += y + it.d / 2 - cy;
      x += it.w + gap;
      rowDepth = Math.max(rowDepth, it.d);
    }
    // Centre the whole packed block on the bed, so it isn't stuck in a corner.
    if (this.entries.length > 0) {
      const all = new THREE.Box3();
      this.entries.forEach((e) => all.expandByObject(e.mesh));
      const c = all.getCenter(new THREE.Vector3());
      this.entries.forEach((e) => {
        e.mesh.position.x -= c.x;
        e.mesh.position.y -= c.y;
      });
    }
    this.emit();
  }

  fitView() {
    // Always frame the whole bed plus any models, so the plate is visible and
    // the content sits in the upper part of the screen (above the bottom sheet).
    const box = new THREE.Box3(
      new THREE.Vector3(-HALF, -HALF, 0),
      new THREE.Vector3(HALF, HALF, 0),
    );
    this.entries.forEach((e) => box.expandByObject(e.mesh));
    const center = box.getCenter(new THREE.Vector3());
    const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
    // Aim a bit below the real centre so the model rises above the sheet.
    this.controls.target.set(center.x, center.y, -radius * 0.25);
    const dir = new THREE.Vector3(0.75, -1, 0.65).normalize();
    this.camera.position.copy(this.controls.target).addScaledVector(dir, radius * 2.2);
    this.controls.update();
  }

  // ---- Cut mode (split a model by a horizontal plane) ----

  enterCutMode(id: string) {
    const e = this.entries.find((v) => v.id === id);
    if (!e) return;
    this.selectedId = id;
    const bb = new THREE.Box3().setFromObject(e.mesh);
    const min = bb.min.z;
    const max = bb.max.z;
    const h = (min + max) / 2;
    const footprint = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y) * 1.3 + 10;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(footprint, footprint),
      new THREE.MeshBasicMaterial({
        color: 0x1fc45e,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    const c = bb.getCenter(new THREE.Vector3());
    plane.position.set(c.x, c.y, h);
    this.scene.add(plane);
    this.cut = { id, h, min, max, plane };
    this.onCut({ h, min, max });
    this.emit();
  }

  setCutHeight(h: number) {
    if (!this.cut) return;
    this.cut.h = h;
    this.cut.plane.position.z = h;
    this.onCut({ h, min: this.cut.min, max: this.cut.max });
  }

  cancelCut() {
    if (!this.cut) return;
    this.scene.remove(this.cut.plane);
    this.cut.plane.geometry.dispose();
    (this.cut.plane.material as THREE.Material).dispose();
    this.cut = null;
    this.onCut(null);
  }

  /** Perform the real boolean cut. Returns the number of resulting parts. */
  async applyCut(): Promise<number> {
    if (!this.cut) return 0;
    const entry = this.entries.find((v) => v.id === this.cut!.id);
    if (!entry) {
      this.cancelCut();
      return 0;
    }
    const h = this.cut.h;
    entry.mesh.updateMatrixWorld(true);
    const world = entry.mesh.geometry.clone();
    world.applyMatrix4(entry.mesh.matrixWorld);

    const { lower, upper } = await cutByZ(world, h);
    world.dispose();

    const parts = [lower, upper].filter((g): g is THREE.BufferGeometry => g !== null);
    if (parts.length < 2) {
      // Plane missed the body — nothing to split. Leave the model untouched.
      throw new Error("no-split");
    }

    const baseName = entry.name;
    this.cancelCut();
    this.remove(entry.id);

    let firstId: string | null = null;
    parts.forEach((geo, i) => {
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05 }),
      );
      geo.computeBoundingBox();
      mesh.userData.triangles = geo.index
        ? geo.index.count / 3
        : Math.round(geo.getAttribute("position").count / 3);
      const id = `m${++this.seq}`;
      if (!firstId) firstId = id;
      this.entries.push({ id, name: `${baseName}-${i === 0 ? "A" : "B"}`, mesh, scalePct: 100 });
      this.scene.add(mesh);
      this.dropToBed(id, false);
    });
    this.selectedId = firstId;
    this.autoArrange();
    this.fitView();
    this.emit();
    return parts.length;
  }

  exportSTL(): Blob {
    const group = new THREE.Group();
    this.entries.forEach((e) => group.add(e.mesh.clone()));
    const data = new STLExporter().parse(group, { binary: true }) as unknown as DataView;
    return new Blob([data], { type: "model/stl" });
  }

  private localSize(mesh: THREE.Mesh): { x: number; y: number; z: number } {
    mesh.geometry.computeBoundingBox();
    const b = mesh.geometry.boundingBox!;
    return { x: b.max.x - b.min.x, y: b.max.y - b.min.y, z: b.max.z - b.min.z };
  }

  private isOutOfBounds(mesh: THREE.Mesh): boolean {
    const bb = new THREE.Box3().setFromObject(mesh);
    const eps = 0.01;
    return (
      bb.min.x < -HALF - eps ||
      bb.max.x > HALF + eps ||
      bb.min.y < -HALF - eps ||
      bb.max.y > HALF + eps ||
      bb.max.z > HEIGHT + eps ||
      bb.min.z < -eps
    );
  }

  private refreshMaterials() {
    const p = PALETTE[this.theme];
    for (const e of this.entries) {
      const mat = e.mesh.material as THREE.MeshStandardMaterial;
      const bad = this.isOutOfBounds(e.mesh);
      mat.color.setHex(bad ? p.bad : p.model);
      mat.emissive.setHex(e.id === this.selectedId ? 0x222a33 : 0x000000);
      mat.needsUpdate = true;
    }
  }

  private emit() {
    this.refreshMaterials();
    const infos: ModelInfo[] = this.entries.map((e) => {
      const bb = new THREE.Box3().setFromObject(e.mesh);
      const size = bb.getSize(new THREE.Vector3());
      return {
        id: e.id,
        name: e.name,
        selected: e.id === this.selectedId,
        outOfBounds: this.isOutOfBounds(e.mesh),
        dims: { x: round(size.x), y: round(size.y), z: round(size.z) },
        scalePct: e.scalePct,
        rotDeg: {
          x: round(THREE.MathUtils.radToDeg(e.mesh.rotation.x)),
          y: round(THREE.MathUtils.radToDeg(e.mesh.rotation.y)),
          z: round(THREE.MathUtils.radToDeg(e.mesh.rotation.z)),
        },
        pos: { x: round(e.mesh.position.x), y: round(e.mesh.position.y) },
        triangles: (e.mesh.userData.triangles as number) ?? 0,
      };
    });
    this.onChange(infos);
  }

  /** World-space triangle positions (non-indexed) of one model, for slicing. */
  worldPositions(id: string): Float32Array | null {
    const e = this.entries.find((v) => v.id === id);
    if (!e) return null;
    e.mesh.updateMatrixWorld(true);
    const g = e.mesh.geometry.clone();
    g.applyMatrix4(e.mesh.matrixWorld);
    const ni = g.index ? g.toNonIndexed() : g;
    const arr = new Float32Array(ni.getAttribute("position").array);
    g.dispose();
    if (ni !== g) ni.dispose();
    return arr;
  }

  /** Test/debug helper: world-space size of each model, in mm. */
  debugBounds(): { id: string; name: string; size: [number, number, number] }[] {
    return this.entries.map((e) => {
      const s = new THREE.Box3().setFromObject(e.mesh).getSize(new THREE.Vector3());
      return { id: e.id, name: e.name, size: [round(s.x), round(s.y), round(s.z)] };
    });
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private loop = () => {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    this.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

const round = (n: number) => Math.round(n * 10) / 10;
