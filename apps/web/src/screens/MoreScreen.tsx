import { Info } from "lucide-react";
import { t } from "../i18n";
import type { Look } from "../store";
import { ScreenTitle, GlassCard, Pills, ListRow } from "../ui/kit";

declare const __APP_VERSION__: string;

export function MoreScreen(props: { look: Look; setLook: (l: Look) => void }) {
  return (
    <div className="screen">
      <ScreenTitle>{t.moreTitle}</ScreenTitle>

      <GlassCard className="panel">
        <h3 className="panel-title">{t.look}</h3>
        <Pills<Look>
          value={props.look}
          onChange={props.setLook}
          options={[
            { value: "auto", label: t.lookAuto },
            { value: "dark", label: t.lookDark },
            { value: "light", label: t.lookLight },
          ]}
        />
      </GlassCard>

      <ListRow title={t.about} sub={t.aboutSub} icon={Info} tone="emerald" />

      <GlassCard className="panel">
        <h3 className="panel-title">{t.licensesTitle}</h3>
        <p className="muted ltr">{t.licenses}</p>
      </GlassCard>

      <p className="foot">
        Bambu Control Studio · {t.version} {__APP_VERSION__}
      </p>
    </div>
  );
}
