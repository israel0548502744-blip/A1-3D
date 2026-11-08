import { test } from "node:test";
import assert from "node:assert/strict";
import { pushAll, pause, resume, stop, ledControl, projectFile } from "../src/bambu/commands.ts";

test("pushAll", () => {
  assert.deepEqual(pushAll(3), { pushing: { sequence_id: "3", command: "pushall" } });
});

test("pause/resume/stop", () => {
  assert.deepEqual(pause(1), { print: { sequence_id: "1", command: "pause" } });
  assert.deepEqual(resume(2), { print: { sequence_id: "2", command: "resume" } });
  assert.deepEqual(stop(9), { print: { sequence_id: "9", command: "stop" } });
});

test("ledControl on/off", () => {
  assert.deepEqual(ledControl(true, 5), {
    system: { sequence_id: "5", command: "ledctrl", led_node: "chamber_light", led_mode: "on" },
  });
  assert.equal((ledControl(false, 5) as any).system.led_mode, "off");
});

test("projectFile builds a start-print payload", () => {
  const p = projectFile({ fileName: "cube.gcode.3mf", useAms: false }, 7) as any;
  assert.equal(p.print.command, "project_file");
  assert.equal(p.print.sequence_id, "7");
  assert.equal(p.print.url, "file:///sdcard/cube.gcode.3mf");
  assert.equal(p.print.subtask_name, "cube");
  assert.equal(p.print.param, "Metadata/plate_1.gcode");
  assert.equal(p.print.use_ams, false);
  assert.equal(p.print.bed_leveling, true);
});

test("projectFile honours explicit task name and ams mapping", () => {
  const p = projectFile(
    { fileName: "part.gcode.3mf", taskName: "My Part", useAms: true, amsMapping: [0, 1] },
    1,
  ) as any;
  assert.equal(p.print.subtask_name, "My Part");
  assert.deepEqual(p.print.ams_mapping, [0, 1]);
  assert.equal(p.print.use_ams, true);
});
