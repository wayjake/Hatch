#!/usr/bin/env bun
import OBSWebSocket from "obs-websocket-js";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OBS_URL = process.env.OBS_WS_URL ?? "ws://localhost:4455";
const OBS_PASSWORD = process.env.OBS_WS_PASSWORD;
const COUNTDOWN = readNonNegativeIntegerEnv("RECORDING_COUNTDOWN", 3);
const OBS_POST_START_CHECK_MS = readNonNegativeIntegerEnv("OBS_POST_START_CHECK_MS", 1000);
const OBS_KEEP_CONNECTED_MS = readNonNegativeIntegerEnv("OBS_KEEP_CONNECTED_MS", 0);
const LOCK_DIR = join(tmpdir(), "course-platform-obs-control.lock");

const commands = [
  "start",
  "pause",
  "resume",
  "toggle",
  "status",
] as const;
type Command = (typeof commands)[number];

type RecordStatus = {
  outputActive: boolean;
  outputPaused: boolean;
  outputTimecode?: string;
  outputDuration?: number;
  outputBytes?: number;
};

type RecordStateChangedEvent = {
  outputActive: boolean;
  outputState: string;
  outputPath?: string | null;
};

type RecordFileChangedEvent = {
  newOutputPath: string;
};

function readNonNegativeIntegerEnv(name: string, fallback: number) {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === "") {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }

  return value;
}

function readBooleanEnv(name: string) {
  return ["1", "true", "yes", "on"].includes(
    (process.env[name] ?? "").toLowerCase(),
  );
}

function acquireLock() {
  if (readBooleanEnv("OBS_LOCK_DISABLED")) {
    return () => {};
  }

  try {
    mkdirSync(LOCK_DIR);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "EEXIST"
    ) {
      throw new Error("another obs-control command is already running");
    }

    throw error;
  }

  return () => {
    rmSync(LOCK_DIR, { recursive: true, force: true });
  };
}

function parseCommand(): Command {
  const requestedCommand = Bun.argv[2] ?? "toggle";

  if (
    requestedCommand === "help" ||
    requestedCommand === "--help" ||
    requestedCommand === "-h"
  ) {
    printHelp();
    process.exit(0);
  }

  if (!commands.includes(requestedCommand as Command)) {
    printHelp();
    throw new Error(`unknown command: ${requestedCommand}`);
  }

  return requestedCommand as Command;
}

function printHelp() {
  console.log(`Usage: bun run record.ts [command]

Commands:
  start   countdown, then start/resume OBS recording
  pause   pause OBS recording
  resume  start/resume OBS recording
  toggle  stopped -> start, paused -> resume, recording -> pause (default)
  status  print OBS recording state

Environment:
  OBS_WS_URL              default: ws://localhost:4455
  OBS_WS_PASSWORD         optional OBS WebSocket password
  RECORDING_COUNTDOWN     default: 3
  OBS_POST_START_CHECK_MS default: 1000
  OBS_KEEP_CONNECTED_MS   default: 0
  OBS_LOCK_DISABLED       set to 1 to allow overlapping script runs`);
}

async function countdown() {
  for (let n = COUNTDOWN; n > 0; n--) {
    process.stdout.write(`\r${n}... `);
    await Bun.sleep(1000);
  }

  if (COUNTDOWN > 0) {
    process.stdout.write("\rrolling\n");
  }
}

async function getRecordStatus(obs: OBSWebSocket): Promise<RecordStatus> {
  const status = (await obs.call("GetRecordStatus")) as RecordStatus;

  return {
    outputActive: Boolean(status.outputActive),
    outputPaused: Boolean(status.outputPaused),
    outputTimecode: status.outputTimecode,
    outputDuration: status.outputDuration,
    outputBytes: status.outputBytes,
  };
}

function formatRecordStatus(status: RecordStatus) {
  const state = !status.outputActive
    ? "stopped"
    : status.outputPaused
      ? "paused"
      : "recording";

  const details = [
    status.outputTimecode,
    status.outputBytes === undefined ? undefined : `${status.outputBytes} bytes`,
  ].filter(Boolean);

  return details.length > 0 ? `${state} (${details.join(", ")})` : state;
}

function attachObsEventLogging(obs: OBSWebSocket) {
  obs.on("RecordStateChanged", (event: RecordStateChangedEvent) => {
    console.log(
      `obs event: ${event.outputState} active=${event.outputActive} path=${event.outputPath ?? ""}`,
    );
  });

  obs.on("RecordFileChanged", (event: RecordFileChangedEvent) => {
    console.log(`obs event: writing ${event.newOutputPath}`);
  });
}

async function startOrResumeRecording(obs: OBSWebSocket) {
  const status = await getRecordStatus(obs);

  if (!status.outputActive) {
    await countdown();
    await obs.call("StartRecord");
    console.log("recording started");
    return true;
  }

  if (status.outputPaused) {
    await obs.call("ResumeRecord");
    console.log("recording resumed");
    return true;
  }

  console.log("recording already active");
  return false;
}

async function pauseRecording(obs: OBSWebSocket) {
  const status = await getRecordStatus(obs);

  if (!status.outputActive) {
    console.log("recording is not active");
    return;
  }

  if (status.outputPaused) {
    console.log("recording already paused");
    return;
  }

  await obs.call("PauseRecord");
  console.log("recording paused");
}

async function toggleRecording(obs: OBSWebSocket) {
  const status = await getRecordStatus(obs);

  if (!status.outputActive) {
    await countdown();
    await obs.call("StartRecord");
    console.log("recording started");
    return true;
  }

  if (status.outputPaused) {
    await obs.call("ResumeRecord");
    console.log("recording resumed");
    return true;
  }

  await obs.call("PauseRecord");
  console.log("recording paused");
  return false;
}

async function printRecordStatus(obs: OBSWebSocket) {
  const status = await getRecordStatus(obs);
  console.log(formatRecordStatus(status));
}

async function runCommand(obs: OBSWebSocket, command: Command) {
  switch (command) {
    case "start":
    case "resume":
      return startOrResumeRecording(obs);
    case "pause":
      await pauseRecording(obs);
      return false;
    case "toggle":
      return toggleRecording(obs);
    case "status":
      await printRecordStatus(obs);
      return false;
  }
}

async function main() {
  const command = parseCommand();
  const releaseLock = acquireLock();
  const obs = new OBSWebSocket();
  let connected = false;

  try {
    await obs.connect(OBS_URL, OBS_PASSWORD);
    connected = true;
    attachObsEventLogging(obs);
    const started = await runCommand(obs, command);

    if (started && OBS_POST_START_CHECK_MS > 0) {
      await Bun.sleep(OBS_POST_START_CHECK_MS);
      const status = await getRecordStatus(obs);
      console.log(`obs status after start: ${formatRecordStatus(status)}`);
    }

    if (OBS_KEEP_CONNECTED_MS > 0) {
      console.log(`keeping OBS websocket connected for ${OBS_KEEP_CONNECTED_MS}ms`);
      await Bun.sleep(OBS_KEEP_CONNECTED_MS);
    }
  } finally {
    if (connected) {
      await obs.disconnect();
    }

    releaseLock();
  }
}

main().catch((error) => {
  console.error("failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
