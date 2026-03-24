"use client";

import { useFileContext } from "@/context/FileContext";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Loader2, X } from "lucide-react";
import React from "react";

function FileItem({ fileData }) {
  const { removeFile, retryFile, updateFileSettings } = useFileContext();
  const { file, status, progress, settings } = fileData;
  const isImage = file.type.startsWith("image");
  const isVideo = file.type.startsWith("video");
  const [thumbnail, setThumbnail] = React.useState(null);

  React.useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setThumbnail(url);
      return () => URL.revokeObjectURL(url);
    } else if (isVideo) {
      // Create video thumbnail
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.currentTime = 1;
      video.onloadeddata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, 48, 48);
        setThumbnail(canvas.toDataURL());
        URL.revokeObjectURL(video.src);
      };
    }
  }, [file, isImage, isVideo]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      layout
      className={cn(
        "border-b-2 border-black grid grid-cols-[auto_1fr_auto] gap-4 p-6 items-center bg-white group last:border-b-0",
        status === "error" && "bg-red-50"
      )}
    >
      <div className="w-12 h-12 flex items-center justify-center border-2 border-black bg-gray-50 font-mono text-xs shrink-0 overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          file.name.split(".").pop().slice(0, 3).toUpperCase()
        )}
      </div>

      <div className="flex flex-col min-w-0">
        <h3 className="font-bold text-lg truncate pr-4">{file.name}</h3>
        <div className="flex gap-4 items-center text-xs font-mono uppercase mt-1 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                status === "completed" && "line-through opacity-50 decoration-1"
              )}
            >
              {file.size < 1024 * 1024
                ? `${(file.size / 1024).toFixed(2)} KB`
                : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
            </span>
            {status === "completed" && fileData.outputSize && (
              <span className="font-bold text-green-600">
                -&gt;{" "}
                {fileData.outputSize < 1024 * 1024
                  ? `${(fileData.outputSize / 1024).toFixed(2)} KB`
                  : `${(fileData.outputSize / 1024 / 1024).toFixed(2)} MB`}
              </span>
            )}
          </div>
          <span className="w-px h-3 bg-black/20 hidden sm:block"></span>

          <select
            value={settings.format}
            onChange={(e) =>
              updateFileSettings(fileData.id, { format: e.target.value })
            }
            className="appearance-none bg-transparent border-b border-black outline-none font-bold hover:bg-black hover:text-white transition-colors cursor-pointer px-2 py-0.5"
            onClick={(e) => e.stopPropagation()}
            disabled={status !== "idle"}
          >
            {isImage ? (
              <>
                <option value="webp">WEBP</option>
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="avif">AVIF</option>
              </>
            ) : (
              <>
                <option value="mp4">MP4</option>
                <option value="webm">WEBM</option>
              </>
            )}
          </select>

          {status === "idle" && (
            <input
              type="range"
              min="10"
              max="100"
              value={settings.quality}
              onChange={(e) =>
                updateFileSettings(fileData.id, {
                  quality: parseInt(e.target.value),
                })
              }
              className="w-24 accent-black h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <span>Q:{settings.quality}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {status === "processing" && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{Math.round(progress)}%</span>
            <Loader2 className="animate-spin w-5 h-5" />
          </div>
        )}

        {status === "completed" && (
          <a
            href={fileData.downloadUrl}
            download={`optimizze_${file.name.split(".")[0]}.${settings.format}`}
            className="w-10 h-10 flex items-center justify-center bg-black text-white hover:bg-gray-800 transition-colors border-2 border-black"
          >
            <Download className="w-5 h-5" />
          </a>
        )}

        {status === "error" && (
          <button
            onClick={() => retryFile(fileData.id)}
            className="px-3 py-2 text-xs font-bold uppercase border-2 border-black text-black hover:bg-black hover:text-white transition-colors"
          >
            Retry
          </button>
        )}

        {status === "idle" && (
          <button
            onClick={() => removeFile(fileData.id)}
            className="w-10 h-10 flex items-center justify-center border-2 border-transparent hover:border-black hover:text-black active:bg-black active:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {status === "processing" && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-black transition-all duration-300 pointer-events-none"
          style={{ width: `${progress}%` }}
        />
      )}
    </motion.div>
  );
}

export default function FileQueue() {
  const { files } = useFileContext();
  const [isZipping, setIsZipping] = React.useState(false);

  if (files.length === 0) return null;

  const downloadAllZip = async () => {
    try {
      setIsZipping(true);
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      const completedFiles = files.filter(
        (f) => f.status === "completed" && f.downloadUrl
      );
      if (completedFiles.length === 0) return;

      await Promise.all(
        completedFiles.map(async (f) => {
          const response = await fetch(f.downloadUrl);
          const blob = await response.blob();
          const fileName = `${f.file.name.split(".")[0]}.${f.settings.format}`;
          zip.file(fileName, blob);
        })
      );

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = "optimizze_batch.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("ZIP Error:", error);
    } finally {
      setIsZipping(false);
    }
  };

  const completedCount = files.filter((f) => f.status === "completed").length;

  return (
    <div className="w-full flex flex-col shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)]">
      <div className="flex justify-between items-center py-4 border-2 border-black bg-black text-white px-6 shrink-0 sticky top-0 z-10">
        <h2 className="font-bold uppercase tracking-wider text-sm">
          Transfer Queue
        </h2>
        <div className="flex items-center gap-4">
          {completedCount > 1 && (
            <button
              onClick={downloadAllZip}
              disabled={isZipping}
              className="text-xs font-mono uppercase hover:underline disabled:opacity-50"
            >
              {isZipping ? "ZIPPING..." : "DOWNLOAD ALL (ZIP)"}
            </button>
          )}
          <span className="font-mono text-xs">
            {files.length} {files.length === 1 ? "FILE" : "FILES"}
          </span>
        </div>
      </div>

      <div className="border-l-2 border-r-2 border-b-2 border-black bg-white">
        <AnimatePresence mode="popLayout">
          {files.map((f) => (
            <FileItem key={f.id} fileData={f} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
