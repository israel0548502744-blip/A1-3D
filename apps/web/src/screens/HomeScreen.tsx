import { Box, FilePlus2, Layers, Scissors, Printer, Boxes } from "lucide-react";
import { t } from "../i18n";
import type { ModelInfo, Screen, EditorTab } from "../store";
import { ScreenTitle, Hero, CategoryCard, GlassCard } from "../ui/kit";

export function HomeScreen(props: {
  models: ModelInfo[];
  onOpen: () => void;
  go: (s: Screen, tab?: EditorTab) => void;
  onSelect: (id: string) => void;
  onSlice: () => void;
}) {
  const { models } = props;
  const has = models.length > 0;
  return (
    <div className="screen">
      <ScreenTitle gradient>{t.homeTitle}</ScreenTitle>

      <Hero title={t.heroTitle} sub={t.heroSub} icon={FilePlus2} sideIcon={Box} onClick={props.onOpen} />

      <div className="cat-grid">
        <CategoryCard
          title={t.catEditor}
          sub={has ? t.catEditorSub(models.length) : t.catEditorSubEmpty}
          icon={Boxes}
          tone="emerald"
          onClick={() => props.go("editor", "edit")}
        />
        <CategoryCard
          title={t.catSlice}
          sub={has ? t.catSliceSub : t.needModel}
          icon={Layers}
          tone="lime"
          onClick={has ? props.onSlice : props.onOpen}
        />
        <CategoryCard
          title={t.catCut}
          sub={has ? t.catCutSub : t.needModel}
          icon={Scissors}
          tone="teal"
          onClick={has ? () => props.go("editor", "cut") : props.onOpen}
        />
        <CategoryCard
          title={t.catPrinter}
          sub={t.printerNotConnected}
          icon={Printer}
          tone="primary"
          badge={t.notYet}
          onClick={() => props.go("printer")}
        />
      </div>

      {has && (
        <>
          <div className="section-head">
            <b>{t.onPlate}</b>
            <button className="link" onClick={() => props.go("editor", "info")}>
              {t.all}
            </button>
          </div>
          <div className="strip">
            {models.map((m) => (
              <GlassCard
                key={m.id}
                className={`model-card ${m.outOfBounds ? "bad" : ""}`}
                onClick={() => {
                  props.onSelect(m.id);
                  props.go("editor", "info");
                }}
              >
                <span className="model-thumb">
                  <Box size={40} strokeWidth={1.6} />
                </span>
                <b>{m.name}</b>
                <span className="sub ltr">
                  {m.dims.x} × {m.dims.y} × {m.dims.z} mm
                </span>
              </GlassCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
