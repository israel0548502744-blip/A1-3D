import { useEffect, useRef, useState } from "react";
import { Viewer, BED } from "./three/viewer";
import { useStore, selectedModel } from "./store";
import { t } from "./i18n";

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { models, theme, loading, error, setModels, setTheme, setLoading, setError } = useStore();
  const sel = useStore(selectedModel);
  const [lock, setLock] = useState(true);

  // Create the viewer once.
  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = new Viewer(containerRef.current, setModels);
    viewerRef.current = viewer;
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

  function exportStl() {
    const blob = viewerRef.current?.exportSTL();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (sel?.name ?? "scene") + ".stl";
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
        accept=".stl,.3mf,.obj,model/stl,model/3mf"
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
                    <h3>{t.slice}</h3>
                    <button className="btn block" onClick={exportStl}>
                      ⬇ {t.exportStl}
                    </button>
                    <div className="soon" style={{ marginTop: 10 }}>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>{t.slice}</span>
                      <span className="tag">{t.notYet}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, margin: "8px 0 0" }}>
                      {t.sliceSoon}
                    </p>
                    <div className="soon" style={{ marginTop: 12 }}>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>{t.cut}</span>
                      <span className="tag">{t.notYet}</span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {loading && <div className="loading-pill">{t.loading}</div>}
      {error && (
        <div className="toast">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </div>
  );
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
