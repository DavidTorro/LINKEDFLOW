#!/bin/bash
set -euo pipefail

PLIST_PATH="$HOME/Library/LaunchAgents/com.linkedflow.start.plist"

if [ -f "$PLIST_PATH" ]; then
  launchctl unload "$PLIST_PATH" >/dev/null 2>&1 || true
  rm -f "$PLIST_PATH"
fi

echo "Autoarranque desactivado."
