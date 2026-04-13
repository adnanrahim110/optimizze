<div align="center">
<img width="100%" src="https://raw.githubusercontent.com/trinib/trinib/82213791fa9ff58d3ca768ddd6de2489ec23ffca/images/header.svg" />
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

## 🎞️ Supported Formats

### 🖼️ Images
| Format | Input | Output | Engine |
|---|---|---|---|
| `webp` | ✅ | ✅ | Client (WASM) |
| `png` | ✅ | ✅ | Client (WASM) |
| `jpg` / `jpeg` | ✅ | ✅ | Client (WASM) |
| `avif` | ✅ | ✅ | Server (FFmpeg) |

### 🎬 Videos
| Format | Input | Output | Engine |
|---|---|---|---|
| `mp4` | ✅ | ✅ | Server (FFmpeg) |
| `webm` | ✅ | ✅ | Server (FFmpeg) |

---

## 📋 Requirements

| Requirement | Version |
|---|---|
| **Node.js** | >= 20.9.0 |
| **Package Manager** | `pnpm` (recommended) |
| **FFmpeg Binary** | Required for video/AVIF conversion |
| **Browser** | Chrome/Edge (for SharedArrayBuffer support) |

> **Note:** For server conversions (video/AVIF), a working FFmpeg binary is required. See [Configuration](#-configuration) for setup options.


## 🚀 Setup & Run

**1. Clone the repository**

```bash
git clone https://github.com/adnanrahim110/optimizze.git
cd optimizze
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Start the development server**

```bash
pnpm dev
```

**4. Build for production**

```bash
pnpm build
pnpm start
```

**5. Open in browser**

```
http://localhost:3000
```

---

## 📖 Usage

```
1. Open the app at http://localhost:3000
2. Upload one or more files (drag & drop or click to browse)
3. For each file, select the output format and adjust quality
4. Click "Start Processing"
5. Download files individually, or click "Download All" for a ZIP
```

---

## 🔌 API Reference

### `POST /api/convert`

Converts a single file using server-side FFmpeg.

**Request**

```
Content-Type: multipart/form-data
```

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | ✅ | The uploaded media file |
| `format` | string | ✅ | Output extension: `mp4`, `webm`, `webp`, `jpg`, `png`, `avif` |
| `quality` | integer | ❌ | Range: `10–100` — defaults to `80` |
| `type` | string | ❌ | `image` or `video` — defaults to video behavior |

**Response**

| Status | Response |
|---|---|
| ✅ Success | Binary file with `Content-Type` + `Content-Disposition: attachment` |
| ❌ Error | JSON `{ "error": "..." }` with HTTP `4xx` / `5xx` |

**Example (curl)**

```bash
curl -X POST http://localhost:3000/api/convert \
  -F "file=@./input.mp4" \
  -F "format=webm" \
  -F "quality=80" \
  -o output.webm
```

---

## ⚙️ Configuration

### FFmpeg Binary (Server Conversion)

Optimizze resolves the FFmpeg binary in this priority order:

```
1. FFMPEG_PATH or FFMPEG_BIN environment variable
2. ffmpeg-static (if binary exists)
3. @ffmpeg-installer/ffmpeg (recommended — works cross-platform)
4. System ffmpeg available on PATH
```

**Recommended setup (cross-platform):**

Keep `@ffmpeg-installer/ffmpeg` installed — it's already in the dependencies and works well on Windows + pnpm.

**Alternative:**

Install FFmpeg system-wide and verify it works:

```bash
ffmpeg -version
```

### Cross-Origin Isolation (Client WASM)

The browser FFmpeg engine requires `SharedArrayBuffer`, which needs these headers enabled. They're already configured in `next.config.mjs`:

```js
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

> These headers are applied globally to all routes automatically.

---

## 🛠️ Troubleshooting

<details>
<summary><strong>❌ "FFmpeg binary not found" / /api/convert returns 500</strong></summary>

- Ensure `@ffmpeg-installer/ffmpeg` is installed: `pnpm install`
- Or set `FFMPEG_PATH` to a valid ffmpeg executable path
- Or install FFmpeg system-wide and verify: `ffmpeg -version`

</details>

<details>
<summary><strong>⚠️ pnpm warns: "Ignored build scripts"</strong></summary>

Some dependencies download binaries during install (e.g. `ffmpeg-static`). If pnpm blocks scripts, those binaries may be missing.

To fix: run `pnpm approve-builds` then reinstall. Otherwise, rely on `@ffmpeg-installer/ffmpeg` or a system FFmpeg install.

</details>

<details>
<summary><strong>🌐 Browser shows: "SharedArrayBuffer is not supported"</strong></summary>

- Confirm you're running the app with headers enabled (check `next.config.mjs`)
- Use Chrome or Edge on a secure context (`localhost` is fine for dev)

</details>

<details>
<summary><strong>⏱️ Large files / timeouts</strong></summary>

Server conversion writes to the OS temp directory and processes files synchronously per request. For very large videos, prefer running locally or increasing server limits/timeouts in your deployment environment.

</details>

---
## 📝 Notes

- Server-side FFmpeg is intended for **local/dev and self-hosted** deployments
- If deploying to a **serverless environment**, ensure FFmpeg binaries are supported and available
- Client-side WASM conversion works fully offline once loaded

---

<div align="center">

**Built with 🔥 by [Adnan Rahim](https://github.com/adnanrahim110)**

[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=for-the-badge&logo=firefox&logoColor=white)](https://adnanrahim.infinityfree.me)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/adnan-rahim-4b94a5240)

</div>

<div align="center">
  <img width="100%" src="https://raw.githubusercontent.com/trinib/trinib/a5f17399d881c5651a89bfe4a621014b08346cf0/images/footer.svg" />
</div>
