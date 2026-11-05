import { useEffect, useRef, useState } from "react";
import { Viewer, BED } from "./three/viewer";
import { useStore, selectedModel } from "./store";
import { t } from "./i18n";
import { runSlicer, type SliceResult } from "./slicer/pipeline";
import { A1_DEFAULTS, type MachineSettings } from "./slicer/estimate";
import { SlicePreview } from "./SlicePreview";

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { models, theme, loading, error, cut, setModels, setTheme, setLoading, setError, setCut } =
    useStore();
  const sel = useStore(selectedModel);
  const [lock, setLock] = useState(true);
  const [cutting, setCutting] = useState(false);
  const slicePos = useRef<Float32Array | null>(null);
  const [sliceResult, setSliceResult] = useState<SliceResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sliceSettings, setSliceSettings] = useState<MachineSettings>(A1_DEFAULTS);
  const [layer, setLayer] = useState(0);
  const [slicing, setSlicing] = useState(false);

  // Create the viewer once.
  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = new Viewer(containerRef.current, setModels, setCut);
    viewerRef.current = viewer;
    (window as unknown as { __viewer?: Viewer }).__viewer = viewer; // for E2E checks
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      viewer.resize(r.width, r.height);
    });
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      viewer.dispose();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme → <html data-theme> + viewer.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    viewerRef.current?.applyTheme(theme);
  }, [theme]);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setLoading(true);
    try {
      for (const f of Array.from(files)) {
        await viewerRef.current?.load(f);
      }
    } catch (e) {
      console.error(e);
      setError(t.loadError);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function applyCut() {
    setError(null);
    setCutting(true);
    try {
      await viewerRef.current?.applyCut();
    } catch (e) {
      const msg = e instanceof Error && e.message === "no-split" ? t.cutNoSplit : t.cutError;
      viewerRef.current?.cancelCut();
      setError(msg);
    } finally {
      setCutting(false);
    }
  }

  async function runSlice(settings: MachineSettings, usePos: Float32Array | null) {
    if (!sel || !viewerRef.current) return;
    const pos = usePos ?? viewerRef.current.worldPositions(sel.id);
    if (!pos || pos.length === 0) {
      setError(t.sliceErr);
      return;
    }
    slicePos.current = pos;
    setSlicing(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 20)); // let the spinner paint
    try {
      const res = runSlicer(pos, settings);
      if (res.layers.length === 0) {
        setError(t.sliceErr);
      } else {
        setSliceResult(res);
        setLayer(Math.floor(res.layers.length / 2));
        setPreviewOpen(true);
      }
    } catch (err) {
      console.error(err);
      setError(t.sliceErr);
    } finally {
      setSlicing(false);
    }
  }

  async function exportStl() {
    const blob = viewerRef.current?.exportSTL();
    if (!blob) return;
    const name = (sel?.name ?? "scene") + ".stl";
    // Inside the Android APK there is no browser download; hand bytes to native.
    const bridge = (window as unknown as {
      AndroidBridge?: { saveBase64: (n: string, b: string, m: string) => void };
    }).AndroidBridge;
    if (bridge?.saveBase64) {
      bridge.saveBase64(name, await blobToBase64(blob), "model/stl");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  const v = viewerRef.current;

  return (
    <div className="app">
      <div className="canvas-wrap" ref={containerRef} />

      <div className="topbar">
        <div className="brand">
          <b>{t.appName}</b>
          <span>{t.tagline}</span>
        </div>
        <div className="spacer" />
        <button
          className="icon-btn"
          aria-label={t.theme}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <button className="icon-btn" aria-label={t.fitView} onClick={() => v?.fitView()}>
          ⤢
        </button>
      </div>

      <div className="badge-bed">{t.bed}</div>

      <input
        ref={fileRef}
        type="file"
        accept=".stl,.3mf,.obj,.step,.stp,model/stl,model/3mf,model/step"
        multiple
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />

      <div className="sheet">
        <div className="sheet-grip" />
        <div className="sheet-body">
          {models.length === 0 ? (
            <div className="empty">
              <button className="btn" onClick={() => fileRef.current?.click()}>
                ＋ {t.openModel}
              </button>
              <p>{t.empty}</p>
              <span className="soon">
                <span className="tag">{t.openHint}</span>
              </span>
            </div>
          ) : (
            <>
              <div className="chips">
                {models.map((m) => (
                  <button
                    key={m.id}
                    className={`chip ${m.selected ? "sel" : ""} ${m.outOfBounds ? "bad" : ""}`}
                    onClick={() => v?.select(m.id)}
                  >
                    <b>{m.name}</b>
                  </button>
                ))}
                <button className="chip" onClick={() => fileRef.current?.click()}>
                  ＋
                </button>
              </div>

              {sel && v && (
                <>
                  <div className="section">
                    <h3>{t.dims}</h3>
                    <div className="grid3">
                      <Stat label={t.axisX} value={`${sel.dims.x}`} unit="mm" />
                      <Stat label={t.axisY} value={`${sel.dims.y}`} unit="mm" />
                      <Stat label={t.axisZ} value={`${sel.dims.z}`} unit="mm" />
                    </div>
                    <div className="grid2" style={{ marginTop: 8 }}>
                      <Stat label={t.triangles} value={sel.triangles.toLocaleString("he-IL")} />
                      <Stat label={t.uniformScale} value={`${sel.scalePct}`} unit="%" />
                    </div>
                    {sel.outOfBounds && <div className="warn">⚠ {t.outOfBounds}</div>}
                  </div>

                  <div className="section">
                    <h3>{t.position}</h3>
                    <Slider
                      label={t.axisX}
                      value={sel.pos.x}
                      min={-BED / 2}
                      max={BED / 2}
                      step={1}
                      unit="mm"
                      onChange={(x) => v.setPosition(sel.id, x, sel.pos.y)}
                    />
                    <Slider
                      label={t.axisY}
                      value={sel.pos.y}
                      min={-BED / 2}
                      max={BED / 2}
                      step={1}
                      unit="mm"
                      onChange={(y) => v.setPosition(sel.id, sel.pos.x, y)}
                    />
                  </div>

                  <div className="section">
                    <h3>{t.scale}</h3>
                    <Slider
                      label={t.uniformScale}
                      value={sel.scalePct}
                      min={10}
                      max={400}
                      step={1}
                      unit="%"
                      onChange={(p) => v.setUniformScalePct(sel.id, p)}
                    />
                    <label className="toggle" style={{ margin: "4px 0 10px" }}>
                      <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} />
                      {t.lockProportions}
                    </label>
                    <div className="grid3">
                      <NumberBox
                        label={t.axisX}
                        value={sel.dims.x}
                        onCommit={(mm) => v.setSizeMm(sel.id, "x", mm, lock)}
                      />
                      <NumberBox
                        label={t.axisY}
                        value={sel.dims.y}
                        onCommit={(mm) => v.setSizeMm(sel.id, "y", mm, lock)}
                      />
                      <NumberBox
                        label={t.axisZ}
                        value={sel.dims.z}
                        onCommit={(mm) => v.setSizeMm(sel.id, "z", mm, lock)}
                      />
                    </div>
                  </div>

                  <div className="section">
                    <h3>{t.rotation}</h3>
                    <Slider
                      label={t.axisZ}
                      value={sel.rotDeg.z}
                      min={0}
                      max={360}
                      step={1}
                      unit="°"
                      onChange={(d) => v.setRotationDeg(sel.id, "z", d)}
                    />
                    <div className="grid3">
                      <button className="btn ghost" onClick={() => v.rotate90(sel.id, "x")}>
                        {t.rotate90} X
                      </button>
                      <button className="btn ghost" onClick={() => v.rotate90(sel.id, "y")}>
                        {t.rotate90} Y
                      </button>
                      <button className="btn ghost" onClick={() => v.rotate90(sel.id, "z")}>
                        {t.rotate90} Z
                      </button>
                    </div>
                    <button
                      className="btn ghost block"
                      style={{ marginTop: 8 }}
                      onClick={() => v.resetRotation(sel.id)}
                    >
                      {t.resetRot}
                    </button>
                  </div>

                  <div className="section">
                    <h3>{t.actions}</h3>
                    <div className="grid2">
                      <button className="btn ghost" onClick={() => v.duplicate(sel.id)}>
                        ⧉ {t.duplicate}
                      </button>
                      <button className="btn ghost" onClick={() => v.dropToBed(sel.id)}>
                        ⤓ {t.dropToBed}
                      </button>
                      <button className="btn ghost" onClick={() => v.centerOnBed(sel.id)}>
                        ⊕ {t.centerBed}
                      </button>
                      <button className="btn ghost" onClick={() => v.autoArrange()}>
                        ▦ {t.autoArrange}
                      </button>
                    </div>
                    <div className="grid3" style={{ marginTop: 8 }}>
                      <button className="btn ghost" onClick={() => v.mirror(sel.id, "x")}>
                        {t.mirror} X
                      </button>
                      <button className="btn ghost" onClick={() => v.mirror(sel.id, "y")}>
                        {t.mirror} Y
                      </button>
                      <button className="btn ghost" onClick={() => v.mirror(sel.id, "z")}>
                        {t.mirror} Z
                      </button>
                    </div>
                    <button
                      className="btn ghost block"
                      style={{ marginTop: 8, color: "var(--bad)" }}
                      onClick={() => v.remove(sel.id)}
                    >
                      🗑 {t.remove}
                    </button>
                  </div>

                  <div className="section">
                    <h3>{t.cut}</h3>
                    {cut ? (
                      <>
                        <Slider
                          label={t.cutHeight}
                          value={Math.round((cut.h - cut.min) * 10) / 10}
                          min={0.5}
                          max={Math.round((cut.max - cut.min) * 10) / 10}
                          step={0.5}
                          unit="mm"
                          onChange={(mm) => v.setCutHeight(cut.min + mm)}
                        />
                        <div className="grid2">
                          <button className="btn ghost" onClick={() => v.cancelCut()}>
                            {t.cutCancel}
                          </button>
                          <button className="btn" onClick={applyCut}>
                            ✂ {t.cutApply}
                          </button>
                        </div>
                      </>
                    ) : (
                      <button className="btn ghost block" onClick={() => v.enterCutMode(sel.id)}>
                        ✂ {t.cut}
                      </button>
                    )}
                  </div>

                  <div className="section">
                    <h3>{t.slicePreview}</h3>
                    <button
                      className="btn block"
                      disabled={slicing}
                      onClick={() => runSlice(sliceSettings, null)}
                    >
                      {slicing ? t.slicing : `✂ ${t.sliceRun}`}{" "}
                      <span className="tag" style={{ marginInlineStart: 6 }}>{t.sliceExperimental}</span>
                    </button>
                    <button className="btn ghost block" style={{ marginTop: 8 }} onClick={exportStl}>
                      ⬇ {t.exportStl}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {previewOpen && sliceResult && (
        <SlicePreview
          result={sliceResult}
          layer={layer}
          setLayer={setLayer}
          settings={sliceSettings}
          setSettings={setSliceSettings}
          onUpdate={() => runSlice(sliceSettings, slicePos.current)}
          onClose={() => setPreviewOpen(false)}
          busy={slicing}
        />
      )}

      {(loading || cutting) && <div className="loading-pill">{cutting ? t.cutting : t.loading}</div>}
      {error && (
        <div className="toast">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => {
      const s = String(r.result);
      resolve(s.slice(s.indexOf(",") + 1));
    };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <b>
        {value}
        {unit ? ` ${unit}` : ""}
      </b>
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
        <b>
          {props.value}
          {props.unit ?? ""}
        </b>
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

function NumberBox(props: { label: string; value: number; onCommit: (n: number) => void }) {
  const [text, setText] = useState(String(props.value));
  useEffect(() => setText(String(props.value)), [props.value]);
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <div className="lbl">
        <span>{props.label}</span>
      </div>
      <div className="numrow">
        <input
          type="number"
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            const n = parseFloat(text);
            if (!isNaN(n) && n > 0) props.onCommit(n);
          }}
        />
        <span className="unit">mm</span>
      </div>
    </div>
  );
}
