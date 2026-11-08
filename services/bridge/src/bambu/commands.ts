// Builders for the MQTT command payloads a Bambu Lab printer accepts on
// device/<serial>/request. Pure functions — no I/O — so they are unit-testable
// without a printer. Field names follow the printer's documented JSON schema.

export type Seq = string | number;

export function pushAll(seq: Seq): object {
  return { pushing: { sequence_id: String(seq), command: "pushall" } };
}

export function pause(seq: Seq): object {
  return { print: { sequence_id: String(seq), command: "pause" } };
}

export function resume(seq: Seq): object {
  return { print: { sequence_id: String(seq), command: "resume" } };
}

export function stop(seq: Seq): object {
  return { print: { sequence_id: String(seq), command: "stop" } };
}

/** Chamber/toolhead light. On the A1 the usable node is typically "chamber_light". */
export function ledControl(on: boolean, seq: Seq, node = "chamber_light"): object {
  return {
    system: {
      sequence_id: String(seq),
      command: "ledctrl",
      led_node: node,
      led_mode: on ? "on" : "off",
    },
  };
}

export interface PrintJobOptions {
  /** File already uploaded to the printer's storage, e.g. "model.gcode.3mf". */
  fileName: string;
  /** Human-readable task name shown on the printer. */
  taskName?: string;
  useAms?: boolean;
  amsMapping?: number[];
  bedLeveling?: boolean;
  flowCalibration?: boolean;
  vibrationCalibration?: boolean;
  timelapse?: boolean;
  layerInspect?: boolean;
  /** Plate gcode entry inside the 3MF. */
  plateParam?: string;
}

/**
 * Start a print of a file already on the printer's SD/local storage.
 * NOTE: the printer only accepts this from authorised software / in developer
 * mode. We never bypass that gate — this just builds the documented payload.
 */
export function projectFile(opts: PrintJobOptions, seq: Seq): object {
  const name = opts.taskName ?? opts.fileName.replace(/\.(gcode\.3mf|3mf|gcode|stl)$/i, "");
  return {
    print: {
      sequence_id: String(seq),
      command: "project_file",
      param: opts.plateParam ?? "Metadata/plate_1.gcode",
      url: `file:///sdcard/${opts.fileName}`,
      subtask_name: name,
      use_ams: opts.useAms ?? false,
      ams_mapping: opts.amsMapping ?? [],
      bed_leveling: opts.bedLeveling ?? true,
      flow_cali: opts.flowCalibration ?? false,
      vibration_cali: opts.vibrationCalibration ?? true,
      timelapse: opts.timelapse ?? false,
      layer_inspect: opts.layerInspect ?? false,
      bed_type: "textured_plate",
    },
  };
}
