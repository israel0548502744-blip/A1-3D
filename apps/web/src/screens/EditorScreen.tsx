import { useEffect, useState, type RefObject } from "react";
import {
  ArrowRight, Focus, Plus, RotateCw, Undo2, FlipHorizontal2, FlipVertical2, Copy,
  ArrowDownToLine, Crosshair, LayoutGrid, Trash2, Download, Layers, Scissors, FilePlus2, Box,
} from "lucide-react";
import { t } from "../i18n";
import type { ModelInfo, EditorTab, CutUi } from "../store";
import type { Viewer } from "../three/viewer";
import { BED } from "../three/viewer";
import {
  RoundButton, Segmented, ToolButton, Chip, SliderField, PrimaryButton, SecondaryButton, Hero, GlassCard,
} from "../ui/kit";

export function EditorScreen(props: {
  visible: boolean;
  containerRef: RefObject<HTMLDivElement>;
  viewer: Viewer | null;
  models: ModelInfo[];
  sel: ModelInfo | undefined;
  tab: EditorTab;
  setTab: (t: EditorTab) => void;
  cut: CutUi | null;
  slicing: boolean;
  onBack: () => void;
  onOpen: () => void;
  onSlice: () => void;
  onExport: () => void;
  onApplyCut: () => void;
}) {
  const { viewer: v, sel, models } = props;
  const [lock, setLock] = useState(true);
  const has = models.length > 0;

  return (
    <div className={`screen editor ${props.visible ? "" : "hidden"}`}>
      <div className="topbar">
        <RoundButton icon={ArrowRight} label={t.back} onClick={props.onBack} />
        <h2 className="top-title">{sel ? sel.name : t.navEditor}</h2>
        <RoundButton icon={Plus} label={t.openModel} onClick={props.onOpen} />
        <RoundButton icon={Focus} label={t.fitView} onClick={() => v?.fitView()} />
      </div>

      <div className="viewport glass">
        <div className="viewport-canvas" ref={props.containerRef} />
        {!has && (
          <div className="viewport-empty">
            <Box size={44} strokeWidth={1.4} />
            <b>{t.editorEmptyTitle}</b>
            <span>{t.editorEmptySub}</span>
          </div>
        )}
        <span className="viewport-badge">{t.bed}</span>
      </div>

      {!has ? (
        <Hero title={t.heroTitle} sub={t.heroSub} icon={FilePlus2} sideIcon={Box} onClick={props.onOpen} />
      ) : (
        <>
          <div className="chips-row">
            {models.map((m) => (
              <button
                key={m.id}
                className={`model-chip ${m.selected ? "on" : ""} ${m.outOfBounds ? "bad" : ""}`}
                onClick={() => v?.select(m.id)}
              >
                {m.name}
              </button>
            ))}
          </div>

          <Segmented<EditorTab>
            value={props.tab}
            onChange={props.setTab}
            options={[
              { value: "info", label: t.tabInfo },
              { value: "edit", label: t.tabEdit },
              { value: "cut", label: t.tabCut },
              { value: "export", label: t.tabExport },
            ]}
          />

          {sel && v && (
            <div className="tab-body">
              {props.tab === "info" && (
                <>
                  <div className="chip-wrap ltr-nums">
                    <Chip tone="accent">X {sel.dims.x} mm</Chip>
                    <Chip tone="accent">Y {sel.dims.y} mm</Chip>
                    <Chip tone="accent">Z {sel.dims.z} mm</Chip>
                    <Chip>
                      {sel.triangles.toLocaleString("he-IL")} {t.triangles}
                    </Chip>
                    <Chip>{sel.scalePct}%</Chip>
                    {sel.outOfBounds ? <Chip tone="bad">{t.outOfBounds}</Chip> : <Chip tone="good">{t.inBounds}</Chip>}
                  </div>
                  <GlassCard className="panel">
                    <SliderField label={`${t.position} · ${t.axisX}`} value={sel.pos.x} min={-BED / 2} max={BED / 2} step={1} unit=" mm"
                      onChange={(x) => v.setPosition(sel.id, x, sel.pos.y)} />
                    <SliderField label={`${t.position} · ${t.axisY}`} value={sel.pos.y} min={-BED / 2} max={BED / 2} step={1} unit=" mm"
                      onChange={(y) => v.setPosition(sel.id, sel.pos.x, y)} />
                  </GlassCard>
                </>
              )}

              {props.tab === "edit" && (
                <>
                  <div className="tools">
                    <ToolButton icon={RotateCw} label={t.rotateX} onClick={() => v.rotate90(sel.id, "x")} />
                    <ToolButton icon={RotateCw} label={t.rotateY} onClick={() => v.rotate90(sel.id, "y")} />
                    <ToolButton icon={RotateCw} label={t.rotateZ} onClick={() => v.rotate90(sel.id, "z")} />
                    <ToolButton icon={Undo2} label={t.resetRot} onClick={() => v.resetRotation(sel.id)} />
                    <ToolButton icon={FlipHorizontal2} label={t.mirrorX} onClick={() => v.mirror(sel.id, "x")} />
                    <ToolButton icon={FlipVertical2} label={t.mirrorY} onClick={() => v.mirror(sel.id, "y")} />
                    <ToolButton icon={FlipVertical2} label={t.mirrorZ} onClick={() => v.mirror(sel.id, "z")} />
                    <ToolButton icon={Copy} label={t.duplicate} onClick={() => v.duplicate(sel.id)} />
                    <ToolButton icon={ArrowDownToLine} label={t.dropToBed} onClick={() => v.dropToBed(sel.id)} />
                    <ToolButton icon={Crosshair} label={t.centerBed} onClick={() => v.centerOnBed(sel.id)} />
                    <ToolButton icon={LayoutGrid} label={t.autoArrange} onClick={() => v.autoArrange()} />
                    <ToolButton icon={Trash2} label={t.remove} danger onClick={() => v.remove(sel.id)} />
                  </div>
                  <GlassCard className="panel">
                    <SliderField label={t.uniformScale} value={sel.scalePct} min={10} max={400} step={1} unit="%"
                      onChange={(p) => v.setUniformScalePct(sel.id, p)} />
                    <label className="switch-row">
                      <span>{t.lockProportions}</span>
                      <input type="checkbox" className="switch" checked={lock} onChange={(e) => setLock(e.target.checked)} />
                    </label>
                    <div className="num-grid">
                      <NumberBox label="X" value={sel.dims.x} onCommit={(mm) => v.setSizeMm(sel.id, "x", mm, lock)} />
                      <NumberBox label="Y" value={sel.dims.y} onCommit={(mm) => v.setSizeMm(sel.id, "y", mm, lock)} />
                      <NumberBox label="Z" value={sel.dims.z} onCommit={(mm) => v.setSizeMm(sel.id, "z", mm, lock)} />
                    </div>
                    <SliderField label={`${t.rotation} · ${t.axisZ}`} value={sel.rotDeg.z} min={0} max={360} step={1} unit="°"
                      onChange={(d) => v.setRotationDeg(sel.id, "z", d)} />
                  </GlassCard>
                </>
              )}

              {props.tab === "cut" && (
                <GlassCard className="panel">
                  <p className="muted">{t.cutIntro}</p>
                  {props.cut ? (
                    <>
                      <SliderField
                        label={t.cutHeight}
                        value={Math.round((props.cut.h - props.cut.min) * 10) / 10}
                        min={0.5}
                        max={Math.round((props.cut.max - props.cut.min) * 10) / 10}
                        step={0.5}
                        unit=" mm"
                        onChange={(mm) => v.setCutHeight(props.cut!.min + mm)}
                      />
                      <div className="btn-row">
                        <SecondaryButton onClick={() => v.cancelCut()}>{t.cutCancel}</SecondaryButton>
                        <PrimaryButton icon={Scissors} onClick={props.onApplyCut}>{t.cutApply}</PrimaryButton>
                      </div>
                    </>
                  ) : (
                    <PrimaryButton block icon={Scissors} onClick={() => v.enterCutMode(sel.id)}>{t.cut}</PrimaryButton>
                  )}
                </GlassCard>
              )}

              {props.tab === "export" && (
                <GlassCard className="panel">
                  <p className="muted">{t.exportIntro}</p>
                  <SecondaryButton block icon={Download} onClick={props.onExport}>{t.exportStl}</SecondaryButton>
                </GlassCard>
              )}
            </div>
          )}

          <div className="cta-bar">
            <SecondaryButton icon={Download} onClick={props.onExport}>STL</SecondaryButton>
            <PrimaryButton icon={Layers} disabled={props.slicing} onClick={props.onSlice}>
              {props.slicing ? t.slicing : t.sliceCta}
            </PrimaryButton>
          </div>
        </>
      )}
    </div>
  );
}

function NumberBox(props: { label: string; value: number; onCommit: (n: number) => void }) {
  const [text, setText] = useState(String(props.value));
  useEffect(() => setText(String(props.value)), [props.value]);
  return (
    <label className="numbox">
      <span>{props.label}</span>
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
      <em>mm</em>
    </label>
  );
}
