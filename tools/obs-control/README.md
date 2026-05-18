# OBS Control

Small Bun CLI for starting/stopping OBS recording with a countdown timer.

## Setup

```bash
cd tools/obs-control
bun install
```

In OBS, enable the WebSocket server from `Tools > WebSocket Server Settings`. The default URL is `ws://localhost:4455`.

## Commands

```bash
bun run start   # countdown, then start/resume OBS recording
bun run pause   # pause OBS recording
bun run resume  # start/resume OBS recording
bun run toggle  # stopped -> start, paused -> resume, recording -> pause
bun run status  # print OBS recording state
```

`toggle` is the default command:

```bash
bun run record
```

## Configuration

```bash
OBS_WS_URL="ws://localhost:4455"
OBS_WS_PASSWORD="your-password"
RECORDING_COUNTDOWN="3"
OBS_POST_START_CHECK_MS="1000"
OBS_KEEP_CONNECTED_MS="0"
OBS_LOCK_DISABLED="0"
```

Set `RECORDING_COUNTDOWN=0` to skip the countdown.

## Troubleshooting

If OBS shows `An unspecified error occurred while recording` after the script reports success, check OBS `Settings > Hotkeys` for stray bindings and the Aitum Vertical Canvas plugin settings (Backtrack/vertical recording can fail independently of the main recording).

If the OBS log contains lines like this, the error is from the Aitum Vertical Canvas plugin, not this script:

```text
obs_encoder_initialize_internal: encoder 'vertical_canvas_record_video_encoder' has no media set
[Vertical Canvas] record stop error -4
```

To keep the WebSocket connection open after starting (useful for debugging disconnect-related issues):

```bash
OBS_KEEP_CONNECTED_MS=10000 bun run start
```

The OBS WebSocket request names behind the script are `StartRecord`, `PauseRecord`, `ResumeRecord`, and `GetRecordStatus`.
