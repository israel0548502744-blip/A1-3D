import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PRINTERS, POPULAR_IDS, DEFAULT_PRINTER_ID, getPrinter, searchPrinters, brands, popularPrinters,
} from "../src/printers/catalog.ts";

const CONNECTIONS = ["bambu", "moonraker", "prusalink", "sdcp", "flashforge", "octoprint", "file"];

test("ids are unique and well-formed", () => {
  const ids = PRINTERS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
});

test("every printer has a sane build volume and known connection", () => {
  for (const p of PRINTERS) {
    for (const d of [p.bed.x, p.bed.y, p.bed.z]) assert.ok(d >= 80 && d <= 600, `${p.id} bed ${d}`);
    assert.ok(CONNECTIONS.includes(p.connection), p.id);
    if (p.connection === "bambu") assert.equal(p.file, "gcode.3mf", p.id);
    else assert.equal(p.file, "gcode", p.id);
  }
});

test("popular list points at real printers, no duplicates", () => {
  assert.equal(new Set(POPULAR_IDS).size, POPULAR_IDS.length);
  assert.equal(popularPrinters().length, POPULAR_IDS.length);
});

test("default printer is the A1 and unknown ids fall back to it", () => {
  assert.equal(getPrinter(DEFAULT_PRINTER_ID).model, "A1");
  assert.equal(getPrinter("nope").id, DEFAULT_PRINTER_ID);
  assert.equal(getPrinter(null).id, DEFAULT_PRINTER_ID);
});

test("search ignores case, spaces and dashes; brand filter works", () => {
  assert.ok(searchPrinters("ender3v3se").some((p) => p.id === "creality-ender3-v3-se"));
  assert.ok(searchPrinters("A1 MINI").some((p) => p.id === "bambu-a1-mini"));
  assert.ok(searchPrinters("", "Prusa").every((p) => p.brand === "Prusa"));
  assert.equal(searchPrinters("zzzz").length, 0);
});

test("brands keep popularity order with Bambu Lab first", () => {
  const b = brands();
  assert.equal(b[0], "Bambu Lab");
  assert.equal(b[1], "Creality");
});
