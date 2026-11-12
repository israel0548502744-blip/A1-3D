import { useMemo, useState } from "react";
import { Search, X, Printer, Check } from "lucide-react";
import { t } from "../i18n";
import { brands, popularPrinters, searchPrinters, type PrinterModel } from "../printers/catalog";
import { printerName, brandLabel, bedText } from "../printers/display";
import { RoundButton, IconTile } from "../ui/kit";

export function PrinterPicker(props: {
  currentId: string;
  firstRun: boolean;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string | null>(null);
  const allBrands = useMemo(brands, []);
  const filtering = query.trim() !== "" || brand !== null;
  const results = useMemo(() => searchPrinters(query, brand ?? undefined), [query, brand]);

  const row = (p: PrinterModel) => {
    const on = p.id === props.currentId;
    return (
      <button key={p.id} className={`printer-row ${on ? "on" : ""}`} onClick={() => props.onPick(p.id)}>
        <IconTile icon={Printer} tone={on ? "primary" : "emerald"} size={46} />
        <span className="printer-row-text">
          <b>{printerName(p)}</b>
          <span className="sub">
            <span className="ltr">{bedText(p.bed)}</span> · {t.connection[p.connection]}
          </span>
        </span>
        {p.checkSpecs && <span className="tag">{t.specsCheck}</span>}
        {on && <Check className="printer-check" size={22} strokeWidth={2.6} aria-label={t.selected} />}
      </button>
    );
  };

  // Grouped by brand, keeping catalog (popularity) order.
  const grouped = allBrands.map((b) => ({ brand: b, items: searchPrinters("", b) }));

  return (
    <div className="overlay" role="dialog" aria-label={t.choosePrinter}>
      <div className="overlay-inner">
        <div className="overlay-head">
          <h2>{t.choosePrinter}</h2>
          {props.firstRun ? (
            <button className="link" onClick={props.onClose}>
              {t.skip}
            </button>
          ) : (
            <RoundButton icon={X} label={t.close} onClick={props.onClose} />
          )}
        </div>
        <p className="muted">{t.choosePrinterSub}</p>

        <label className="search">
          <Search size={20} />
          <input
            type="search"
            value={query}
            placeholder={t.searchPrinter}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>

        <div className="brand-pills">
          <button className={brand === null ? "on" : ""} onClick={() => setBrand(null)}>
            {t.allBrands}
          </button>
          {allBrands.map((b) => (
            <button key={b} className={brand === b ? "on" : ""} onClick={() => setBrand(b)}>
              {brandLabel(b)}
            </button>
          ))}
        </div>

        {filtering ? (
          results.length > 0 ? (
            <div className="printer-list">{results.map(row)}</div>
          ) : (
            <p className="muted">{t.noResults}</p>
          )
        ) : (
          <>
            <h3 className="list-head">{t.popular}</h3>
            <div className="printer-list">{popularPrinters().map(row)}</div>
            <h3 className="list-head">{t.allPrinters}</h3>
            {grouped.map((g) => (
              <div key={g.brand}>
                <div className="brand-head">{brandLabel(g.brand)}</div>
                <div className="printer-list">{g.items.map(row)}</div>
              </div>
            ))}
          </>
        )}

        <p className="note">{t.disclaimer}</p>
      </div>
    </div>
  );
}
