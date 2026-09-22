# ExifGuard

ExifGuard is a self-hostable web application and library suite for inspecting, spoofing, and stripping EXIF, XMP, and IPTC metadata from digital images. It provides both in-browser client-side metadata manipulation via WebAssembly and a central REST API for crowdsourced camera hardware profile synchronization.

## Features

- **Profile Cloning & EXIF Spoofing:** Injects realistic hardware metadata profiles (aperture, focal length, software build, lens model) into photos to obscure digital device fingerprints.
- **Complete Metadata Stripping:** Purges all APP1 through APP15 application segments (EXIF, XMP, IPTC, ICC profiles, Adobe IRB markers), producing clean binary images with zero metadata bytes.
- **Metadata Coherency Engine:** Validates optical and physical constraints (sensor aspect ratios, lens aperture range, focal length bounds, exposure parameters) to maintain physical plausibility.
- **Privacy Audit:** Scans input photos for PII leaks, including GPS latitude/longitude/altitude, device serial numbers, timestamps, and author metadata.
- **Client-Side Binary Processing:** Parses and modifies binary JPEG segments entirely in browser memory.
- **Crowdsourced Profile Database:** Local SQLite database backed by a REST API for sharing sanitized device metadata profiles.

## Architecture & Monorepo Packages

The project is structured as an npm monorepo with the following components:

- `apps/web`: React and Vite single-page frontend application.
- `apps/api`: Express backend REST API server managing persistent profile database storage.
- `packages/wasm-exif`: Client-side TIFF and EXIF binary parser, metadata stripper, and APP1 segment generator.
- `packages/coherency-engine`: Optical validation rules, physical constraint checker, and PII risk assessment audit module.
- `packages/seed-profiles`: Pre-configured hardware profile definitions for major camera models and smartphones.
- `packages/database-schema`: SQLite database schema definition and migration utilities.
- `docker/`: Docker container manifests for multi-stage production builds and backend services.

## Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Docker & Docker Compose (optional, for containerized deployments)
- Nix package manager (optional, for nix-shell development environments)

## Installation & Local Development

### Automated Setup
To automatically check prerequisites, install dependencies, and build all monorepo packages, run:

```bash
./install.sh
```

Or via npm:

```bash
npm run setup
```

### Manual Setup
```bash
# 1. Clone repository
git clone https://github.com/Elxes04/exifguard.git
cd exifguard

# 2. Install dependencies
npm install

# 3. Build workspace packages
npm run build

# 4. Start development servers
npm run dev:all     # Runs both API and Web servers concurrently
```

The web application will be accessible at `http://localhost:3000` and the central API server at `http://localhost:8080`.

## Docker & Coolify Deployment

ExifGuard is optimized for deployment on **Coolify** and standard Docker Compose environments.

### Coolify Deployment

1. **Create New Resource**: In Coolify, select **Docker Compose** or **Public Repository**.
2. **Connect Repository**: Point to `https://github.com/Elxes04/exifguard.git`.
3. **Build Type**: Coolify will automatically detect `docker-compose.yml` in the root directory.
4. **Environment Variables**: Set optional custom environment variables in Coolify UI:
   - `WEB_PORT=3000`
   - `API_PORT=8080`
   - `VITE_PUBLIC_API_URL=/api`
5. **Deploy**: Click **Deploy**. Coolify will build both services with healthcheck verification.

### Local Docker Compose

To run the full stack using Docker Compose:

```bash
docker compose up -d
```

This starts:
- `exifguard-web`: Nginx web server hosting the compiled frontend on port `3000` (with built-in SPA routing & `/api/` reverse proxy).
- `exifguard-api`: Node.js central profile REST API server on port `8080` backed by SQLite.

## Nix Environment

A `shell.nix` configuration is provided for Nix OS users:

```bash
nix-shell
```

This sets up Node.js 20, pnpm, and SQLite in a hermetic shell environment.

## API Specification

### `GET /api/profiles`
Returns all registered hardware profiles from the database.

**Response:**
```json
[
  {
    "id": "apple_iphone_13_pro",
    "name": "Apple iPhone 13 Pro (Main Camera)",
    "category": "Smartphone",
    "device": {
      "make": "Apple",
      "model": "iPhone 13 Pro",
      "software": "iOS 16.5"
    },
    "lens": {
      "make": "Apple",
      "model": "iPhone 13 Pro back triple camera 5.7mm f/1.5",
      "min_focal_length": 5.7,
      "max_focal_length": 5.7,
      "focal_length_35mm": 26,
      "min_aperture": 1.5,
      "max_aperture": 1.5
    }
  }
]
```

### `POST /api/profiles`
Submits a sanitized hardware profile to the central database.

**Request Body:**
```json
{
  "device_make": "motorola",
  "device_model": "moto g86 5G",
  "sanitized_tags": {
    "Make": "motorola",
    "Model": "moto g86 5G",
    "Software": "Android 14"
  }
}
```

### `GET /api/stats`
Returns system metadata statistics.

**Response:**
```json
{
  "total_profiles": 5,
  "contributed_profiles": 1,
  "supported_categories": ["Smartphone", "Mirrorless", "DSLR"]
}
```

## License

MIT License. See LICENSE for details.
