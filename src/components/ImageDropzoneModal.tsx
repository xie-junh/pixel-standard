import React, { useState, useRef } from 'react';
import { X, Upload, ArrowRight } from 'lucide-react';
import { formatMegapixels, formatPixels, getSimplifiedRatio } from '../utils/calculator';
import { useLanguage } from '../i18n/LanguageContext';

interface ImageDropzoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDimensions: (w: number, h: number, mode: 'crop' | 'scale') => void;
}

export const ImageDropzoneModal: React.FC<ImageDropzoneModalProps> = ({
  isOpen,
  onClose,
  onApplyDimensions,
}) => {
  const { t } = useLanguage();
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    width: number;
    height: number;
    type: 'image' | 'video';
    previewUrl?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setFileInfo({
          name: file.name,
          width: img.naturalWidth,
          height: img.naturalHeight,
          type: 'image',
          previewUrl: url,
        });
      };
      img.src = url;
    } else if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        setFileInfo({
          name: file.name,
          width: video.videoWidth,
          height: video.videoHeight,
          type: 'video',
          previewUrl: url,
        });
      };
      video.src = url;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <Upload className="w-4 h-4 text-sky-400" />
          <span>{t.inspector.title}</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          {t.inspector.privacyTip}
        </p>

        {/* Dropzone Area */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-lg p-6 text-center cursor-pointer transition-colors bg-slate-950/40"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />

          <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-2">
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-slate-200">
            {t.inspector.dropPrompt}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {t.inspector.supportedFormats}
          </div>
        </div>

        {/* Inspected Details Card */}
        {fileInfo && (
          <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300 truncate max-w-[200px]">
                {fileInfo.name}
              </span>
              <span className="text-indigo-400 font-mono font-semibold">
                {t.common.aspectRatio} {getSimplifiedRatio(fileInfo.width, fileInfo.height)}
              </span>
            </div>

            <div className="flex items-baseline justify-between border-y border-slate-800/80 py-2">
              <div>
                <span className="text-[10px] text-slate-500 block">{t.inspector.detectedPhysicalRes}</span>
                <span className="text-lg font-bold font-mono text-white">
                  {fileInfo.width} × {fileInfo.height}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">{t.inspector.totalPixelsLabel}</span>
                <span className="text-xs font-mono text-sky-400">
                  {formatPixels(fileInfo.width * fileInfo.height)} px ({formatMegapixels(fileInfo.width * fileInfo.height)})
                </span>
              </div>
            </div>

            {/* Quick Action buttons to inject into tabs */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onApplyDimensions(fileInfo.width, fileInfo.height, 'crop');
                  onClose();
                }}
                className="py-2 px-3 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t.inspector.applyToCrop}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onApplyDimensions(fileInfo.width, fileInfo.height, 'scale');
                  onClose();
                }}
                className="py-2 px-3 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t.inspector.applyToScale}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

