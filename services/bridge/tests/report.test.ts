import { test } from "node:test";
import assert from "node:assert/strict";
import { parseReport, emptyStatus } from "../src/bambu/report.ts";

test("parses a full status report", () => {
  const msg = {
    print: {
      gcode_state: "RUNNING",
      mc_percent: 42,
      mc_remaining_time: 73,
      layer_num: 51,
      total_layer_num: 100,
      nozzle_temper: 219.8,
      nozzle_target_temper: 220,
      bed_temper: 60.1,
      bed_target_temper: 60,
      cooling_fan_speed: "15",
      subtask_name: "cube",
      hms: [],
    },
  };
  const s = parseReport(msg);
  assert.equal(s.state, "RUNNING");
  assert.equal(s.progressPct, 42);
  assert.equal(s.remainingMin, 73);
  assert.equal(s.layer, 51);
  assert.equal(s.totalLayers, 100);
  assert.equal(s.nozzleTarget, 220);
  assert.equal(s.bedTemp, 60.1);
  assert.equal(s.fanPct, 100);
  assert.equal(s.taskName, "cube");
  assert.equal(s.online, true);
  assert.deepEqual(s.errors, []);
});

test("merges partial reports onto previous status", () => {
  let s = parseReport({ print: { gcode_state: "RUNNING", mc_percent: 10, bed_temper: 60 } });
  s = parseReport({ print: { mc_percent: 25 } }, s); // only progress changed
  assert.equal(s.state, "RUNNING"); // retained
  assert.equal(s.progressPct, 25); // updated
  assert.equal(s.bedTemp, 60); // retained
});

test("formats HMS error codes", () => {
  const s = parseReport({ print: { hms: [{ attr: 50331904, code: 65543 }] } });
  assert.equal(s.errors.length, 1);
  assert.match(s.errors[0], /^[0-9A-F]{8}_[0-9A-F]{8}$/);
});

test("unknown gcode_state maps to UNKNOWN and empty stays empty", () => {
  assert.equal(parseReport({ print: { gcode_state: "WEIRD" } }).state, "UNKNOWN");
  assert.equal(emptyStatus().online, false);
});
