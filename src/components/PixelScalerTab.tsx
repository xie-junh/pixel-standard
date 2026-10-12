import React, { useState, useMemo } from 'react';
import {
  AlignmentMultiple,
  AspectRatioDef,
  ScaledResolutionResult,
} from '../types';
import { COMMON_ASPECT_RATIOS } from '../data/aspectRatios';
import {
  calculateBatchScaledResolutions,
  calculateScaledResolution,
  formatMegapixels,
  formatPixels,
  getSimplifiedRatio,
} from '../utils/calculator';
import { useLanguage } from '../i18n/LanguageContext';
import { AspectVisualizer } from './AspectVisualizer';
import { PixelNumberInput } from './PixelNumberInput';
import {
  Scaling,
  Sliders,
  Copy,
  Check,
  Zap,
  Grid,
  CheckCircle2,
  TrendingUp,
  Percent,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface PixelScalerTabProps {
  onCopyText: (text: string, label: string) => void;
  injectedDimensions?: { width: number; height: number } | null;
}

export const PixelScalerTab: React.FC<PixelScalerTabProps> = ({
  onCopyText,
  injectedDimensions,
}) => {
  const { t, language, getRatioName } = useLanguage();

  // Input method: 'from_source' | 'direct_pixels' (defaults to 'from_source')
  const [inputMode, setInputMode] = useState<'from_source' | 'direct_pixels'>('from_source');

  // Direct target pixels state (Default 1,048,576 = 1024x1024 = 1 Megapixel standard)
  const [targetPixels, setTargetPixels] = useState<number>(1048576);

  // Source image mode states
  const [srcWidth, setSrcWidth] = useState<number>(1920);
  const [srcHeight, setSrcHeight] = useState<number>(1080);
  const [scaleFactor, setScaleFactor] = useState<number>(1.5);
  const [scaleFactorText, setScaleFactorText] = useState<string>('1.5');
  const [isScaleFactorFocused, setIsScaleFactorFocused] = useState<boolean>(false);

  // Synchronize when injected dimensions arrive
  React.useEffect(() => {
    if (injectedDimensions && injectedDimensions.width > 0 && injectedDimensions.height > 0) {
      setSrcWidth(injectedDimensions.width);
      setSrcHeight(injectedDimensions.height);
      setInputMode('from_source');
      setSelectedRatioKey('source');
    }
  }, [injectedDimensions]);

  // Synchronize scaleFactor text buffer when external presets or sliders change
  React.useEffect(() => {
    if (!isScaleFactorFocused) {
      setScaleFactorText(String(scaleFactor));
    }
  }, [scaleFactor, isScaleFactorFocused]);

  // Source aspect ratio definition (dynamically derived from original width & height)
  const sourceRatioDef = useMemo<AspectRatioDef>(() => {
    const validW = srcWidth > 0 ? srcWidth : 1920;
    const validH = srcHeight > 0 ? srcHeight : 1080;
    const simplified = getSimplifiedRatio(validW, validH);
    return {
      key: 'source',
      name: language === 'zh' ? `保持原图比例 (${simplified})` : `Keep Source Ratio (${simplified})`,
      w: validW,
      h: validH,
      ratio: validW / validH,
      category: validW > validH ? 'landscape' : validW < validH ? 'portrait' : 'square',
      commonUsage: language === 'zh'
        ? `当前原图原始规格 ${validW}×${validH} 原生比例`
        : `Current source spec ${validW}×${validH} native ratio`,
    };
  }, [srcWidth, srcHeight, language]);

  // Available aspect ratios list: in from_source mode, '保持原图比例' is ranked first
  const availableRatios = useMemo<AspectRatioDef[]>(() => {
    if (inputMode === 'from_source') {
      return [sourceRatioDef, ...COMMON_ASPECT_RATIOS];
    }
    return COMMON_ASPECT_RATIOS;
  }, [inputMode, sourceRatioDef]);

  // Target aspect ratio selection (defaults to 'source' in from_source mode, or '16:9' in direct_pixels mode)
  const [selectedRatioKey, setSelectedRatioKey] = useState<string>('source');

  // Alignment multiple constraint
  const [multiple, setMultiple] = useState<AlignmentMultiple>(16);

  // Optimization preference
  const [optimizationGoal, setOptimizationGoal] = useState<'balanced' | 'strict_ratio' | 'max_pixels' | 'min_pixels'>('balanced');

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string, label: string) => {
    onCopyText(text, label);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Determine effective target pixels
  const effectiveTargetPixels = useMemo(() => {
    if (inputMode === 'from_source') {
      const srcTotal = srcWidth * srcHeight;
      return Math.round(srcTotal * (scaleFactor * scaleFactor));
    }
    return targetPixels;
  }, [inputMode, targetPixels, srcWidth, srcHeight, scaleFactor]);

  // Find selected Aspect Ratio definition
  const currentRatioDef = useMemo(() => {
    return (
      availableRatios.find((r) => r.key === selectedRatioKey) ||
      availableRatios[0]
    );
  }, [selectedRatioKey, availableRatios]);

  // 1. Single Primary Resolution Calculation
  const primaryResult = useMemo<ScaledResolutionResult>(() => {
    return calculateScaledResolution(
      effectiveTargetPixels,
      currentRatioDef,
      multiple,
      optimizationGoal
    );
  }, [effectiveTargetPixels, currentRatioDef, multiple, optimizationGoal]);

  // 2. Batch Matrix across all aspect ratios under this pixel budget (includes '保持原图比例' at top if from_source)
  const batchResults = useMemo<ScaledResolutionResult[]>(() => {
    if (inputMode === 'from_source') {
      const sourceResult = calculateScaledResolution(
        effectiveTargetPixels,
        sourceRatioDef,
        multiple,
        optimizationGoal
      );
      const commonResults = calculateBatchScaledResolutions(
        effectiveTargetPixels,
        multiple,
        optimizationGoal
      );
      return [sourceResult, ...commonResults];
    }
    return calculateBatchScaledResolutions(
      effectiveTargetPixels,
      multiple,
      optimizationGoal
    );
  }, [inputMode, effectiveTargetPixels, sourceRatioDef, multiple, optimizationGoal]);

  // Popular total pixel presets
  const pixelPresets = useMemo(() => [
    { label: '0.26 MP (512²)', pixels: 262144, desc: language === 'zh' ? 'SD 1.5 标清' : 'SD 1.5 Standard' },
    { label: '0.41 MP (480p)', pixels: 409920, desc: language === 'zh' ? '480p 标清' : '480p SD' },
    { label: '0.92 MP (720p)', pixels: 921600, desc: language === 'zh' ? 'HD 720p 视频' : 'HD 720p Video' },
    { label: '1.05 MP (1024²)', pixels: 1048576, desc: 'SDXL / FLUX 1MP' },
    { label: '2.07 MP (1080p)', pixels: 2073600, desc: 'FHD 1080p' },
    { label: '3.69 MP (1440p)', pixels: 3686400, desc: '2K QHD' },
    { label: '8.29 MP (4K)', pixels: 8294400, desc: '4K UHD' },
    { label: '33.18 MP (8K)', pixels: 33177600, desc: language === 'zh' ? '8K 超清' : '8K UHD' },
  ], [language]);

  return (
    <div className="space-y-8">
      {/* SECTION 1: Scale Setting & Target Pixels Configuration */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {language === 'zh' ? '02. 图像缩放' : '02. Image Scaling'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.scaler.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono text-indigo-400 font-semibold">
              {language === 'zh' ? '目标总像素' : 'Target Pixels'}: {formatPixels(effectiveTargetPixels)} px
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-sky-400">
              {language === 'zh' ? '约 ' : 'approx '}{formatMegapixels(effectiveTargetPixels)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5">
          {/* Left Column: Pixel Budget Input (Cols 1-7) */}
          <div className="md:col-span-7 space-y-4">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setInputMode('from_source');
                  setSelectedRatioKey('source');
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                  inputMode === 'from_source'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.scaler.modeSource}
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputMode('direct_pixels');
                  if (selectedRatioKey === 'source') {
                    setSelectedRatioKey('16:9');
                  }
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                  inputMode === 'direct_pixels'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.scaler.modeDirect}
              </button>
            </div>

            {inputMode === 'from_source' ? (
              /* From Source Mode */
              <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      {t.scaler.srcWidthLabel} (px)
                    </label>
                    <PixelNumberInput
                      value={srcWidth}
                      onChange={setSrcWidth}
                      step={multiple}
                      min={1}
                      placeholder={language === 'zh' ? '原图宽 px...' : 'Source W px...'}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      {t.scaler.srcHeightLabel} (px)
                    </label>
                    <PixelNumberInput
                      value={srcHeight}
                      onChange={setSrcHeight}
                      step={multiple}
                      min={1}
                      placeholder={language === 'zh' ? '原图高 px...' : 'Source H px...'}
                    />
                  </div>
                </div>

                {/* Scale Multiplier */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-slate-300">
                      {t.scaler.scaleMultiplier}
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {language === 'zh' ? '原图 ' : 'Source '}{formatPixels(srcWidth * srcHeight)} px
                    </span>
                  </div>

                  {/* Free Adjustable Multiplier Input + Slider Control */}
                  <div className="flex items-center gap-3">
                    {/* Stepper Input with attached arrows */}
                    <div className="relative flex items-stretch h-9 w-32 bg-slate-900 border border-slate-700 hover:border-slate-600 focus-within:border-indigo-500 rounded-lg overflow-hidden shrink-0 shadow-xs">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={scaleFactorText}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          if (raw === '' || /^(\d+)?(\.)?(\d+)?$/.test(raw)) {
                            setScaleFactorText(raw);
                            const parsed = parseFloat(raw);
                            if (!isNaN(parsed) && parsed > 0) {
                              setScaleFactor(+parsed.toFixed(3));
                            }
                          }
                        }}
                        onFocus={() => setIsScaleFactorFocused(true)}
                        onBlur={() => {
                          setIsScaleFactorFocused(false);
                          const parsed = parseFloat(scaleFactorText);
                          if (isNaN(parsed) || parsed <= 0) {
                            setScaleFactor(1.0);
                            setScaleFactorText('1');
                          } else {
                            const clamped = Math.min(64, Math.max(0.01, parsed));
                            setScaleFactor(+clamped.toFixed(3));
                            setScaleFactorText(String(+clamped.toFixed(3)));
                          }
                        }}
                        className="w-full bg-transparent border-0 pl-3 pr-6 text-xs font-mono text-white focus:outline-none tabular-nums"
                        placeholder={language === 'zh' ? '倍率...' : 'Factor...'}
                      />
                      <span className="absolute right-7 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 pointer-events-none select-none">
                        x
                      </span>
                      <div className="flex flex-col w-6 border-l border-slate-700/80 bg-slate-800/40 select-none">
                        <button
                          type="button"
                          onClick={() => {
                            const next = +(Math.min(64, scaleFactor + 0.1)).toFixed(2);
                            setScaleFactor(next);
                            setScaleFactorText(String(next));
                          }}
                          className="flex-1 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors border-b border-slate-700/60 cursor-pointer"
                          title={language === 'zh' ? '增加 0.1x' : 'Add 0.1x'}
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = +(Math.max(0.05, scaleFactor - 0.1)).toFixed(2);
                            setScaleFactor(next);
                            setScaleFactorText(String(next));
                          }}
                          className="flex-1 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors cursor-pointer"
                          title={language === 'zh' ? '减少 0.1x' : 'Subtract 0.1x'}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Fast Scrub Range Slider */}
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="range"
                        min="0.1"
                        max="4"
                        step="0.05"
                        value={Math.min(4, Math.max(0.1, scaleFactor))}
                        onChange={(e) => {
                          const next = +parseFloat(e.target.value).toFixed(2);
                          setScaleFactor(next);
                          setScaleFactorText(String(next));
                        }}
                        className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                      />
                      <span className="text-[11px] font-mono text-indigo-400 w-10 text-right shrink-0 font-semibold">
                        {scaleFactor}x
                      </span>
                    </div>
                  </div>

                  {/* Preset Multipliers including 1X */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-slate-400 font-medium mr-0.5">
                      {t.scaler.quickMultipliers}
                    </span>
                    {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          setScaleFactor(f);
                          setScaleFactorText(String(f));
                        }}
                        className={`px-2 py-0.5 text-xs font-mono rounded border transition-colors cursor-pointer ${
                          Math.abs(scaleFactor - f) < 0.001
                            ? 'bg-indigo-600 text-white border-indigo-500 font-semibold shadow-xs'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        {f === 1.0 ? (language === 'zh' ? '1X (原倍率)' : '1X (Original)') : `${f}x`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Direct Pixels Mode */
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      {t.scaler.targetPixelBudget}
                    </label>
                    <span className="text-[11px] font-mono text-indigo-400">
                      {formatMegapixels(targetPixels)}
                    </span>
                  </div>
                  <div>
                    <PixelNumberInput
                      value={targetPixels}
                      onChange={setTargetPixels}
                      step={65536}
                      min={1}
                      placeholder={language === 'zh' ? '例如: 1048576' : 'e.g. 1048576'}
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                    {t.scaler.quickBudgets}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {pixelPresets.map((p) => (
                      <button
                        key={p.pixels}
                        type="button"
                        onClick={() => setTargetPixels(p.pixels)}
                        className={`px-2 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
                          targetPixels === p.pixels
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                            : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-800'
                        }`}
                        title={p.desc}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Aspect Ratio & Constraint Parameters (Cols 8-12) */}
          <div className="md:col-span-5 space-y-4">
            {/* Target Aspect Ratio Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.scaler.targetAspect}
              </label>
              <select
                value={selectedRatioKey}
                onChange={(e) => setSelectedRatioKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-3 py-2 focus:border-indigo-500 font-mono"
              >
                {availableRatios.map((ar) => (
                  <option key={ar.key} value={ar.key}>
                    {ar.key === 'source'
                      ? (language === 'zh' ? `保持原图比例 (${getSimplifiedRatio(srcWidth, srcHeight)})` : `Keep Source Ratio (${getSimplifiedRatio(srcWidth, srcHeight)})`)
                      : `${getRatioName(ar.key, ar.name)} (${ar.key})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Multiple Alignment Constraint */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.scaler.alignmentMultiple}</span>
                </label>
                <span className="text-[11px] font-mono text-indigo-400">
                  {multiple === 1 ? (language === 'zh' ? '无限制' : 'None') : (language === 'zh' ? `${multiple}x 对齐` : `${multiple}px aligned`)}
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1 bg-slate-950 p-1 rounded border border-slate-800">
                {([1, 2, 4, 8, 16, 32, 64] as AlignmentMultiple[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMultiple(m)}
                    className={`py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ${
                      multiple === m
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {m === 1 ? (language === 'zh' ? '任意' : 'Any') : `${m}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Optimization Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.scaler.optimizationGoal}
              </label>
              <select
                value={optimizationGoal}
                onChange={(e) => setOptimizationGoal(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:border-indigo-500"
              >
                <option value="balanced">{t.scaler.goalBalanced}</option>
                <option value="strict_ratio">{t.scaler.goalStrictRatio}</option>
                <option value="max_pixels">{t.scaler.goalMaxPixels}</option>
                <option value="min_pixels">{t.scaler.goalMinPixels}</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Primary Optimal Result Showcase */}
      <section className="bg-gradient-to-b from-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {language === 'zh'
                  ? `在 ${currentRatioDef.name} ${currentRatioDef.key === 'source' ? '' : `(${currentRatioDef.key})`} 下的最佳匹配分辨率`
                  : `Optimal Resolution for ${currentRatioDef.key === 'source' ? 'Source Ratio' : getRatioName(currentRatioDef.key, currentRatioDef.name)}`}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'zh'
                  ? `满足 ${multiple} 像素倍数约束，已通过收敛寻优求解`
                  : `Aligned to ${multiple}px multiples via convergence optimization`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  'primary-copy',
                  `${primaryResult.alignedWidth}x${primaryResult.alignedHeight}`,
                  `${primaryResult.aspectRatio.key} ${language === 'zh' ? '最佳缩放分辨率' : 'Optimal Resolution'}`
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-colors shadow-sm cursor-pointer"
            >
              {copiedId === 'primary-copy' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>{language === 'zh' ? '已复制分辨率' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{language === 'zh' ? '复制' : 'Copy'} {primaryResult.alignedWidth}×{primaryResult.alignedHeight}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Core Presentation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Numbers & Specs (Cols 1-7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 shadow-inner">
              <div className="text-xs text-slate-400 mb-1 font-medium">
                {language === 'zh' ? '推荐标准化最佳分辨率:' : 'Recommended Aligned Resolution:'}
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-white tracking-tight">
                  {primaryResult.alignedWidth}{' '}
                  <span className="text-indigo-400 font-normal">×</span>{' '}
                  {primaryResult.alignedHeight}
                </span>
                <span className="text-sm font-mono text-indigo-400 font-semibold">
                  {formatMegapixels(primaryResult.actualPixels)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono">
                <div>
                  <div className="text-slate-500 text-[11px]">{language === 'zh' ? '实际总像素数' : 'Actual Pixels'}</div>
                  <div className="font-semibold text-slate-200 mt-0.5">
                    {formatPixels(primaryResult.actualPixels)} px
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 text-[11px]">{t.scaler.pixelDelta} (Δpx)</div>
                  <div
                    className={`font-semibold mt-0.5 ${
                      primaryResult.pixelDelta === 0
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {primaryResult.pixelDelta >= 0 ? '+' : ''}
                    {formatPixels(primaryResult.pixelDelta)} px ({primaryResult.pixelDeltaPercent}%)
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 text-[11px]">{t.scaler.ratioDelta}</div>
                  <div
                    className={`font-semibold mt-0.5 ${
                      primaryResult.ratioErrorPercent < 0.1
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {primaryResult.ratioErrorPercent}% ({language === 'zh' ? '实测 ' : 'measured '}{primaryResult.actualRatio})
                  </div>
                </div>
              </div>
            </div>

            {/* Validation & Code snippets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded bg-slate-950/50 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">{language === 'zh' ? '宽度模数' : 'Width Mod'}</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {primaryResult.alignedWidth} % {multiple} = 0 ✓
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/50 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">{language === 'zh' ? '高度模数' : 'Height Mod'}</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {primaryResult.alignedHeight} % {multiple} = 0 ✓
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/50 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">{language === 'zh' ? '目标比例' : 'Target Ratio'}</span>
                <span className="font-mono text-slate-300 font-semibold">
                  {currentRatioDef.key === 'source' ? (language === 'zh' ? '原图比例' : 'Source Ratio') : currentRatioDef.key} ({currentRatioDef.ratio.toFixed(3)})
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/50 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">{language === 'zh' ? '算力匹配' : 'VRAM Budget'}</span>
                <span className="font-mono text-sky-400 font-semibold">
                  {primaryResult.actualPixels < 1100000 ? (language === 'zh' ? '1MP级预算' : '~1MP Budget') : (language === 'zh' ? '高显存模式' : 'High VRAM')}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Preview Box (Cols 8-12) */}
          <div className="lg:col-span-5">
            <AspectVisualizer
              width={primaryResult.alignedWidth}
              height={primaryResult.alignedHeight}
              aspectRatioLabel={currentRatioDef.key === 'source' ? `${language === 'zh' ? '原图比例' : 'Source Ratio'} (${getSimplifiedRatio(srcWidth, srcHeight)})` : currentRatioDef.key}
              multiple={multiple}
              label={language === 'zh' ? '最佳缩放分辨率几何视框' : 'Optimal Scaled Aspect Preview'}
              originalWidth={inputMode === 'from_source' ? srcWidth : undefined}
              originalHeight={inputMode === 'from_source' ? srcHeight : undefined}
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: Parallel Matrix Across All Standard Aspect Ratios */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Grid className="w-4 h-4 text-sky-400" />
              <span>{t.scaler.matrixTitle}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'zh'
                ? `在固定总像素 ${formatPixels(effectiveTargetPixels)} px 与 ${multiple} 像素倍数约束下，各主流画幅的最优整除尺寸`
                : `Optimal divisible dimensions across aspect ratios with ${formatPixels(effectiveTargetPixels)} px budget and ${multiple}px multiple`}
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {language === 'zh' ? `全部满足 mod ${multiple} = 0` : `All satisfy mod ${multiple} = 0`}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
                <th className="py-3 px-4 font-semibold">{language === 'zh' ? '比例 / 画幅类型' : 'Aspect Ratio / Type'}</th>
                <th className="py-3 px-4 font-semibold">{language === 'zh' ? '推荐标准化分辨率 (X×Y)' : 'Aligned Resolution (X×Y)'}</th>
                <th className="py-3 px-4 font-semibold text-right">{language === 'zh' ? '总像素量 (px)' : 'Total Pixels (px)'}</th>
                <th className="py-3 px-4 font-semibold text-right">{t.scaler.ratioDelta}</th>
                <th className="py-3 px-4 font-semibold text-right">{t.scaler.pixelDelta}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {batchResults.map((item) => {
                const isCurrent = item.aspectRatio.key === currentRatioDef.key;
                const itemId = `matrix-${item.aspectRatio.key}`;

                return (
                  <tr
                    key={item.aspectRatio.key}
                    className={`transition-colors hover:bg-slate-850 ${
                      isCurrent ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-sans font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {item.aspectRatio.key === 'source' ? (language === 'zh' ? '原图比例' : 'Source Ratio') : item.aspectRatio.key}
                        </span>
                        <span className="text-slate-400 text-[11px] truncate hidden sm:inline">
                          ({item.aspectRatio.key === 'source' ? (language === 'zh' ? '保持原图' : 'Source Spec') : getRatioName(item.aspectRatio.key, item.aspectRatio.name)})
                        </span>
                        {item.aspectRatio.key === 'source' && (
                          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/70 border border-indigo-700/60 px-1.5 py-0.2 rounded font-semibold">
                            {language === 'zh' ? '保持原图' : 'Source'}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 tabular-nums font-bold text-white">
                      <span className="text-sm">
                        {item.alignedWidth} × {item.alignedHeight}
                      </span>
                      <span className="text-slate-400 text-[11px] font-normal ml-2">
                        ({formatMegapixels(item.actualPixels)})
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                      {formatPixels(item.actualPixels)}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] ${
                          item.ratioErrorPercent < 0.1
                            ? 'text-emerald-400 bg-emerald-950/30'
                            : item.ratioErrorPercent < 1.0
                            ? 'text-amber-400 bg-amber-950/30'
                            : 'text-rose-400 bg-rose-950/30'
                        }`}
                      >
                        {item.ratioErrorPercent}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-400">
                      {item.pixelDelta >= 0 ? '+' : ''}
                      {formatPixels(item.pixelDelta)} px
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            itemId,
                            `${item.alignedWidth}x${item.alignedHeight}`,
                            `${item.aspectRatio.key} ${language === 'zh' ? '分辨率' : 'Resolution'} (${item.alignedWidth}×${item.alignedHeight})`
                          )
                        }
                        className="py-1 px-2 text-xs font-sans font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === itemId ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">{t.common.copied}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>{t.common.copy}</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
