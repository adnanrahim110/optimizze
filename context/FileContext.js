"use client";

import React, { createContext, useCallback, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const FileContext = createContext(null);

export function FileProvider({ children }) {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addFiles = useCallback((newFiles) => {
    const fileEntries = Array.from(newFiles).map(file => ({
      id: uuidv4(),
      file,
      status: 'idle',
      progress: 0,
      outputBlob: null,
      outputExt: null,
      downloadUrl: null,
      settings: {
        format: file.type.startsWith('image') ? 'webp' : 'mp4',
        quality: 80,
      }
    }));
    setFiles(prev => [...prev, ...fileEntries]);
  }, []);

  const updateFileStatus = useCallback((id, status, progress = 0) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, status, progress } : f
    ));
  }, []);

  const updateFileSuccess = useCallback((id, downloadUrl, outputSize) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, status: 'completed', progress: 100, downloadUrl, outputSize } : f
    ));
  }, []);

  const updateFileSettings = useCallback((id, settings) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, settings: { ...f.settings, ...settings } } : f
    ));
  }, []);

  const removeFile = useCallback((id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const retryFile = useCallback((id) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, status: 'idle', progress: 0 } : f
    ));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  return (
    <FileContext.Provider value={{
      files,
      addFiles,
      removeFile,
      retryFile,
      clearAll,
      updateFileStatus,
      updateFileSuccess,
      updateFileSettings,
      isProcessing,
      setIsProcessing
    }}>
      {children}
    </FileContext.Provider>
  );
}

export const useFileContext = () => useContext(FileContext);
