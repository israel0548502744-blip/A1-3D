// Parse the printer's status reports (device/<serial>/report). Reports are
// partial — each message carries only the fields that changed — so we merge
// onto the previous status. Pure and unit-testable.

export type GcodeState =
  | "IDLE"
  | "PREPARE"
  | "RUNNING"
  | "PAUSE"
  | "FINISH"
  | "FAILED"
  | "UNKNOWN";

export interface PrinterStatus {
  state: GcodeState;
  progressPct: number;
  remainingMin: number;
  layer: number;
  totalLayers: number;
  nozzleTemp: number;
  nozzleTarget: number;
  bedTemp: number;
  bedTarget: number;
  fanPct: number;
  taskName: string;
  errors: string[]; // HMS error codes, formatted
  online: boolean;
}

export const emptyStatus = (): PrinterStatus => ({
  state: "UNKNOWN",
  progressPct: 0,
  remainingMin: 0,
  layer: 0,
  totalLayers: 0,
  nozzleTemp: 0,
  nozzleTarget: 0,
  bedTemp: 0,
  bedTarget: 0,
  fanPct: 0,
  taskName: "",
  errors: [],
  online: false,
});

function mapState(s: unknown): GcodeState | undefined {
  if (typeof s !== "string") return undefined;
  const up = s.toUpperCase();
  const known: GcodeState[] = ["IDLE", "PREPARE", "RUNNING", "PAUSE", "FINISH", "FAILED"];
  return (known as string[]).includes(up) ? (up as GcodeState) : "UNKNOWN";
}

const num = (v: unknown): number | undefined =>
  typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)) ? Number(v) : undefined;

/** Fan speed in the report is 0..15; convert to a percentage. */
function fanToPct(v: unknown): number | undefined {
  const n = num(v);
  if (n === undefined) return undefined;
  return Math.round((Math.min(15, Math.max(0, n)) / 15) * 100);
}

function formatHms(hms: unknown): string[] | undefined {
  if (!Array.isArray(hms)) return undefined;
  return hms
    .map((h) => {
      if (h && typeof h === "object") {
        const attr = (h as { attr?: number }).attr;
        const code = (h as { code?: number }).code;
        if (attr !== undefined && code !== undefined) {
          const hex = (n: number) => (n >>> 0).toString(16).toUpperCase().padStart(8, "0");
          return `${hex(attr)}_${hex(code)}`;
        }
      }
      return "";
    })
    .filter((s) => s !== "");
}

/** Merge a raw report message onto the previous status. */
export function parseReport(msg: unknown, prev: PrinterStatus = emptyStatus()): PrinterStatus {
  const next: PrinterStatus = { ...prev, online: true };
  const print = (msg as { print?: Record<string, unknown> })?.print;
  if (!print || typeof print !== "object") return next;

  const st = mapState(print.gcode_state);
  if (st) next.state = st;
  const pct = num(print.mc_percent);
  if (pct !== undefined) next.progressPct = pct;
  const rem = num(print.mc_remaining_time);
  if (rem !== undefined) next.remainingMin = rem;
  const layer = num(print.layer_num);
  if (layer !== undefined) next.layer = layer;
  const total = num(print.total_layer_num);
  if (total !== undefined) next.totalLayers = total;
  const nt = num(print.nozzle_temper);
  if (nt !== undefined) next.nozzleTemp = nt;
  const ntt = num(print.nozzle_target_temper);
  if (ntt !== undefined) next.nozzleTarget = ntt;
  const bt = num(print.bed_temper);
  if (bt !== undefined) next.bedTemp = bt;
  const btt = num(print.bed_target_temper);
  if (btt !== undefined) next.bedTarget = btt;
  const fan = fanToPct(print.cooling_fan_speed);
  if (fan !== undefined) next.fanPct = fan;
  if (typeof print.subtask_name === "string") next.taskName = print.subtask_name;
  const errs = formatHms(print.hms);
  if (errs !== undefined) next.errors = errs;

  return next;
}
