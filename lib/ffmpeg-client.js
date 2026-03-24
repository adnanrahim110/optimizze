import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

class FFmpegService {
  constructor() {
    this.ffmpeg = null;
    this.isLoading = false;
  }

  async load() {
    if (this.ffmpeg) return this.ffmpeg;
    if (this.isLoading) {
      while (this.isLoading) {
        await new Promise(r => setTimeout(r, 100));
      }
      return this.ffmpeg;
    }

    this.isLoading = true;
    try {
      if (typeof window !== 'undefined' && !window.SharedArrayBuffer) {
        throw new Error("SharedArrayBuffer is not supported. Please use a secure context (HTTPS/localhost).");
      }

      const ffmpeg = new FFmpeg();
      // Use Multi-Threaded Core
      const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd';

      const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout loading FFmpeg assets")), ms));

      const loadPromise = ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
      });

      await Promise.race([loadPromise, timeout(30000)]);

      this.ffmpeg = ffmpeg;
      return ffmpeg;
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      this.isLoading = false;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  getInstance() {
    return this.ffmpeg;
  }
}

export const ffmpegService = new FFmpegService();
