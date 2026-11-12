// Printer catalog. Facts only (build volume, how the printer talks on the network,
// what file it prints) written by us from manufacturers' published specs — no
// vendor profile files are copied. Brand and model names are used only to say
// which printer the user owns (nominative use); no logos, no affiliation.
//
// Order = popularity: brands by 2025–26 market share (Bambu Lab, Creality,
// Elegoo, Anycubic, Prusa, then smaller brands), models by how often they show up
// in best-seller lists. See docs/PRINTERS.md for sources.

export type Connection =
  | "bambu" // Bambu Lab LAN: MQTT/TLS 8883 + FTPS 990; starting prints needs LAN Only + Developer Mode
  | "moonraker" // Klipper's open HTTP/WebSocket API (port 7125)
  | "prusalink" // Prusa's local HTTP API
  | "sdcp" // Elegoo/CBD Smart Device Control Protocol (published spec), WebSocket 3030
  | "flashforge" // local HTTP API on port 8898 (community-documented)
  | "octoprint" // OctoPrint REST API with an API key
  | "file"; // no supported network protocol: save the file and print from SD/USB

export type FileFormat = "gcode.3mf" | "gcode";
export type Flavor = "bambu" | "klipper" | "prusa" | "marlin";

export interface PrinterModel {
  id: string;
  brand: string;
  model: string;
  bed: { x: number; y: number; z: number }; // mm
  connection: Connection;
  file: FileFormat;
  flavor: Flavor;
  /** Spec still to be checked against the manufacturer's page (user can edit). */
  checkSpecs?: boolean;
  /** A note shown when picking this printer. */
  note?: string;
}

const cube = (n: number) => ({ x: n, y: n, z: n });

// prettier-ignore
export const PRINTERS: PrinterModel[] = [
  // Bambu Lab
  { id: "bambu-a1", brand: "Bambu Lab", model: "A1", bed: cube(256), connection: "bambu", file: "gcode.3mf", flavor: "bambu" },
  { id: "bambu-p1s", brand: "Bambu Lab", model: "P1S", bed: cube(256), connection: "bambu", file: "gcode.3mf", flavor: "bambu" },
  { id: "bambu-a1-mini", brand: "Bambu Lab", model: "A1 mini", bed: cube(180), connection: "bambu", file: "gcode.3mf", flavor: "bambu" },
  { id: "bambu-p2s", brand: "Bambu Lab", model: "P2S", bed: cube(256), connection: "bambu", file: "gcode.3mf", flavor: "bambu" },
  { id: "bambu-x1c", brand: "Bambu Lab", model: "X1 Carbon", bed: cube(256), connection: "bambu", file: "gcode.3mf", flavor: "bambu" },
  { id: "bambu-p1p", brand: "Bambu Lab", model: "P1P", bed: cube(256), connection: "bambu", file: "gcode.3mf", flavor: "bambu" },
  { id: "bambu-h2s", brand: "Bambu Lab", model: "H2S", bed: { x: 340, y: 320, z: 340 }, connection: "bambu", file: "gcode.3mf", flavor: "bambu" },
  { id: "bambu-h2d", brand: "Bambu Lab", model: "H2D", bed: { x: 325, y: 320, z: 325 }, connection: "bambu", file: "gcode.3mf", flavor: "bambu", checkSpecs: true, note: "nozzleSingle" },
  { id: "bambu-x1e", brand: "Bambu Lab", model: "X1E", bed: cube(256), connection: "bambu", file: "gcode.3mf", flavor: "bambu" },

  // Creality
  { id: "creality-k1c", brand: "Creality", model: "K1C", bed: { x: 220, y: 220, z: 250 }, connection: "moonraker", file: "gcode", flavor: "klipper", note: "crealityStock" },
  { id: "creality-ender3-v3-se", brand: "Creality", model: "Ender-3 V3 SE", bed: { x: 220, y: 220, z: 250 }, connection: "file", file: "gcode", flavor: "marlin" },
  { id: "creality-k2-plus", brand: "Creality", model: "K2 Plus", bed: cube(350), connection: "moonraker", file: "gcode", flavor: "klipper", note: "crealityK2" },
  { id: "creality-k1-max", brand: "Creality", model: "K1 Max", bed: cube(300), connection: "moonraker", file: "gcode", flavor: "klipper", note: "crealityStock" },
  { id: "creality-ender3-v3-ke", brand: "Creality", model: "Ender-3 V3 KE", bed: { x: 220, y: 220, z: 240 }, connection: "moonraker", file: "gcode", flavor: "klipper", note: "crealityStock" },
  { id: "creality-k1", brand: "Creality", model: "K1", bed: { x: 220, y: 220, z: 250 }, connection: "moonraker", file: "gcode", flavor: "klipper", note: "crealityStock" },
  { id: "creality-k2-pro", brand: "Creality", model: "K2 Pro", bed: cube(300), connection: "moonraker", file: "gcode", flavor: "klipper", note: "crealityK2" },
  { id: "creality-k2", brand: "Creality", model: "K2", bed: cube(260), connection: "moonraker", file: "gcode", flavor: "klipper", note: "crealityK2" },
  { id: "creality-ender3-v3", brand: "Creality", model: "Ender-3 V3", bed: { x: 220, y: 220, z: 250 }, connection: "moonraker", file: "gcode", flavor: "klipper", note: "crealityStock" },
  { id: "creality-hi", brand: "Creality", model: "Hi", bed: { x: 260, y: 260, z: 300 }, connection: "moonraker", file: "gcode", flavor: "klipper", checkSpecs: true, note: "crealityStock" },
  { id: "creality-ender3-v3-plus", brand: "Creality", model: "Ender-3 V3 Plus", bed: { x: 300, y: 300, z: 330 }, connection: "moonraker", file: "gcode", flavor: "klipper", checkSpecs: true, note: "crealityStock" },
  { id: "creality-ender3-s1-pro", brand: "Creality", model: "Ender-3 S1 Pro", bed: { x: 220, y: 220, z: 270 }, connection: "file", file: "gcode", flavor: "marlin" },
  { id: "creality-ender3-v2", brand: "Creality", model: "Ender-3 V2", bed: { x: 220, y: 220, z: 250 }, connection: "file", file: "gcode", flavor: "marlin" },
  { id: "creality-ender5-s1", brand: "Creality", model: "Ender-5 S1", bed: { x: 220, y: 220, z: 280 }, connection: "file", file: "gcode", flavor: "marlin" },
  { id: "creality-cr10-se", brand: "Creality", model: "CR-10 SE", bed: { x: 220, y: 220, z: 265 }, connection: "moonraker", file: "gcode", flavor: "klipper", checkSpecs: true, note: "crealityStock" },

  // Elegoo
  { id: "elegoo-centauri-carbon", brand: "Elegoo", model: "Centauri Carbon", bed: cube(256), connection: "sdcp", file: "gcode", flavor: "marlin" },
  { id: "elegoo-neptune4-pro", brand: "Elegoo", model: "Neptune 4 Pro", bed: { x: 225, y: 225, z: 265 }, connection: "moonraker", file: "gcode", flavor: "klipper" },
  { id: "elegoo-neptune4", brand: "Elegoo", model: "Neptune 4", bed: { x: 225, y: 225, z: 265 }, connection: "moonraker", file: "gcode", flavor: "klipper" },
  { id: "elegoo-neptune4-plus", brand: "Elegoo", model: "Neptune 4 Plus", bed: { x: 320, y: 320, z: 385 }, connection: "moonraker", file: "gcode", flavor: "klipper" },
  { id: "elegoo-neptune4-max", brand: "Elegoo", model: "Neptune 4 Max", bed: { x: 420, y: 420, z: 480 }, connection: "moonraker", file: "gcode", flavor: "klipper" },

  // Anycubic
  { id: "anycubic-kobra3", brand: "Anycubic", model: "Kobra 3", bed: { x: 250, y: 250, z: 260 }, connection: "file", file: "gcode", flavor: "marlin", note: "anycubic" },
  { id: "anycubic-kobra-s1", brand: "Anycubic", model: "Kobra S1", bed: cube(250), connection: "file", file: "gcode", flavor: "marlin", note: "anycubic" },
  { id: "anycubic-kobra2-neo", brand: "Anycubic", model: "Kobra 2 Neo", bed: { x: 220, y: 220, z: 250 }, connection: "file", file: "gcode", flavor: "marlin" },
  { id: "anycubic-kobra3-max", brand: "Anycubic", model: "Kobra 3 Max", bed: { x: 420, y: 420, z: 500 }, connection: "file", file: "gcode", flavor: "marlin", checkSpecs: true, note: "anycubic" },

  // Prusa Research
  { id: "prusa-core-one", brand: "Prusa", model: "CORE One", bed: { x: 250, y: 220, z: 270 }, connection: "prusalink", file: "gcode", flavor: "prusa" },
  { id: "prusa-mk4s", brand: "Prusa", model: "MK4S", bed: { x: 250, y: 210, z: 220 }, connection: "prusalink", file: "gcode", flavor: "prusa" },
  { id: "prusa-mk4", brand: "Prusa", model: "MK4", bed: { x: 250, y: 210, z: 220 }, connection: "prusalink", file: "gcode", flavor: "prusa" },
  { id: "prusa-mini", brand: "Prusa", model: "MINI+", bed: cube(180), connection: "prusalink", file: "gcode", flavor: "prusa" },
  { id: "prusa-xl", brand: "Prusa", model: "XL", bed: cube(360), connection: "prusalink", file: "gcode", flavor: "prusa" },
  { id: "prusa-mk3s", brand: "Prusa", model: "MK3S+", bed: { x: 250, y: 210, z: 210 }, connection: "octoprint", file: "gcode", flavor: "prusa", note: "mk3" },

  // Qidi
  { id: "qidi-q1-pro", brand: "Qidi", model: "Q1 Pro", bed: { x: 245, y: 245, z: 240 }, connection: "moonraker", file: "gcode", flavor: "klipper" },
  { id: "qidi-plus4", brand: "Qidi", model: "Plus4", bed: { x: 305, y: 305, z: 280 }, connection: "moonraker", file: "gcode", flavor: "klipper" },
  { id: "qidi-x-plus3", brand: "Qidi", model: "X-Plus 3", bed: { x: 280, y: 280, z: 270 }, connection: "moonraker", file: "gcode", flavor: "klipper" },
  { id: "qidi-x-max3", brand: "Qidi", model: "X-Max 3", bed: { x: 325, y: 325, z: 315 }, connection: "moonraker", file: "gcode", flavor: "klipper" },

  // Flashforge
  { id: "flashforge-ad5m", brand: "Flashforge", model: "Adventurer 5M", bed: cube(220), connection: "flashforge", file: "gcode", flavor: "marlin" },
  { id: "flashforge-ad5m-pro", brand: "Flashforge", model: "Adventurer 5M Pro", bed: cube(220), connection: "flashforge", file: "gcode", flavor: "marlin" },
  { id: "flashforge-ad5x", brand: "Flashforge", model: "AD5X", bed: cube(220), connection: "flashforge", file: "gcode", flavor: "marlin" },

  // Sovol
  { id: "sovol-sv06", brand: "Sovol", model: "SV06", bed: { x: 220, y: 220, z: 250 }, connection: "file", file: "gcode", flavor: "marlin" },
  { id: "sovol-sv08", brand: "Sovol", model: "SV08", bed: { x: 350, y: 350, z: 345 }, connection: "moonraker", file: "gcode", flavor: "klipper" },
  { id: "sovol-sv07", brand: "Sovol", model: "SV07", bed: { x: 220, y: 220, z: 250 }, connection: "moonraker", file: "gcode", flavor: "klipper" },
  { id: "sovol-sv06-plus", brand: "Sovol", model: "SV06 Plus", bed: { x: 300, y: 300, z: 340 }, connection: "file", file: "gcode", flavor: "marlin" },

  // Artillery
  { id: "artillery-sidewinder-x2", brand: "Artillery", model: "Sidewinder X2", bed: { x: 300, y: 300, z: 400 }, connection: "file", file: "gcode", flavor: "marlin" },
  { id: "artillery-genius-pro", brand: "Artillery", model: "Genius Pro", bed: { x: 220, y: 220, z: 250 }, connection: "file", file: "gcode", flavor: "marlin" },

  // DIY / generic
  { id: "voron-24", brand: "Voron", model: "2.4 / Trident", bed: cube(300), connection: "moonraker", file: "gcode", flavor: "klipper", note: "diySize" },
  { id: "voron-02", brand: "Voron", model: "0.2", bed: cube(120), connection: "moonraker", file: "gcode", flavor: "klipper" },
  { id: "generic-klipper", brand: "other", model: "klipper", bed: { x: 220, y: 220, z: 250 }, connection: "moonraker", file: "gcode", flavor: "klipper", note: "diySize" },
  { id: "generic-octoprint", brand: "other", model: "octoprint", bed: { x: 220, y: 220, z: 250 }, connection: "octoprint", file: "gcode", flavor: "marlin", note: "diySize" },
  { id: "generic-file", brand: "other", model: "file", bed: { x: 220, y: 220, z: 250 }, connection: "file", file: "gcode", flavor: "marlin", note: "diySize" },
];

export const DEFAULT_PRINTER_ID = "bambu-a1";

/**
 * The best-selling models across all brands, most popular first — shown at the
 * top of the picker. Based on 2025–26 market share and best-seller lists.
 */
export const POPULAR_IDS = [
  "bambu-a1",
  "bambu-p1s",
  "bambu-a1-mini",
  "bambu-p2s",
  "creality-k1c",
  "creality-ender3-v3-se",
  "elegoo-centauri-carbon",
  "creality-k2-plus",
  "elegoo-neptune4-pro",
  "anycubic-kobra3",
  "prusa-core-one",
  "prusa-mk4s",
];

export function getPrinter(id: string | null | undefined): PrinterModel {
  return PRINTERS.find((p) => p.id === id) ?? PRINTERS.find((p) => p.id === DEFAULT_PRINTER_ID)!;
}

/** Brands in catalog (popularity) order. */
export function brands(): string[] {
  const out: string[] = [];
  for (const p of PRINTERS) if (!out.includes(p.brand)) out.push(p.brand);
  return out;
}

/** Case-insensitive search over brand + model; keeps catalog order. */
export function searchPrinters(query: string, brand?: string): PrinterModel[] {
  const q = query.trim().toLowerCase().replace(/[\s-]+/g, "");
  return PRINTERS.filter((p) => {
    if (brand && p.brand !== brand) return false;
    if (!q) return true;
    const hay = `${p.brand}${p.model}`.toLowerCase().replace(/[\s-]+/g, "");
    return hay.includes(q);
  });
}

export function popularPrinters(): PrinterModel[] {
  return POPULAR_IDS.map((id) => PRINTERS.find((p) => p.id === id)!).filter(Boolean);
}
