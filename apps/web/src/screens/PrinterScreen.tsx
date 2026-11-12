import { useEffect, useState } from "react";
import { Printer, WifiOff, RefreshCw, Repeat } from "lucide-react";
import { t } from "../i18n";
import type { PrinterModel } from "../printers/catalog";
import { printerName, bedText } from "../printers/display";
import type { Bed } from "../store";
import { ScreenTitle, GlassCard, IconTile, Chip, StepRow, SecondaryButton } from "../ui/kit";

/** Honest status: nothing here pretends to be connected. */
export function PrinterScreen(props: {
  printer: PrinterModel;
  bed: Bed;
  edited: boolean;
  onChange: () => void;
  onBed: (bed: Bed | null) => void;
}) {
  const p = props.printer;
  return (
    <div className="screen">
      <ScreenTitle>{t.printerTitle}</ScreenTitle>

      <GlassCard className="panel printer-card">
        <div className="printer-head">
          <IconTile icon={Printer} tone="primary" size={60} />
          <span>
            <b>{printerName(p)}</b>
            <span className="sub">
              {t.connectionLabel}: {t.connection[p.connection]}
            </span>
            <Chip tone="bad">
              <WifiOff size={14} /> {t.printerNotConnected}
            </Chip>
          </span>
        </div>
        <SecondaryButton block icon={Repeat} onClick={props.onChange}>
          {t.changePrinter}
        </SecondaryButton>
      </GlassCard>

      <GlassCard className="panel">
        <h3 className="panel-title">
          {t.bedSize} {props.edited && <span className="tag">{t.edited}</span>}
          {p.checkSpecs && !props.edited && <span className="tag">{t.specsCheck}</span>}
        </h3>
        <p className="muted">{t.bedSizeSub}</p>
        <div className="num-grid">
          <BedBox label="X" value={props.bed.x} onCommit={(x) => props.onBed({ ...props.bed, x })} />
          <BedBox label="Y" value={props.bed.y} onCommit={(y) => props.onBed({ ...props.bed, y })} />
          <BedBox label="Z" value={props.bed.z} onCommit={(z) => props.onBed({ ...props.bed, z })} />
        </div>
        {props.edited && (
          <SecondaryButton block icon={RefreshCw} onClick={() => props.onBed(null)}>
            {t.bedReset} ({bedText(p.bed)})
          </SecondaryButton>
        )}
      </GlassCard>

      <GlassCard className="panel">
        <h3 className="panel-title">{t.connectionLabel}: {t.connection[p.connection]}</h3>
        <ol className="howto">
          {t.howTo[p.connection].map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        {p.note && <p className="muted">{t.notes[p.note]}</p>}
        {p.connection !== "file" && <p className="muted warn-text">{t.connectNotYet}</p>}
      </GlassCard>

      <GlassCard className="panel">
        <h3 className="panel-title">{t.progressTitle}</h3>
        <StepRow done title={t.stepEditor} sub={t.done} />
        <StepRow done title={t.stepSlicer} sub={t.done} />
        <StepRow done={false} title={t.stepLan} sub={t.connection[p.connection]} />
        <StepRow done={false} title={t.stepSend} sub={t.pending} />
        <StepRow done={false} title={t.stepRemote} sub={t.pending} />
        <StepRow done={false} title={t.stepCamera} sub={t.pending} />
      </GlassCard>

      <p className="note">{t.disclaimer}</p>
    </div>
  );
}

function BedBox(props: { label: string; value: number; onCommit: (n: number) => void }) {
  const [text, setText] = useState(String(props.value));
  useEffect(() => setText(String(props.value)), [props.value]);
  return (
    <label className="numbox">
      <span>{props.label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = Math.round(parseFloat(text));
          if (!isNaN(n) && n >= 50 && n <= 1000) props.onCommit(n);
          else setText(String(props.value));
        }}
      />
      <em>mm</em>
    </label>
  );
}
