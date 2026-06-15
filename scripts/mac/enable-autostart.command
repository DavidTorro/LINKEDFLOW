#!/bin/bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PLIST_PATH="$HOME/Library/LaunchAgents/com.linkedflow.start.plist"

mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.linkedflow.start</string>
  <key>ProgramArguments</key>
  <array>
    <string>$APP_DIR/scripts/mac/start-at-login.command</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$HOME/Library/Logs/LinkedFlow/launchagent.out.log</string>
  <key>StandardErrorPath</key>
  <string>$HOME/Library/Logs/LinkedFlow/launchagent.err.log</string>
</dict>
</plist>
EOF

launchctl unload "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl load "$PLIST_PATH"

echo "Autoarranque activado."
