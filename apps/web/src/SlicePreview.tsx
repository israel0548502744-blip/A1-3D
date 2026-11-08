import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { t } from "./i18n";
import type { SliceResult } from "./slicer/pipeline";
import type { MachineSettings } from "./slicer/estimate";
import type { LayerPaths } from "./slicer/toolpath";

const COL = {
  outer: new THREE.Color(0x1fc45e),
  inner: new THREE.Color(0x4a90d9),
  infill: new THREE.Color(0xe8912f),
};
const LEGEND = { outer: "#1fc45e", inner: "#4a90d9", infill: "#e8912f" };

function fmtTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h} ${t.hours} ${m} ${t.minutes}` : `${m} ${t.minutes}`;
}

/** Build a coloured LineSegments geometry for every toolpath, stacked by Z. */
function buildGeometry(layers: LayerPaths[]) {
  const pos: number[] = [];
  const col: number[] = [];
  const push = (x: number, y: number, z: number, c: THREE.Color) => {
    pos.push(x, y, z);
    col.push(c.r, c.g, c.b);
  };
  let zmax = 0;
  for (const layer of layers) {
    const z = layer.z;
    if (z > zmax) zmax = z;
    for (const p of layer.paths) {
      const c = COL[p.type];
      const pts = p.pts;
      for (let i = 1; i < pts.length; i++) {
        push(pts[i - 1].x, pts[i - 1].y, z, c);
        push(pts[i].x, pts[i].y, z, c);
      }
      if (p.closed && pts.length > 2) {
        push(pts[pts.length - 1].x, pts[pts.length - 1].y, z, c);
        push(pts[0].x, pts[0].y, z, c);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeBoundingBox();
  return { geometry: g, zmax };
}

export function SlicePreview(props: {
  result: SliceResult;
  layer: number;
  setLayer: (n: number) => void;
  settings: MachineSettings;
  setSettings: (s: MachineSettings) => void;
  onUpdate: () => void;
  onClose: () => void;
  busy: boolean;
}) {
  const { result, layer, setLayer, settings, setSettings } = props;
  const mountRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<THREE.Plane | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const linesRef = useRef<THREE.LineSegments | null>(null);

  // Create the three.js scene once.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.localClippingEnabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const css = getComputedStyle(document.documentElement);
    scene.background = new THREE.Color((css.getPropertyValue("--surface-2") || "#1e2225").trim());
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 5000);
    camera.up.set(0, 0, 1);
    camera.position.set(120, -140, 120);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1000);
    clipRef.current = plane;

    let raf = 0;
    const loop = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(mount);

    // expose for repositioning after geometry loads
    (scene.userData as { camera?: THREE.Camera; controls?: OrbitControls }).camera = camera;
    (scene.userData as { camera?: THREE.Camera; controls?: OrbitControls }).controls = controls;

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  // Rebuild lines whenever the slice result changes.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (linesRef.current) {
      scene.remove(linesRef.current);
      linesRef.current.geometry.dispose();
      (linesRef.current.material as THREE.Material).dispose();
    }
    const { geometry } = buildGeometry(result.layers);
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      clippingPlanes: clipRef.current ? [clipRef.current] : [],
    });
    const lines = new THREE.LineSegments(geometry, material);
    scene.add(lines);
    linesRef.current = lines;

    // frame the model
    const bb = geometry.boundingBox;
    const ud = scene.userData as { camera?: THREE.PerspectiveCamera; controls?: OrbitControls };
    if (bb && ud.camera && ud.controls) {
      const center = bb.getCenter(new THREE.Vector3());
      const radius = bb.getBoundingSphere(new THREE.Sphere()).radius || 50;
      ud.controls.target.copy(center);
      const dir = new THREE.Vector3(0.8, -1, 0.7).normalize();
      ud.camera.position.copy(center).addScaledVector(dir, radius * 2.4);
      ud.controls.update();
    }
  }, [result]);

  // Reveal layers up to the slider position via the clipping plane.
  useEffect(() => {
    const plane = clipRef.current;
    if (!plane) return;
    const lp = result.layers[Math.min(layer, result.layers.length - 1)];
    plane.constant = (lp ? lp.z : 1000) + result.settings.layerHeight;
  }, [layer, result]);

  const e = result.estimate;
  const maxLayer = Math.max(0, result.layers.length - 1);

  return (
    <div className="overlay">
      <div className="overlay-head">
        <div>
          <b>{t.slicePreview}</b> <span className="tag">{t.sliceExperimental}</span>
        </div>
        <button className="icon-btn" onClick={props.onClose} aria-label={t.close}>
          ✕
        </button>
      </div>

      <div className="overlay-body">
        <div ref={mountRef} className="slice-canvas" />

        <div className="legend">
          <span><i style={{ background: LEGEND.outer }} />{t.wallOuter}</span>
          <span><i style={{ background: LEGEND.inner }} />{t.wallInner}</span>
          <span><i style={{ background: LEGEND.infill }} />{t.infillLegend}</span>
        </div>

        <div className="field">
          <div className="lbl">
            <span>{t.layer}</span>
            <b>{layer + 1} {t.ofLayers} {result.layers.length}</b>
          </div>
          <input
            type="range"
            min={0}
            max={maxLayer}
            step={1}
            value={layer}
            onChange={(ev) => setLayer(parseInt(ev.target.value))}
          />
        </div>

        <div className="grid2">
          <Stat label={t.estTime} value={fmtTime(e.timeSec)} />
          <Stat label={t.estWeight} value={`${e.grams.toFixed(1)} ${t.grams}`} />
          <Stat label={t.estFilament} value={`${e.meters.toFixed(2)} ${t.meters}`} />
          <Stat label={t.estCost} value={`₪ ${e.cost.toFixed(2)}`} />
        </div>

        <div className="section">
          <h3>{t.sliceSettings}</h3>
          <div className="field">
            <div className="lbl"><span>{t.layerH}</span></div>
            <div className="grid3">
              {[0.12, 0.2, 0.28].map((lh) => (
                <button
                  key={lh}
                  className={`btn ghost ${settings.layerHeight === lh ? "active" : ""}`}
                  onClick={() => setSettings({ ...settings, layerHeight: lh, firstLayerHeight: lh })}
                >
                  {lh} mm
                </button>
              ))}
            </div>
          </div>
          <Slider
            label={t.infill}
            value={Math.round(settings.infillDensity * 100)}
            min={0}
            max={100}
            step={5}
            unit="%"
            onChange={(v) => setSettings({ ...settings, infillDensity: v / 100 })}
          />
          <Slider
            label={t.walls}
            value={settings.wallCount}
            min={1}
            max={5}
            step={1}
            onChange={(v) => setSettings({ ...settings, wallCount: v })}
          />
          <button className="btn block" disabled={props.busy} onClick={props.onUpdate}>
            {props.busy ? t.slicing : t.update}
          </button>
        </div>

        <p className="note">{t.sliceNote}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (n: number) => void;
}) {
  return (
    <div className="field">
      <div className="lbl">
        <span>{props.label}</span>
        <b>{props.value}{props.unit ?? ""}</b>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}
