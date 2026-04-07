#!/bin/bash

# ReMe — iOS Development Launcher
# Starts the backend, frontend, syncs Capacitor, and opens Xcode.
# Run from anywhere: bash scripts/run-ios.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log()  { echo -e "${CYAN}[ReMe]${NC} $1"; }
ok()   { echo -e "${GREEN}[ReMe]${NC} $1"; }
warn() { echo -e "${YELLOW}[ReMe]${NC} $1"; }

# ── Detect current local IP ───────────────────────────────────────────────────
CURRENT_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")

if [ -z "$CURRENT_IP" ]; then
  warn "Could not detect local IP. Make sure you're connected to WiFi."
  CURRENT_IP="localhost"
fi

log "Detected local IP: $CURRENT_IP"

# ── Auto-update IP in capacitor.config.ts and .env if it changed ──────────────
CAPACITOR_CONFIG="$ROOT/apps/client/capacitor.config.ts"
ENV_FILE="$ROOT/.env"

STORED_IP=$(grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+' "$CAPACITOR_CONFIG" 2>/dev/null | head -1 || echo "")

if [ "$STORED_IP" != "$CURRENT_IP" ] && [ -n "$STORED_IP" ]; then
  warn "IP changed from $STORED_IP → $CURRENT_IP. Updating config files..."

  # Update capacitor.config.ts (Vite dev server URL for simulator)
  sed -i '' "s|http://$STORED_IP:5173|http://$CURRENT_IP:5173|g" "$CAPACITOR_CONFIG"

  # Update EXTRA_CORS_ORIGINS in .env (IP-based origin for CORS only, NOT the redirect URI)
  # GOOGLE_REDIRECT_URI must stay as localhost — Google blocks private IPs in redirect URIs
  sed -i '' "s|EXTRA_CORS_ORIGINS=http://$STORED_IP:5173|EXTRA_CORS_ORIGINS=http://$CURRENT_IP:5173|g" "$ENV_FILE"

  ok "Config files updated."
fi

# ── Kill any leftover processes on ports 3001 and 5173 ───────────────────────
log "Freeing ports 3001 and 5173..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# ── Start backend ─────────────────────────────────────────────────────────────
log "Starting backend server..."
osascript -e "tell application \"Terminal\" to do script \"cd '$ROOT/apps/server' && npm run dev\""

# ── Start frontend ────────────────────────────────────────────────────────────
log "Starting frontend dev server..."
osascript -e "tell application \"Terminal\" to do script \"cd '$ROOT/apps/client' && npm run dev\""

# ── Wait for both servers to be ready ─────────────────────────────────────────
log "Waiting for servers to start..."
for i in $(seq 1 20); do
  BACKEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")
  FRONTEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "000")
  if [ "$BACKEND_OK" = "200" ] && [ "$FRONTEND_OK" = "200" ]; then
    break
  fi
  sleep 1
done

if [ "$BACKEND_OK" != "200" ]; then
  warn "Backend may not be ready yet — check the Terminal window."
fi
if [ "$FRONTEND_OK" != "200" ]; then
  warn "Frontend may not be ready yet — check the Terminal window."
fi

# ── Sync Capacitor and open Xcode ─────────────────────────────────────────────
log "Syncing Capacitor..."
cd "$ROOT/apps/client" && npx cap sync ios --inline 2>&1

ok "Opening Xcode..."
npx cap open ios

ok "Done! Press ▶ Run in Xcode to launch the simulator."
ok "Simulator loads from: http://$CURRENT_IP:5173"
warn "Google login only works in the browser (http://localhost:5173) — Google blocks private IPs in OAuth redirects."
