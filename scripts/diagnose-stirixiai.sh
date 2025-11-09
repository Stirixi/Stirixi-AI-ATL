#!/usr/bin/env bash
set -euo pipefail

CONTAINER=${1:-stirixi-ai-atl-frontend-1}
LOG_FILE=/tmp/stirixiai.log

docker logs "$CONTAINER" > "$LOG_FILE"

# Show last 50 lines for quick context
echo "--- Tail (50 lines) ---"
tail -n 50 "$LOG_FILE"

# Show any ConnectTimeoutError occurrences
echo "--- ConnectTimeoutError occurrences ---"
grep -n "ConnectTimeoutError" "$LOG_FILE" | tail -n 20 || echo "None"

# Show streaming start/completion markers
for marker in "Streaming chunk" "Stream completed"; do
  echo "--- $marker ---"
  grep -n "$marker" "$LOG_FILE" | tail -n 20 || echo "None"
  echo
done
