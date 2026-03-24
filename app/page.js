"use client";

import Dropzone from '@/components/core/Dropzone';
import FileQueue from '@/components/core/FileQueue';
import { FileProvider, useFileContext } from '@/context/FileContext';
import { useToast } from '@/context/ToastContext';
import { ffmpegService } from '@/lib/ffmpeg-client';
import { cn } from '@/lib/utils';
import { fetchFile } from '@ffmpeg/util';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

function ConversionController() {
  const { files, updateFileStatus, updateFileSuccess, isProcessing, setIsProcessing, clearAll } = useFileContext();
  const { addToast } = useToast();
  const [ffmpegReady, setFfmpegReady] = useState(false);

  useEffect(() => {
    const loadEngine = async () => {
      try {
        await ffmpegService.load();
        setFfmpegReady(true);
      } catch (e) {
        console.error("FFmpeg Load Error:", e);
        addToast(`Engine failed to load: ${e.message}. Check console.`, 'error');
      }
    };
    loadEngine();
  }, []);

  const processQueue = async () => {
    if (isProcessing || !ffmpegReady) return;
    setIsProcessing(true);

    setIsProcessing(true);

    const ffmpeg = await ffmpegService.load();
    if (!ffmpeg) {
      console.error("FFmpeg instance is null after load");
      setIsProcessing(false);
      return;
    }

    for (const fileItem of files) {
      if (fileItem.status === 'completed') continue;

      updateFileStatus(fileItem.id, 'processing', 0);

      try {
        const { file, id, settings } = fileItem;
        const isVideo = file.type.startsWith('video');
        const inputExt = file.name.split('.').pop().toLowerCase();

        // Route to server: videos, AVIF output, or AVIF input (client FFmpeg WASM doesn't support AVIF)
        const needsServerProcessing = isVideo || settings.format === 'avif' || inputExt === 'avif';

        if (needsServerProcessing) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('format', settings.format);
          formData.append('quality', settings.quality.toString());
          formData.append('type', isVideo ? 'video' : 'image');

          const response = await fetch('/api/convert', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Server conversion failed');
          }

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          updateFileSuccess(id, url, blob.size);

        } else {
          const ext = file.name.split('.').pop();
          const inputName = `input_${id}.${ext}`;
          const outputName = `output_${id}.${settings.format}`;

          await ffmpeg.writeFile(inputName, await fetchFile(file));

          const progressHandler = ({ progress }) => {
            updateFileStatus(id, 'processing', progress * 100);
          };
          ffmpeg.on('progress', progressHandler);
          const cmd = [];
          cmd.push('-i', inputName);

          if (settings.format === 'webp') {
            cmd.push('-q:v', settings.quality.toString());
          }

          cmd.push(outputName);

          await ffmpeg.exec(cmd);

          const data = await ffmpeg.readFile(outputName);
          const blob = new Blob([data.buffer], { type: `image/${settings.format}` });
          const url = URL.createObjectURL(blob);

          await ffmpeg.deleteFile(outputName);
          ffmpeg.off('progress', progressHandler);

          updateFileSuccess(id, url, blob.size);
        }

      } catch (e) {
        console.error(e);
        const errorMsg = e.message || "Unknown error";
        updateFileStatus(fileItem.id, 'error', 0);
        addToast(`Failed: ${fileItem.file.name} - ${errorMsg}`, 'error');
      }
    }

    setIsProcessing(false);
    addToast('Queue processing finished', 'info');
  };

  const pendingCount = files.filter(f => f.status === 'idle').length;
  const completedCount = files.filter(f => f.status === 'completed').length;
  const allCompleted = files.length > 0 && completedCount === files.length;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-4">
      {pendingCount > 0 && !isProcessing && (
        <button
          onClick={processQueue}
          disabled={!ffmpegReady}
          className={cn(
            "bg-black text-white px-8 py-4 font-bold text-lg uppercase tracking-widest hover:bg-gray-800 border-2 border-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5",
            !ffmpegReady && "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          {ffmpegReady ? 'Start Processing' : 'Loading Engine...'}
        </button>
      )}

      {allCompleted && !isProcessing && (
        <button
          onClick={clearAll}
          className="bg-white text-black px-8 py-4 font-bold text-lg uppercase tracking-widest hover:bg-black hover:text-white border-2 border-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
        >
          Start New
        </button>
      )}

      {isProcessing && (
        <div className="bg-gray-100 border-2 border-black text-black px-8 py-4 flex items-center gap-3 font-bold uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
          <Loader2 className="animate-spin text-black" />
          Processing Queue...
        </div>
      )}
    </div>
  );
}

function OptimizzeApp() {
  const { files, addFiles } = useFileContext();
  const hasFiles = files.length > 0;
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = React.useRef(0);
  const containerRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const pointerRef = React.useRef({ x: 0, y: 0 });

  const setCursorVars = React.useCallback((x, y) => {
    const container = containerRef.current;
    if (!container) return;
    container.style.setProperty('--cursor-x', `${x}px`);
    container.style.setProperty('--cursor-y', `${y}px`);
  }, []);

  const handlePointerMove = (e) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    pointerRef.current = { x, y };

    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      setCursorVars(pointerRef.current.x, pointerRef.current.y);
      rafRef.current = null;
    });
  };

  const handlePointerLeave = () => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setCursorVars(rect.width / 2, rect.height / 2);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  useEffect(() => {
    dragCounter.current = 0;
    setIsDragging(false);
  }, [files.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setCursorVars(rect.width / 2, rect.height / 2);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [setCursorVars]);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen overflow-hidden flex flex-col items-center textured-canvas px-8 py-12 relative"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-100 bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-md overflow-hidden pointer-events-none"
          >
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute border border-white/30 rounded-full"
                initial={{ width: "150vw", height: "150vw", opacity: 0 }}
                animate={{
                  width: ["150vw", "20vw"],
                  height: ["150vw", "20vw"],
                  opacity: [0, 0.5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeInOut"
                }}
              />
            ))}

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: [1, 1.05, 1], y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ scale: { repeat: Infinity, duration: 1.5 } }}
              className="border-4 border-white p-12 text-center relative z-10 bg-black/20 backdrop-blur-sm"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="flex justify-center mb-4"
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
              </motion.div>
              <h2 className="text-[5rem] font-bold font-negan leading-none mb-4 tracking-wider text-title-gradient-dark">DROP IT</h2>
              <p className="font-mono uppercase tracking-widest text-sm">Right here to Optimize</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        layout
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className={cn(
          "mb-8 grid grid-cols-[1fr_auto] gap-2 items-end border-b-4 border-black shrink-0 z-20 bg-white",
          hasFiles ? "w-full max-w-350" : "w-full max-w-3xl"
        )}
      >
        <motion.div layout>
          <h1 className="text-[min(6vw,5rem)] font-negan tracking-tight text-title-gradient leading-none -mb-2">
            OPTiMIZZE
          </h1>
        </motion.div>

        <motion.div layout className="text-right hidden md:block">
          <div className="text-xs font-negan uppercase tracking-widest mb-1">Version <span className='font-sans font-bold'>1.0</span></div>
        </motion.div>
      </motion.header>

      <main className="w-full flex-1 min-h-0 flex gap-12 items-start relative max-w-350">
        <motion.div
          layout
          className={cn(
            "h-full flex flex-col will-change-transform z-10",
            hasFiles ? "w-1/2" : "w-full max-w-3xl mx-auto"
          )}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="text-sm font-negan uppercase tracking-widest mb-2 flex justify-between shrink-0">
            <span>Input Source</span>
            <span>Local System</span>
          </div>
          <div className="flex-1 min-h-0">
            <div onClick={() => document.getElementById('hidden-file-input')?.click()} className="h-full cursor-pointer">
              <Dropzone />
            </div>
            <input
              id="hidden-file-input"
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
              }}
            />
          </div>
        </motion.div>

        <AnimatePresence>
          {hasFiles && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
              className="w-1/2 h-full min-h-0 flex flex-col"
            >
              <div className="h-full overflow-y-auto pr-4 pb-32">
                <FileQueue />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ConversionController />
    </div>
  );
}

export default function Home() {
  return (
    <FileProvider>
      <OptimizzeApp />
    </FileProvider>
  );
}
