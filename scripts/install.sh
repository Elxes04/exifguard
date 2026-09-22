#!/usr/bin/env bash
set -e

echo "=================================================="
echo "ExifGuard - Installation & Setup"
echo "=================================================="

# Function to compare versions
version_gte() {
    [ "$1" = "$(echo -e "$1\n$2" | sort -V | head -n1)" ]
}

# 1. Check Node.js version
if command -v node >/dev/null 2>&1; then
    NODE_VER=$(node -v | sed 's/^v//')
    echo "[OK] Found Node.js v$NODE_VER"
    if ! node -e 'if (parseInt(process.versions.node.split(".")[0]) < 18) process.exit(1)'; then
        echo "[ERROR] Node.js version 18.0.0 or higher is required. Found v$NODE_VER"
        exit 1
    fi
else
    echo "[ERROR] Node.js is not installed. Please install Node.js 18.0.0 or higher."
    exit 1
fi

# 2. Check npm version
if command -v npm >/dev/null 2>&1; then
    NPM_VER=$(npm -v)
    echo "[OK] Found npm v$NPM_VER"
else
    echo "[ERROR] npm is not installed. Please install npm."
    exit 1
fi

# 3. Install npm dependencies across the monorepo
echo ""
echo "Installing workspace dependencies..."
npm install

# 4. Ensure backend data directory exists
echo ""
echo "Ensuring database directory exists..."
mkdir -p apps/api/data

# 5. Build all workspace packages
echo ""
echo "Building workspace packages & applications..."
npm run build

echo ""
echo "=================================================="
echo "ExifGuard installation completed successfully!"
echo "=================================================="
echo "To start local development:"
echo "  npm run dev          # Start web application"
echo "  npm run dev:api      # Start API server"
echo "  npm run dev:all      # Start both concurrently"
echo ""
echo "To run with Docker / Coolify:"
echo "  docker compose up -d"
echo "=================================================="
