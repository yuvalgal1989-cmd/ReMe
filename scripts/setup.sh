#!/bin/bash
set -e

echo "=== Reminder App Setup ==="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "Error: Node.js not found. Install from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node --version | cut -d. -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Error: Node.js 18+ required. Found: $(node --version)"
  exit 1
fi

echo "Node.js: $(node --version)"

# Create .env if not exists
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

if [ ! -f "$ROOT/.env" ]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
  echo ".env created from .env.example — please edit it with your API keys"
else
  echo ".env already exists"
fi

# Install server deps
echo ""
echo "Installing server dependencies..."
cd "$ROOT/apps/server"
npm install

# Install client deps
echo ""
echo "Installing client dependencies..."
cd "$ROOT/apps/client"
npm install

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Edit .env to add your API keys, then start the app with:"
echo ""
echo "  Terminal 1: cd apps/server && npm run dev"
echo "  Terminal 2: cd apps/client && npm run dev"
echo ""
echo "Then open http://localhost:5173"
