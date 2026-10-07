#!/bin/bash
# Double-click to run Tripcast on macOS. Stop with Ctrl+C or by closing the window.
cd "$(dirname "$0")" || exit 1
export PATH="$HOME/.local/node/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20.9 or newer is required: https://nodejs.org"
  open "https://nodejs.org/en/download"
  read -r -p "Press Enter to close..."
  exit 1
fi

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "Created .env.local. Add your GEMINI_API_KEY (see README.md)."
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install || { read -r -p "Install failed. Press Enter to close..."; exit 1; }
fi

(sleep 5 && open "http://localhost:3000") &
npm run dev
