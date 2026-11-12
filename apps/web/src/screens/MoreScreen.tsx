import { useState } from "react";
import { Info, FileText } from "lucide-react";
import { t } from "../i18n";
import type { Look } from "../store";
import { ScreenTitle, GlassCard, Pills, ListRow, SecondaryButton } from "../ui/kit";

declare const __APP_VERSION__: string;

export function MoreScreen(props: { look: Look; setLook: (l: Look) => void }) {
  const [notices, setNotices] = useState<string | null>(null);
  const showNotices = async () => {
    if (notices !== null) return setNotices(null);
    try {
      const r = await fetch("./third-party-notices.txt");
      setNotices(r.ok ? await r.text() : t.noticesError);
    } catch {
      setNotices(t.noticesError);
    }
  };
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
        <SecondaryButton block icon={FileText} onClick={showNotices}>
          {notices === null ? t.showNotices : t.hideNotices}
        </SecondaryButton>
        {notices !== null && <pre className="notices">{notices}</pre>}
      </GlassCard>

      <p className="note">{t.disclaimer}</p>

      <p className="foot">
        Bambu Control Studio · {t.version} {__APP_VERSION__}
      </p>
    </div>
  );
}
