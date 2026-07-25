#!/usr/bin/env bash
# Nairi night-build driver: runs an autonomous opencode agent once per hour
# until 10:00 local time. Each run pulls the next task from tasks.json,
# implements it, verifies with tsc + vitest, and updates task status.
set -u
REPO="C:/Users/User/Desktop/Nairi"
cd "$REPO" || exit 1
LOG="$REPO/scripts/night-run.log"
PROMPT_FILE="$REPO/scripts/night-prompt.txt"
STOP_HOUR=10
# Optional: set NIGHT_MODEL=provider/model to override the default model.
MODEL_FLAG=""
if [ -n "${NIGHT_MODEL:-}" ]; then MODEL_FLAG="-m $NIGHT_MODEL"; fi

mkdir -p "$REPO/scripts"
echo "Night run started $(date)" >> "$LOG"

while true; do
  HOUR=$(date +%H)
  HOUR=${HOUR#0}
  if [ -z "$HOUR" ]; then HOUR=0; fi
  if [ "$HOUR" -ge "$STOP_HOUR" ]; then
    echo "Stop hour $STOP_HOUR reached at $(date) - exiting." >> "$LOG"
    break
  fi
  echo "--- Iteration start $(date) (hour=$HOUR) ---" >> "$LOG"
  # 50-minute hard cap per agent run; --auto auto-approves permission prompts.
  timeout 3000 opencode run "$(cat "$PROMPT_FILE")" $MODEL_FLAG --auto >> "$LOG" 2>&1
  echo "--- Iteration end $(date) ---" >> "$LOG"
  sleep 3600
done

echo "Night run finished $(date)" >> "$LOG"
