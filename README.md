<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=2,12,24&height=160&section=header&text=Optimizze&fontSize=52&fontColor=ffffff&fontAlignY=55&animation=fadeIn&desc=Media+Conversion+%26+Optimization+Tool&descSize=18&descAlignY=78&descColor=a78bfa" />
</div>

<div align="center">
  <img src="https://readme-typing-svg.herokuapp.com/?font=Fira+Code&weight=600&size=20&center=true&vCenter=true&width=700&height=50&duration=3000&pause=800&color=A78BFA&lines=Convert+images+%26+videos+in+seconds+%E2%9A%A1;Batch+uploads+%2B+per-file+format+control;Client-side+WASM+%2B+server-side+FFmpeg;Built+with+Next.js+%F0%9F%9A%80" />
</div>

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white)
![WebAssembly](https://img.shields.io/badge/WebAssembly-654FF0?style=for-the-badge&logo=webassembly&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-a78bfa?style=for-the-badge)

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Supported Formats](#-supported-formats)
- [Requirements](#-requirements)
- [Setup & Run](#-setup--run)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)

---

## 🧠 Overview

**Optimizze** is a full-stack media conversion and optimization tool built with **Next.js**. It lets you upload images and videos in bulk, choose output formats per file, control quality with a slider, and download results individually or all at once as a ZIP.

Built for developers, designers, and content creators who need fast, controllable, web-friendly media output — without relying on third-party services.

<div align="center">

![Status](https://img.shields.io/badge/Status-Active-22c55e?style=flat-square)
![Type](https://img.shields.io/badge/Type-Open_Source_Tool-a78bfa?style=flat-square)
![Conversion](https://img.shields.io/badge/Conversion-Client_%2B_Server_Side-3b82f6?style=flat-square)
![Engine](https://img.shields.io/badge/Engine-FFmpeg_WASM_%2B_fluent--ffmpeg-f59e0b?style=flat-square)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗂️ **Batch Uploads** | Upload multiple files at once via drag & drop or file picker |
| 🎛️ **Per-file Format Control** | Choose output format independently for each file |
| 📊 **Quality Slider** | Fine-tune output quality from 10 to 100 per file |
| ⚡ **Client-side Conversion** | Images converted in the browser via FFmpeg WASM — no server round-trip |
| 🖥️ **Server-side Conversion** | Videos and AVIF processed via fluent-ffmpeg on the server |
| 📦 **Download All as ZIP** | Grab all converted files in one click |
| 🔒 **Cross-Origin Isolated** | SharedArrayBuffer enabled via COOP/COEP headers for multi-threaded WASM |

---

## 🏗️ Architecture

Optimizze uses a **hybrid conversion pipeline** designed for speed and compatibility:

```
┌─────────────────────────────────────────────────┐
│                   Browser (Client)               │
│                                                  │
│  Upload files ──► Format + Quality selection     │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  Images (non-AVIF)                      │    │
│  │  FFmpeg WASM (@ffmpeg/ffmpeg)           │    │
│  │  Multi-threaded via SharedArrayBuffer   │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  Videos + AVIF input/output             │    │
│  │  POST /api/convert ──► Server FFmpeg    │    │
│  │  fluent-ffmpeg + system/bundled binary  │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  Download individual files or ZIP bundle         │
└─────────────────────────────────────────────────┘
```

> **Why hybrid?** Browser FFmpeg WASM has limitations with AVIF and video codecs. Server-side FFmpeg handles these edge cases reliably while keeping image conversion fast and offline-capable.

---
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
