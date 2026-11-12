import { t } from "../i18n";
import type { PrinterModel } from "./catalog";

export function printerName(p: PrinterModel): string {
  return p.brand === "other" ? t.otherModel[p.model] ?? p.model : `${p.brand} ${p.model}`;
}

export function brandLabel(brand: string): string {
  return brand === "other" ? t.otherBrand : brand;
}

export const bedText = (b: { x: number; y: number; z: number }) => `${b.x}×${b.y}×${b.z} mm`;
