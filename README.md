# Optimizze

Optimizze is a Next.js-based media conversion and optimization tool for images and videos.

It supports batch uploads via the UI, per-file output format selection, a quality slider, individual downloads, and “download all” as a ZIP.

## Table of contents

- Overview
- Architecture
- Requirements
- Setup & run
- Usage
- API
- Configuration
- Troubleshooting

## Overview

**Primary goal:** convert uploaded media into web-friendly formats with controllable quality.

**Supported outputs** (current UI):

- Images: `webp`, `png`, `jpg`, `avif`
- Videos: `mp4`, `webm`

## Architecture

Optimizze uses a **hybrid conversion pipeline**:

1. **Client-side (browser) conversion** for most images

- Uses `@ffmpeg/ffmpeg` (WebAssembly) with the multi-threaded core.
- Requires `SharedArrayBuffer`, which is enabled via `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers (configured in `next.config.mjs`).

2. **Server-side conversion** for:

- All videos
- AVIF input or output (due to browser FFmpeg WASM limitations)

Server conversion is implemented in the `/api/convert` route using `fluent-ffmpeg`, which calls a system FFmpeg binary.

## Requirements

- Node.js: Next.js 16 requires Node `>= 20.9.0`
- Package manager: `pnpm` is recommended (repo includes `pnpm-lock.yaml`)

For server conversions (video/AVIF), you also need a working FFmpeg binary (see **Configuration → FFmpeg**).

## Setup & run

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
pnpm start
```

Then open:

- http://localhost:3000

## Usage

1. Open the app and upload one or more files (drag & drop or click).
2. For each file, choose output format and quality.
3. Click **Start Processing**.
4. Download each converted file, or use **Download All (ZIP)**.

## API

### `POST /api/convert`

Converts a single file using server-side FFmpeg.

**Request**

- Content-Type: `multipart/form-data`
- Fields:
  - `file` (required): the uploaded file
  - `format` (required): output extension (e.g. `mp4`, `webm`, `webp`, `jpg`, `png`, `avif`)
  - `quality` (optional): integer `10..100` (defaults to `80`)
  - `type` (optional): `image` or `video` (defaults to `video` behavior if you pass a video)

**Response**

- Success: binary response with `Content-Type` based on `format` and `Content-Disposition: attachment`
- Error: JSON `{ "error": "..." }` with HTTP 4xx/5xx

**Example (curl)**

```bash
curl -X POST http://localhost:3000/api/convert \
	-F "file=@./input.mp4" \
	-F "format=webm" \
	-F "quality=80" \
	-o output.webm
```

## Configuration

### FFmpeg (server conversion)

The server route needs an FFmpeg executable.

Optimizze will try to locate FFmpeg in this order:

1. `FFMPEG_PATH` (or `FFMPEG_BIN`) environment variable
2. `ffmpeg-static` (if its binary exists)
3. Bundled FFmpeg from `@ffmpeg-installer/ffmpeg` (works well on Windows + pnpm)
4. System `ffmpeg` available on PATH

**Recommended (cross-platform):** keep `@ffmpeg-installer/ffmpeg` installed (already in `dependencies`).

**Alternative:** install FFmpeg system-wide and ensure `ffmpeg` is on PATH.

### Cross-origin isolation (client FFmpeg WASM)

The browser FFmpeg engine uses the multi-threaded core, which requires `SharedArrayBuffer`.

This repo enables the required headers for all routes in `next.config.mjs`:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

## Troubleshooting

### “FFmpeg binary not found” / `/api/convert` returns 500

- Ensure `@ffmpeg-installer/ffmpeg` is installed: `pnpm install`
- Or set `FFMPEG_PATH` to a valid `ffmpeg` executable path
- Or install FFmpeg and verify `ffmpeg -version` works in your terminal

### pnpm warns: “Ignored build scripts”

Some dependencies download binaries during install (for example `ffmpeg-static`). If pnpm blocks scripts, those binaries may be missing.

- If you want `ffmpeg-static` to work, run: `pnpm approve-builds` (then reinstall/rebuild)
- Otherwise, rely on `@ffmpeg-installer/ffmpeg` or a system FFmpeg install

### Browser shows: “SharedArrayBuffer is not supported”

- Confirm you’re running the app with the headers enabled (see `next.config.mjs`).
- Use Chrome/Edge on a secure context (localhost is OK for dev).

### Large files / timeouts

Server conversion writes to the OS temp directory and processes files synchronously per request.

- For very large videos, prefer running locally or increasing server limits/timeouts in your deployment environment.

## Notes

- The server-side FFmpeg approach is intended for local/dev and self-hosted deployments. If you deploy to a serverless environment, ensure FFmpeg binaries are supported and available.
