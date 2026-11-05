import { useEffect, useMemo, useRef } from "react";
import { t } from "./i18n";
import type { SliceResult } from "./slicer/pipeline";
import type { MachineSettings } from "./slicer/estimate";

const COL = { outer: "#1fc45e", inner: "#4a90d9", infill: "#e8912f" };

function fmtTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h} ${t.hours} ${m} ${t.minutes}` : `${m} ${t.minutes}`;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const lp of result.layers)
      for (const p of lp.paths)
        for (const pt of p.pts) {
          if (pt.x < minX) minX = pt.x;
          if (pt.y < minY) minY = pt.y;
          if (pt.x > maxX) maxX = pt.x;
          if (pt.y > maxY) maxY = pt.y;
        }
    if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
    return { minX, minY, maxX, maxY };
  }, [result]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = canvas.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(document.documentElement);
    ctx.fillStyle = css.getPropertyValue("--surface-2") || "#1e2225";
    ctx.fillRect(0, 0, size, size);

    const pad = 16;
    const w = bounds.maxX - bounds.minX || 1;
    const h = bounds.maxY - bounds.minY || 1;
    const scale = Math.min((size - 2 * pad) / w, (size - 2 * pad) / h);
    const ox = (size - w * scale) / 2;
    const oy = (size - h * scale) / 2;
    // print Y up -> canvas y down
    const X = (x: number) => ox + (x - bounds.minX) * scale;
    const Y = (y: number) => size - (oy + (y - bounds.minY) * scale);

    const lp = result.layers[Math.min(layer, result.layers.length - 1)];
    if (!lp) return;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = "round";
    for (const p of lp.paths) {
      if (p.pts.length < 2) continue;
      ctx.strokeStyle = COL[p.type];
      ctx.beginPath();
      ctx.moveTo(X(p.pts[0].x), Y(p.pts[0].y));
      for (let i = 1; i < p.pts.length; i++) ctx.lineTo(X(p.pts[i].x), Y(p.pts[i].y));
      if (p.closed) ctx.closePath();
      ctx.stroke();
    }
  }, [result, layer, bounds]);

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
        <canvas ref={canvasRef} className="slice-canvas" />

        <div className="legend">
          <span><i style={{ background: COL.outer }} />{t.wallOuter}</span>
          <span><i style={{ background: COL.inner }} />{t.wallInner}</span>
          <span><i style={{ background: COL.infill }} />{t.infillLegend}</span>
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
