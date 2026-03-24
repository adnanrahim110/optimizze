import { execFileSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { NextResponse } from 'next/server';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

function normalizeRootPath(filePath) {
  if (!filePath) return filePath;
  if (filePath.startsWith('/ROOT') || filePath.startsWith('\\ROOT')) {
    return filePath.replace(/^(\/|\\)ROOT/, process.cwd());
  }
  return filePath;
}

function fileExists(filePath) {
  return typeof filePath === 'string' && filePath.length > 0 && fs.existsSync(filePath);
}

function findFfmpegOnPath() {
  try {
    if (process.platform === 'win32') {
      const out = execFileSync('where', ['ffmpeg'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const first = out.split(/\r?\n/).map(s => s.trim()).filter(Boolean)[0];
      return fileExists(first) ? first : null;
    }

    const out = execFileSync('which', ['ffmpeg'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const first = out.split(/\r?\n/).map(s => s.trim()).filter(Boolean)[0];
    return fileExists(first) ? first : null;
  } catch {
    return null;
  }
}

function getFfmpegInstallerPlatformFolder() {
  if (process.platform === 'win32') {
    if (process.arch === 'x64') return 'win32-x64';
    if (process.arch === 'ia32') return 'win32-ia32';
    return null;
  }
  if (process.platform === 'darwin') {
    if (process.arch === 'arm64') return 'darwin-arm64';
    if (process.arch === 'x64') return 'darwin-x64';
    return null;
  }
  if (process.platform === 'linux') {
    if (process.arch === 'arm64') return 'linux-arm64';
    if (process.arch === 'arm') return 'linux-arm';
    if (process.arch === 'ia32') return 'linux-ia32';
    if (process.arch === 'x64') return 'linux-x64';
    return null;
  }
  return null;
}

function findBundledFfmpegBinary() {
  const platformFolder = getFfmpegInstallerPlatformFolder();
  if (!platformFolder) return null;

  const exeName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const cwd = process.cwd();

  const directCandidates = [
    // If hoisted
    path.join(cwd, 'node_modules', '@ffmpeg-installer', platformFolder, exeName),
    // If nested under @ffmpeg-installer/ffmpeg
    path.join(cwd, 'node_modules', '@ffmpeg-installer', 'ffmpeg', 'node_modules', '@ffmpeg-installer', platformFolder, exeName),
  ];

  for (const candidate of directCandidates) {
    if (fileExists(candidate)) return candidate;
  }

  // pnpm layout: node_modules/.pnpm/<pkg>@<ver>/node_modules/@ffmpeg-installer/<platform>/ffmpeg(.exe)
  const pnpmStore = path.join(cwd, 'node_modules', '.pnpm');
  try {
    if (!fs.existsSync(pnpmStore)) return null;

    const entries = fs.readdirSync(pnpmStore, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    const ffmpegInstallerRoots = entries
      .filter(name => name.startsWith('@ffmpeg-installer+ffmpeg@'))
      .sort();

    for (const root of ffmpegInstallerRoots) {
      const base = path.join(pnpmStore, root, 'node_modules', '@ffmpeg-installer');
      const siblingExe = path.join(base, platformFolder, exeName);
      if (fileExists(siblingExe)) return siblingExe;

      const nestedExe = path.join(base, 'ffmpeg', 'node_modules', '@ffmpeg-installer', platformFolder, exeName);
      if (fileExists(nestedExe)) return nestedExe;
    }
  } catch {
    return null;
  }

  return null;
}

function resolveFfmpegBinaryPath() {
  const envCandidates = [
    process.env.FFMPEG_PATH,
    process.env.FFMPEG_BIN,
  ].map(normalizeRootPath);

  for (const candidate of envCandidates) {
    if (fileExists(candidate)) return candidate;
  }

  const staticCandidate = normalizeRootPath(ffmpegPath);
  if (fileExists(staticCandidate)) return staticCandidate;

  const bundledCandidate = findBundledFfmpegBinary();
  if (fileExists(bundledCandidate)) return bundledCandidate;

  return findFfmpegOnPath();
}

let resolvedBinaryPath = resolveFfmpegBinaryPath();
if (resolvedBinaryPath) ffmpeg.setFfmpegPath(resolvedBinaryPath);

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('file');
  const format = formData.get('format');
  const quality = parseInt(formData.get('quality') || '80');
  const type = formData.get('type') || 'video';

  if (!file || !format) {
    return NextResponse.json({ error: 'Missing file or format' }, { status: 400 });
  }

  const tempDir = os.tmpdir();
  const id = uuidv4();
  const inputPath = path.join(tempDir, `input_${id}_${file.name}`);
  const outputPath = path.join(tempDir, `output_${id}.${format}`);

  try {
    if (!resolvedBinaryPath) {
      resolvedBinaryPath = resolveFfmpegBinaryPath();
      if (resolvedBinaryPath) ffmpeg.setFfmpegPath(resolvedBinaryPath);
    }

    if (!resolvedBinaryPath) {
      throw new Error(
        'FFmpeg binary not found. Install FFmpeg and ensure it is on PATH, or set FFMPEG_PATH (or FFMPEG_BIN) to a valid ffmpeg executable. If you rely on ffmpeg-static, re-run install scripts (e.g. pnpm rebuild ffmpeg-static) so ffmpeg.exe is downloaded.'
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(inputPath, buffer);

    await new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      if (type === 'image') {
        // Image conversion
        if (format === 'avif') {
          // Higher CRF = smaller file, range 0-63
          // quality 100 -> crf 20, quality 50 -> crf 35, quality 10 -> crf 50
          const crf = Math.round(20 + ((100 - quality) * 0.35));
          command
            .outputOptions([
              '-c:v', 'libaom-av1',
              '-crf', String(crf),
              '-cpu-used', '6',
              '-row-mt', '1',
              '-tiles', '2x2',
              '-still-picture', '1',
              '-aom-params', 'enable-chroma-deltaq=1:deltaq-mode=3'
            ]);
        } else if (format === 'webp') {
          command
            .outputOptions([
              '-q:v', String(quality),
              '-compression_level', '6'
            ]);
        } else if (format === 'jpg' || format === 'jpeg') {
          // qscale 2-31 (lower = better quality), map quality 100->2, quality 10->31
          const qscale = Math.round(2 + ((100 - quality) * 0.29));
          command
            .outputOptions([
              '-qscale:v', String(qscale)
            ]);
        } else if (format === 'png') {
          command
            .outputOptions([
              '-compression_level', '9'
            ]);
        }
      } else if (format === 'mp4') {
        command
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            '-crf', String(Math.max(18, 51 - (quality / 2))),
            '-preset', 'ultrafast',
            '-movflags', '+faststart'
          ]);
      } else if (format === 'webm') {
        command
          .videoCodec('libvpx')
          .outputOptions([
            '-crf', String(Math.max(4, 63 - (quality / 1.5))),
            '-b:v', '1M',
            '-deadline', 'realtime',
            '-cpu-used', '4'
          ]);
      }

      command
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    const outputBuffer = await fs.promises.readFile(outputPath);

    await Promise.all([
      fs.promises.unlink(inputPath).catch(() => { }),
      fs.promises.unlink(outputPath).catch(() => { })
    ]);

    // Determine content type based on format
    const contentTypes = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      avif: 'image/avif',
      webp: 'image/webp',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png'
    };
    const contentType = contentTypes[format] || 'application/octet-stream';

    return new NextResponse(outputBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="converted.${format}"`,
      },
    });

  } catch (error) {
    console.error('Server FFmpeg Error:', error);
    try {
      await fs.promises.unlink(inputPath).catch(() => { });
      await fs.promises.unlink(outputPath).catch(() => { });
    } catch { }

    return NextResponse.json({ error: 'Conversion failed: ' + error.message }, { status: 500 });
  }
}
