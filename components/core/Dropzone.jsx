"use client";

import { useFileContext } from "@/context/FileContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import React, { useCallback, useState } from "react";

export default function Dropzone() {
  const { addFiles } = useFileContext();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files?.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleChange = useCallback(
    (e) => {
      if (e.target.files?.length) {
        addFiles(e.target.files);
      }
    },
    [addFiles]
  );

  return (
    <div className="w-full h-full min-h-100 relative group cursor-pointer flex flex-col">
      <input
        type="file"
        multiple
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-pointer"
        accept="image/*,video/*"
      />

      <motion.div
        animate={{
          scale: isDragOver ? 0.99 : 1,
          backgroundColor: isDragOver ? "#000" : "#fff",
          color: isDragOver ? "#fff" : "#000",
        }}
        transition={{ duration: 0.1, ease: "easeOut" }}
        className={cn(
          "h-full w-full border-4 border-dashed transition-all p-8 flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden group hover:border-accent-500 hover:bg-accent-50",
          isDragOver
            ? "border-accent-600 bg-accent-100 scale-[0.98]"
            : "border-gray-300 bg-gray-50",
          "active:scale-95 duration-200"
        )}
      >
        <div className="absolute top-6 right-6">
          <ArrowUpRight className="w-16 h-16 stroke-[1.5]" />
        </div>

        <div className="mt-auto pointer-events-none">
          <h1 className="text-[min(6vw,5rem)] leading-[0.8] font-negan uppercase">
            Upload
          </h1>
          <p className="mt-4 text-sm font-mono tracking-widest uppercase opacity-80">
            Drag & Drop or Click • Images & Videos
          </p>
        </div>
      </motion.div>

      <div className="absolute -z-10 -bottom-2 -right-2 w-full h-full border border-black/10 bg-black/5" />
    </div>
  );
}
