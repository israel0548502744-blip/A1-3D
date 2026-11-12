import { Printer, WifiOff } from "lucide-react";
import { t } from "../i18n";
import { ScreenTitle, GlassCard, IconTile, Chip, StepRow } from "../ui/kit";

/** Honest status: nothing here pretends to be connected. */
export function PrinterScreen() {
  return (
    <div className="screen">
      <ScreenTitle>{t.printerTitle}</ScreenTitle>

      <GlassCard className="panel printer-card">
        <div className="printer-head">
          <IconTile icon={Printer} tone="primary" size={60} />
          <span>
            <b>{t.printerCardTitle}</b>
            <Chip tone="bad">
              <WifiOff size={14} /> {t.printerNotConnected}
            </Chip>
          </span>
        </div>
        <p className="muted">{t.printerIntro}</p>
      </GlassCard>

      <GlassCard className="panel">
        <h3 className="panel-title">{t.progressTitle}</h3>
        <StepRow done title={t.stepEditor} sub={t.done} />
        <StepRow done title={t.stepSlicer} sub={t.done} />
        <StepRow done={false} title={t.stepLan} sub={t.stepLanSub} />
        <StepRow done={false} title={t.stepSend} sub={t.pending} />
        <StepRow done={false} title={t.stepRemote} sub={t.pending} />
        <StepRow done={false} title={t.stepCamera} sub={t.pending} />
      </GlassCard>
    </div>
  );
}
