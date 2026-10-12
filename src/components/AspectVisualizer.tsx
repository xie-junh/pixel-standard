import React from 'react';
import { formatPixels, formatMegapixels } from '../utils/calculator';
import { useLanguage } from '../i18n/LanguageContext';

interface AspectVisualizerProps {
  width: number;
  height: number;
  aspectRatioLabel: string;
  multiple?: number;
  label?: string;
  maxContainerHeight?: number;
  originalWidth?: number;
  originalHeight?: number;
}

export const AspectVisualizer: React.FC<AspectVisualizerProps> = ({
  width,
  height,
  aspectRatioLabel,
  multiple,
  label,
  maxContainerHeight = 180,
  originalWidth,
  originalHeight,
}) => {
  const { t, language } = useLanguage();
  const effectiveLabel = label || t.crop.inspectorTitle.slice(0, 6) || (language === 'zh' ? '画幅几何预览' : 'Geometric Preview');

  if (!width || !height) return null;

  const isCropComparison = Boolean(
    originalWidth &&
    originalHeight &&
    (originalWidth !== width || originalHeight !== height)
  );

  // Compute scaled bounding box inside container
  const baseW = isCropComparison ? Math.max(width, originalWidth!) : width;
  const baseH = isCropComparison ? Math.max(height, originalHeight!) : height;
  const ratio = baseW / baseH;

  let containerW = 240;
  let containerH = containerW / ratio;

  if (containerH > maxContainerHeight) {
    containerH = maxContainerHeight;
    containerW = containerH * ratio;
  }
  if (containerW > 300) {
    containerW = 300;
    containerH = containerW / ratio;
  }

  const scale = containerW / baseW;
  const cropBoxW = Math.round(width * scale);
  const cropBoxH = Math.round(height * scale);
  const origBoxW = Math.round((originalWidth || width) * scale);
  const origBoxH = Math.round((originalHeight || height) * scale);

  const totalPx = width * height;

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-900/60 border border-slate-800">
      <div className="flex items-center justify-between w-full mb-3 text-xs text-slate-400">
        <span className="font-medium text-slate-300">{effectiveLabel}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-indigo-400 font-semibold">{aspectRatioLabel}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="font-mono tabular-nums text-slate-400">{formatMegapixels(totalPx)}</span>
        </div>
      </div>

      {/* Visual Bounding Box Container */}
      <div className="h-44 w-full flex items-center justify-center relative bg-slate-950/40 rounded border border-slate-800/80 overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* If Crop Comparison: Show Original Outer Box with Trimmed Areas */}
        {isCropComparison ? (
          <div
            style={{ width: `${origBoxW}px`, height: `${origBoxH}px` }}
            className="relative rounded border border-dashed border-slate-600 bg-rose-950/20 flex items-center justify-center transition-all duration-300"
          >
            {/* The active cropped inner box */}
            <div
              style={{ width: `${cropBoxW}px`, height: `${cropBoxH}px` }}
              className="relative rounded border-2 border-indigo-400 bg-indigo-950/70 flex flex-col items-center justify-center shadow-lg shadow-indigo-950/70"
            >
              <div className="text-center z-10 px-2 py-1 bg-slate-950/90 rounded border border-indigo-500/40 backdrop-blur-xs">
                <div className="font-mono tabular-nums font-bold text-slate-100 text-xs">
                  {width} <span className="text-slate-500 font-normal">×</span> {height}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono tabular-nums">
                  {language === 'zh' ? '裁后留存' : 'Retained'} {formatPixels(totalPx)} px
                </div>
              </div>
            </div>

            {/* Original label tag */}
            <div className="absolute -top-3 left-1 px-1.5 bg-slate-900 border border-slate-700 rounded text-[9px] font-mono text-slate-400">
              {language === 'zh' ? '原图' : 'Source'} {originalWidth}×{originalHeight}
            </div>
          </div>
        ) : (
          /* Standard Single Box */
          <div
            style={{ width: `${cropBoxW}px`, height: `${cropBoxH}px` }}
            className="relative rounded border-2 border-indigo-500/80 bg-indigo-950/30 flex flex-col items-center justify-center transition-all duration-300 shadow-md shadow-indigo-950/50"
          >
            <div className="text-center z-10 px-2 py-1 bg-slate-950/80 rounded border border-indigo-500/30 backdrop-blur-xs">
              <div className="font-mono tabular-nums font-bold text-slate-100 text-xs sm:text-sm">
                {width} <span className="text-slate-500 font-normal">×</span> {height}
              </div>
              <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                {formatPixels(totalPx)} px
              </div>
            </div>

            {/* Width label indicator top */}
            <div className="absolute -top-3 px-1.5 bg-slate-900 border border-slate-700 rounded text-[10px] font-mono text-slate-300">
              {t.common.width}: {width}px
            </div>

            {/* Height label indicator right */}
            <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 rotate-90 px-1 bg-slate-900 border border-slate-700 rounded text-[10px] font-mono text-slate-300 whitespace-nowrap">
              {t.common.height}: {height}px
            </div>
          </div>
        )}
      </div>

      {/* Multiple alignment badge info */}
      {multiple && multiple > 1 && (
        <div className="mt-2.5 flex items-center justify-between w-full text-[11px] text-slate-400">
          <span>{language === 'zh' ? `倍数约束: ${multiple} 像素对齐` : `Constraint: Align to ${multiple}px`}</span>
          <span className="font-mono text-emerald-400">
            {width % multiple === 0 && height % multiple === 0
              ? (language === 'zh' ? `✓ 宽模${multiple}=0 / 高模${multiple}=0` : `✓ W%${multiple}=0 / H%${multiple}=0`)
              : (language === 'zh' ? `需校验模数` : `Verify multiple`)}
          </span>
        </div>
      )}
    </div>
  );
};

