#!/bin/bash

# ReMe — Stop all running services
# Kills the backend, frontend, and closes Xcode.

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${CYAN}[ReMe]${NC} $1"; }
ok()  { echo -e "${GREEN}[ReMe]${NC} $1"; }

# ── Kill backend (port 3001) ──────────────────────────────────────────────────
log "Stopping backend (port 3001)..."
lsof -ti:3001 | xargs kill -9 2>/dev/null && ok "Backend stopped." || log "Backend was not running."

# ── Kill frontend (port 5173) ─────────────────────────────────────────────────
log "Stopping frontend (port 5173)..."
lsof -ti:5173 | xargs kill -9 2>/dev/null && ok "Frontend stopped." || log "Frontend was not running."

# ── Close Xcode ───────────────────────────────────────────────────────────────
log "Closing Xcode..."
osascript -e 'tell application "Xcode" to quit' 2>/dev/null && ok "Xcode closed." || log "Xcode was not open."

# ── Close Terminal windows that were running ReMe processes ───────────────────
log "Closing ReMe Terminal windows..."
osascript <<'EOF'
tell application "Terminal"
  set windowsToClose to {}
  repeat with w in windows
    repeat with t in tabs of w
      set jobTitle to custom title of t
      if jobTitle contains "server" or jobTitle contains "vite" or jobTitle contains "npm" then
        set end of windowsToClose to w
        exit repeat
      end if
    end repeat
  end repeat
  repeat with w in windowsToClose
    close w
  end repeat
end tell
EOF

ok "All ReMe services stopped."
