import React, { useState, useMemo, useEffect } from 'react';
import {
  AlignmentMultiple,
  CropPriorityMode,
  DimensionType,
  DualAxisCropResult,
  NonStandardResult,
  RoundingMode,
  StandardMatchDualResult,
  StandardMatchResult,
} from '../types';
import {
  calculateDualAxisCropResults,
  calculateNonStandardResolutions,
  formatMegapixels,
  formatPixels,
  getSimplifiedRatio,
  matchStandardResolutions,
  matchStandardResolutionsDual,
} from '../utils/calculator';
import { useCustomResolutions } from '../utils/customResolutions';
import { useLanguage } from '../i18n/LanguageContext';
import { AspectVisualizer } from './AspectVisualizer';
import { PixelNumberInput } from './PixelNumberInput';
import {
  Sliders,
  Sparkles,
  ArrowRightLeft,
  ArrowDownUp,
  Filter,
  Crop as CropIcon,
  Ratio,
  Layers,
  Scissors,
  ChevronDown,
} from 'lucide-react';

interface CropMatcherTabProps {
  onCopyText?: (text: string, label: string) => void;
  injectedDimensions?: { width: number; height: number } | null;
}

export const CropMatcherTab: React.FC<CropMatcherTabProps> = ({
  injectedDimensions,
}) => {
  const { t, language, getRatioName } = useLanguage();

  // Input benchmark mode: 'both' (双边基准) | 'height' (单边高度) | 'width' (单边宽度)
  const [inputMode, setInputMode] = useState<'both' | 'height' | 'width'>('both');

  // Dual-axis values (Width & Height)
  const [dualWidth, setDualWidth] = useState<number>(1920);
  const [dualHeight, setDualHeight] = useState<number>(1200);

  // Single-side value
  const [singleValue, setSingleValue] = useState<number>(1080);

  // Constraint parameters
  const [multiple, setMultiple] = useState<AlignmentMultiple>(16);
  const [roundingMode, setRoundingMode] = useState<RoundingMode>('floor');
  const [priorityMode, setPriorityMode] = useState<CropPriorityMode>('strict_ratio');
  const [alignBothSides, setAlignBothSides] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'landscape' | 'portrait' | 'square'>('all');

  // Selected item for inspector view
  const [selectedDualCrop, setSelectedDualCrop] = useState<DualAxisCropResult | null>(null);
  const [selectedSingleResult, setSelectedSingleResult] = useState<NonStandardResult | null>(null);

  // Collapsible section visibility states (both expanded by default)
  const [isStandardMatchesOpen, setIsStandardMatchesOpen] = useState<boolean>(true);
  const [isRatioCropsOpen, setIsRatioCropsOpen] = useState<boolean>(true);

  // Sorting mode for dual axis cropping: sort by lowest crop loss first (true) or default (false)
  const [sortByLowestCropLoss, setSortByLowestCropLoss] = useState<boolean>(true);

  // If injected dimensions arrive from image inspector
  useEffect(() => {
    if (injectedDimensions && injectedDimensions.width > 0 && injectedDimensions.height > 0) {
      setInputMode('both');
      setDualWidth(injectedDimensions.width);
      setDualHeight(injectedDimensions.height);
      setSingleValue(injectedDimensions.height);
    }
  }, [injectedDimensions]);

  // Quick dual-axis presets (common raw camera/screen sizes)
  const dualPresets = useMemo(() => [
    { label: '1920 × 1200', w: 1920, h: 1200, note: language === 'zh' ? '16:10 办公屏' : '16:10 Display' },
    { label: '1920 × 1080', w: 1920, h: 1080, note: '1080p FHD' },
    { label: '2560 × 1600', w: 2560, h: 1600, note: language === 'zh' ? 'MacBook 视网膜' : 'MacBook Retina' },
    { label: '3840 × 2160', w: 3840, h: 2160, note: '4K UHD' },
    { label: '4032 × 3024', w: 4032, h: 3024, note: language === 'zh' ? '手机拍照 12MP' : 'Mobile 12MP' },
    { label: '6000 × 4000', w: 6000, h: 4000, note: language === 'zh' ? '单反全画幅 24MP' : 'DSLR 24MP' },
    { label: '1080 × 1920', w: 1080, h: 1920, note: language === 'zh' ? '短视频 9:16' : 'Short Video 9:16' },
    { label: '1080 × 1440', w: 1080, h: 1440, note: language === 'zh' ? '小红书 3:4' : 'Social 3:4' },
    { label: '1080 × 1350', w: 1080, h: 1350, note: 'Instagram 4:5' },
    { label: '1024 × 1024', w: 1024, h: 1024, note: language === 'zh' ? '方图 1:1' : 'Square 1:1' },
  ], [language]);

  const singlePresets = [720, 1080, 1200, 1280, 1440, 1920, 2160, 1000, 1024, 800, 512];

  const { allResolutions } = useCustomResolutions();

  // ================= DUAL AXIS COMPUTATIONS =================
  const dualStandardMatches = useMemo<StandardMatchDualResult[]>(() => {
    if (inputMode !== 'both') return [];
    return matchStandardResolutionsDual(dualWidth, dualHeight, categoryFilter, 8, allResolutions);
  }, [inputMode, dualWidth, dualHeight, categoryFilter, allResolutions]);

  const dualCropResults = useMemo<DualAxisCropResult[]>(() => {
    if (inputMode !== 'both') return [];
    return calculateDualAxisCropResults(
      dualWidth,
      dualHeight,
      multiple,
      roundingMode,
      categoryFilter,
      priorityMode
    );
  }, [inputMode, dualWidth, dualHeight, multiple, roundingMode, categoryFilter, priorityMode]);

  // Sorted dual crop results: if sortByLowestCropLoss is enabled, lowest discarded percent comes first
  const displayedDualCropResults = useMemo<DualAxisCropResult[]>(() => {
    if (inputMode !== 'both') return [];
    if (sortByLowestCropLoss) {
      return [...dualCropResults].sort((a, b) => {
        if (a.discardedPercent !== b.discardedPercent) {
          return a.discardedPercent - b.discardedPercent;
        }
        return a.ratioErrorPercent - b.ratioErrorPercent;
      });
    }
    return dualCropResults;
  }, [inputMode, dualCropResults, sortByLowestCropLoss]);

  // ================= SINGLE SIDE COMPUTATIONS =================
  const singleStandardMatches = useMemo<StandardMatchResult[]>(() => {
    if (inputMode === 'both') return [];
    const dimType: DimensionType = inputMode === 'height' ? 'height' : 'width';
    return matchStandardResolutions(dimType, singleValue, categoryFilter, 8, allResolutions);
  }, [inputMode, singleValue, categoryFilter, allResolutions]);

  const singleNonStandardResults = useMemo<NonStandardResult[]>(() => {
    if (inputMode === 'both') return [];
    const dimType: DimensionType = inputMode === 'height' ? 'height' : 'width';
    return calculateNonStandardResolutions(
      dimType,
      singleValue,
      multiple,
      roundingMode === 'floor' ? 'floor' : roundingMode === 'ceil' ? 'ceil' : 'nearest',
      alignBothSides,
      categoryFilter,
      priorityMode
    );
  }, [inputMode, singleValue, multiple, roundingMode, alignBothSides, categoryFilter, priorityMode]);

  // Active items for inspector
  const activeDualCrop = selectedDualCrop || displayedDualCropResults[0];
  const activeSingleResult = selectedSingleResult || singleNonStandardResults[0];

  // Helper swap width & height
  const handleSwapDual = () => {
    const temp = dualWidth;
    setDualWidth(dualHeight);
    setDualHeight(temp);
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: Control Panel */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <CropIcon className="w-5 h-5 text-indigo-400" />
              <span>{language === 'zh' ? '01. 图片/视频裁剪' : '01. Image / Video Cropping'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.crop.subtitle}
            </p>
          </div>

          {/* Quick Summary Tag */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {inputMode === 'both' ? (
              <span className="font-mono text-indigo-400 font-semibold">
                {language === 'zh' ? '基准尺寸' : 'Benchmark'}: {dualWidth} × {dualHeight} px ({getSimplifiedRatio(dualWidth, dualHeight)})
              </span>
            ) : (
              <span className="font-mono text-indigo-400 font-semibold">
                {language === 'zh' ? '基准边' : 'Benchmark Axis'}: {inputMode === 'height' ? (language === 'zh' ? '高' : 'H') : (language === 'zh' ? '宽' : 'W')} {singleValue} px
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span className="font-mono text-sky-400">
              {multiple === 1 ? (language === 'zh' ? '无倍数限制' : 'No divisibility limit') : `${multiple}px ${language === 'zh' ? '整除约束' : 'divisible'}`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5">
          {/* Mode & Inputs (Cols 1-7) */}
          <div className="md:col-span-7 space-y-4">
            {/* Input Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {language === 'zh' ? '基准像素输入模式' : 'Benchmark Input Mode'}
              </label>
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setInputMode('both')}
                  className={`flex-1 py-1.5 px-3 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer ${
                    inputMode === 'both'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{t.crop.tabDual}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('height')}
                  className={`flex-1 py-1.5 px-3 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                    inputMode === 'height'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.crop.tabHeight}
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('width')}
                  className={`flex-1 py-1.5 px-3 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                    inputMode === 'width'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.crop.tabWidth}
                </button>
              </div>
            </div>

            {/* DUAL AXIS INPUTS */}
            {inputMode === 'both' ? (
              <div className="space-y-3 bg-slate-950/70 p-4 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    {language === 'zh' ? '原始图像/视频基准尺寸 (W × H)' : 'Source Benchmark Dimensions (W × H)'}
                  </span>
                  <button
                    type="button"
                    onClick={handleSwapDual}
                    className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    title={t.common.swap}
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>{language === 'zh' ? '横竖互换' : 'Swap W & H'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                      {t.crop.rawInputWidth} (px)
                    </label>
                    <PixelNumberInput
                      value={dualWidth}
                      onChange={setDualWidth}
                      step={multiple}
                      min={1}
                      placeholder={language === 'zh' ? '宽 px...' : 'Width px...'}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                      {t.crop.rawInputHeight} (px)
                    </label>
                    <PixelNumberInput
                      value={dualHeight}
                      onChange={setDualHeight}
                      step={multiple}
                      min={1}
                      placeholder={language === 'zh' ? '高 px...' : 'Height px...'}
                    />
                  </div>
                </div>

                {/* Original Benchmark Info Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <span className="text-slate-400">
                    {language === 'zh' ? '原图总像素' : 'Source Total Pixels'}: <strong className="text-slate-200">{formatPixels(dualWidth * dualHeight)} px</strong> ({formatMegapixels(dualWidth * dualHeight)})
                  </span>
                  <span className="text-indigo-400">
                    {language === 'zh' ? '原生比例' : 'Native Ratio'}: {getSimplifiedRatio(dualWidth, dualHeight)} ({(dualWidth / dualHeight).toFixed(3)})
                  </span>
                </div>

                {/* Quick Dual Presets */}
                <div className="pt-1">
                  <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                    {t.crop.quickPresets}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {dualPresets.map((p) => (
                      <button
                        key={`${p.w}x${p.h}`}
                        type="button"
                        onClick={() => {
                          setDualWidth(p.w);
                          setDualHeight(p.h);
                        }}
                        className={`px-2 py-0.5 text-xs font-mono tabular-nums rounded border transition-colors cursor-pointer ${
                          dualWidth === p.w && dualHeight === p.h
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                            : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                        }`}
                        title={p.note}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* SINGLE SIDE INPUT */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    {inputMode === 'height' ? `${t.crop.singleConstraintHeight} (px)` : `${t.crop.singleConstraintWidth} (px)`}
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    1 ~ 16384 px
                  </span>
                </div>
                <div>
                  <PixelNumberInput
                    value={singleValue}
                    onChange={setSingleValue}
                    step={multiple}
                    min={1}
                    placeholder={language === 'zh' ? '输入像素...' : 'Enter pixels...'}
                  />
                </div>

                <div className="pt-1">
                  <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                    {t.crop.singleQuickPresets}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {singlePresets.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSingleValue(val)}
                        className={`px-2 py-0.5 text-xs font-mono rounded border cursor-pointer ${
                          singleValue === val
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                            : 'bg-slate-800/60 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Premise & Multiples (Cols 8-12) */}
          <div className="md:col-span-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.crop.multipleConstraint}</span>
                </label>
                <span className="text-[11px] text-indigo-400 font-mono">
                  {multiple === 1 && (language === 'zh' ? '原生' : 'Native')}
                  {multiple === 2 && (language === 'zh' ? '偶数(YUV)' : 'Even(YUV)')}
                  {multiple === 4 && (language === 'zh' ? '4px对齐' : '4px aligned')}
                  {multiple === 8 && '8px (SD)'}
                  {multiple === 16 && '16px (H.264/SDXL)'}
                  {multiple === 32 && '32px (GPU)'}
                  {multiple === 64 && '64px (FLUX)'}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {([1, 2, 4, 8, 16, 32, 64] as AlignmentMultiple[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMultiple(m)}
                    className={`py-1.5 text-xs font-mono font-bold rounded text-center transition-all cursor-pointer ${
                      multiple === m
                        ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    {m === 1 ? (language === 'zh' ? '任意' : 'Any') : `${m}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Crop Alignment Strategy & Priority Mode */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>{t.crop.priorityMode}</span>
                    <span className="text-[10px] text-indigo-400 font-normal">
                      {priorityMode === 'strict_ratio' ? (language === 'zh' ? '100% 精确比例' : 'Exact Ratio') : (language === 'zh' ? '最大化像素' : 'Max Pixels')}
                    </span>
                  </label>
                  <select
                    value={priorityMode}
                    onChange={(e) => setPriorityMode(e.target.value as CropPriorityMode)}
                    className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:border-indigo-500"
                  >
                    <option value="strict_ratio">{language === 'zh' ? '严格比例优先 (100% 精确标准比例，0 误差)' : 'Strict Ratio Priority (Exact target ratio, 0 drift)'}</option>
                    <option value="max_area">{language === 'zh' ? '最大画面优先 (独立对齐，保留最多原图面积)' : 'Max Area Priority (Independent alignment, max area)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.crop.roundingMode}
                  </label>
                  <select
                    value={roundingMode}
                    onChange={(e) => setRoundingMode(e.target.value as RoundingMode)}
                    className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:border-indigo-500"
                  >
                    <option value="floor">{language === 'zh' ? '向下对齐 (Floor - 内切严禁溢出)' : 'Floor (Crop inward, no overflow)'}</option>
                    <option value="nearest">{language === 'zh' ? '最近对齐 (Nearest - 误差最小)' : 'Nearest (Minimum rounding error)'}</option>
                    <option value="ceil">{language === 'zh' ? '向上对齐 (Ceil - 外包覆盖)' : 'Ceil (Expand / Outward bounding)'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {language === 'zh' ? '画幅方向筛选' : 'Ratio Orientation Filter'}
                </label>
                <div className="flex items-center gap-1">
                  {[
                    { key: 'all', label: t.crop.filterAll },
                    { key: 'landscape', label: t.crop.filterLandscape },
                    { key: 'portrait', label: t.crop.filterPortrait },
                    { key: 'square', label: t.crop.filterSquare },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setCategoryFilter(item.key as any)}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                        categoryFilter === item.key
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Check info */}
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              <span className="text-slate-300 font-semibold block mb-0.5">
                {language === 'zh' ? '剪裁标准化原理:' : 'Standardization Principles:'}
              </span>
              {priorityMode === 'strict_ratio' ? (
                <span>
                  {language === 'zh' ? (
                    <>
                      当前模式为<strong className="text-indigo-400">「严格比例优先」</strong>：宽与高严格遵循目标画幅绝对标准比例（比例偏离度为 <strong className="text-emerald-400 font-bold">0%</strong>），同时宽高两轴严格整除 <strong className="text-slate-200">{multiple}</strong> 倍数，杜绝画幅轻微变形与编码花屏。
                    </>
                  ) : (
                    <>
                      Current mode is <strong className="text-indigo-400">Strict Ratio Priority</strong>: width and height adhere strictly to target standard ratio (<strong className="text-emerald-400 font-bold">0%</strong> drift), while dimensions divide cleanly by <strong className="text-slate-200">{multiple}</strong>, eliminating distortion.
                    </>
                  )}
                </span>
              ) : (
                <span>
                  {language === 'zh' ? (
                    <>
                      当前模式为<strong className="text-indigo-400">「最大画面优先」</strong>：宽高分别独立对齐 <strong className="text-slate-200">{multiple}</strong> 像素倍数，最大化保留原图视野面积，长宽比可能存在低于 1% 的极微弱偏离。
                    </>
                  ) : (
                    <>
                      Current mode is <strong className="text-indigo-400">Max Area Priority</strong>: width and height independently align to <strong className="text-slate-200">{multiple}</strong> multiples to retain maximum image area, with minor aspect drift under 1%.
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Standard Resolution Matcher (Collapsible) */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden transition-all">
        {/* Clickable Header for Collapsing/Expanding */}
        <button
          type="button"
          onClick={() => setIsStandardMatchesOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-800/40 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  {t.crop.standardMatchesTitle}
                </h3>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  {inputMode === 'both' ? dualStandardMatches.length : singleStandardMatches.length} {language === 'zh' ? '个候选' : ' candidates'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {inputMode === 'both'
                  ? (language === 'zh'
                      ? `根据输入的双边基准 ${dualWidth} × ${dualHeight} px，综合匹配最接近的行业通用标准规格`
                      : `Matched closest standard resolutions based on input ${dualWidth} × ${dualHeight} px`)
                  : (language === 'zh'
                      ? `根据输入的单边像素 ${singleValue} px，匹配相近标准规格`
                      : `Matched closest standard resolutions based on benchmark side ${singleValue} px`)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium shrink-0 ml-3">
            <span className="hidden sm:inline text-slate-400 group-hover:text-slate-200">
              {isStandardMatchesOpen ? (language === 'zh' ? '收起' : 'Collapse') : (language === 'zh' ? '展开' : 'Expand')}
            </span>
            <div className="p-1 rounded bg-slate-800 text-slate-300 group-hover:bg-slate-700 transition-colors">
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isStandardMatchesOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>
        </button>

        {/* Collapsible Content */}
        {isStandardMatchesOpen && (
          <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-slate-800/60">
            {/* Dual Axis Standard Cards */}
            {inputMode === 'both' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {dualStandardMatches.map((match) => {
                  const res = match.resolution;
                  return (
                    <div
                      key={res.id}
                      className={`p-3.5 rounded-lg border transition-all ${
                        match.isExact
                          ? 'bg-indigo-950/20 border-indigo-500/60 shadow-sm'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-200 truncate block">
                            {res.name}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <span className="font-mono text-indigo-400">{res.aspectRatio}</span>
                            <span aria-hidden="true">·</span>
                            <span>{res.tag || '标准'}</span>
                          </div>
                        </div>

                        {match.isExact ? (
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-800/60 rounded">
                            {language === 'zh' ? '完全一致 (0%)' : 'Exact Match (0%)'}
                          </span>
                        ) : match.sizeRelation === 'larger' ? (
                          <span className="text-[10px] font-mono text-sky-400 px-1.5 py-0.5 bg-sky-950/40 border border-sky-800/60 rounded">
                            {language === 'zh' ? `偏大 +${match.totalDistance}%` : `Larger +${match.totalDistance}%`}
                          </span>
                        ) : match.sizeRelation === 'smaller' ? (
                          <span className="text-[10px] font-mono text-amber-400 px-1.5 py-0.5 bg-amber-950/40 border border-amber-800/60 rounded">
                            {language === 'zh' ? `偏小 -${match.totalDistance}%` : `Smaller -${match.totalDistance}%`}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 bg-slate-800/50 border border-slate-700 rounded">
                            {language === 'zh' ? `偏差 ${match.totalDistance}%` : `Diff ${match.totalDistance}%`}
                          </span>
                        )}
                      </div>

                      <div className="py-2 px-2.5 rounded bg-slate-950/60 border border-slate-800/60 mb-2">
                        <div className="flex items-baseline justify-between">
                          <span className="font-mono tabular-nums text-sm font-bold text-white tracking-tight">
                            {res.width} × {res.height}
                          </span>
                          <span className="text-[11px] font-mono text-indigo-400">
                            {formatMegapixels(res.totalPixels)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
                          <span>{language === 'zh' ? '与原图差值:' : 'Diff from source:'}</span>
                          <span className="tabular-nums">
                            {match.isExact ? (
                              <span className="text-emerald-400 font-semibold">{language === 'zh' ? '0 px (完全相等)' : '0 px (Exact match)'}</span>
                            ) : (
                              <span className={match.sizeRelation === 'larger' ? 'text-sky-300' : match.sizeRelation === 'smaller' ? 'text-amber-300' : 'text-slate-300'}>
                                ΔW: {match.deltaW > 0 ? `+${match.deltaW}` : match.deltaW} · ΔH: {match.deltaH > 0 ? `+${match.deltaH}` : match.deltaH} px
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {res.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Single Side Standard Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {singleStandardMatches.map((match) => {
                  const res = match.resolution;
                  return (
                    <div
                      key={res.id}
                      className={`p-3.5 rounded-lg border transition-all ${
                        match.isExact
                          ? 'bg-indigo-950/20 border-indigo-500/60 shadow-sm'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-200 truncate block">
                            {res.name}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <span className="font-mono text-indigo-400">{res.aspectRatio}</span>
                            <span aria-hidden="true">·</span>
                            <span>{res.tag || (language === 'zh' ? '标准' : 'Standard')}</span>
                          </div>
                        </div>

                        {match.isExact ? (
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-800/60 rounded">
                            {language === 'zh' ? '完全一致 (0px)' : 'Exact Match (0px)'}
                          </span>
                        ) : match.delta > 0 ? (
                          <span className="text-[10px] font-mono text-sky-400 px-1.5 py-0.5 bg-sky-950/40 border border-sky-800/60 rounded">
                            {language === 'zh' ? `偏大 +${match.delta}px` : `Larger +${match.delta}px`}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-amber-400 px-1.5 py-0.5 bg-amber-950/40 border border-amber-800/60 rounded">
                            {language === 'zh' ? `偏小 ${match.delta}px` : `Smaller ${match.delta}px`}
                          </span>
                        )}
                      </div>

                      <div className="py-2 px-2.5 rounded bg-slate-950/60 border border-slate-800/60 mb-2">
                        <div className="flex items-baseline justify-between">
                          <span className="font-mono tabular-nums text-sm font-bold text-white tracking-tight">
                            {res.width} × {res.height}
                          </span>
                          <span className="text-[11px] font-mono text-indigo-400">
                            {formatMegapixels(res.totalPixels)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-0.5">
                          <span>{language === 'zh' ? '与基准差值:' : 'Diff from benchmark:'}</span>
                          <span className="tabular-nums">
                            {match.isExact ? (
                              <span className="text-emerald-400 font-semibold">{language === 'zh' ? '0 px (完全相等)' : '0 px (Exact match)'}</span>
                            ) : match.delta > 0 ? (
                              <span className="text-sky-300 font-semibold">+{match.delta} px</span>
                            ) : (
                              <span className="text-amber-300 font-semibold">{match.delta} px</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-0.5">
                          <span>{language === 'zh' ? '总像素量:' : 'Total pixels:'}</span>
                          <span className="tabular-nums text-slate-300">{formatPixels(res.totalPixels)} px</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {res.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 3: Closest Non-Standard Resolution & Cropping Analysis */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden transition-all">
        {/* Clickable Header for Collapsing/Expanding */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3">
          <button
            type="button"
            onClick={() => setIsRatioCropsOpen((v) => !v)}
            className="flex items-start sm:items-center gap-3 text-left cursor-pointer group flex-1"
          >
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors shrink-0">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {t.crop.ratioCropsTitle}
                </h3>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  {inputMode === 'both' ? displayedDualCropResults.length : singleNonStandardResults.length} {language === 'zh' ? '组画幅' : ' aspect ratios'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {inputMode === 'both'
                  ? (language === 'zh'
                      ? `在原图 ${dualWidth} × ${dualHeight} px 基础上裁剪为各固定比例，并自动标准化为【${multiple} 像素倍数】的最佳分辨率`
                      : `Cropped from source ${dualWidth} × ${dualHeight} px into fixed ratios, standardized to ${multiple}px multiples`)
                  : (language === 'zh'
                      ? `在保持固定常用比例的前提下，计算完全满足【${multiple} 像素倍数】的最佳非标定制尺寸`
                      : `Optimal custom resolutions under standard ratios strictly satisfying ${multiple}px multiples`)}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            {inputMode === 'both' && isRatioCropsOpen && (
              <button
                type="button"
                onClick={() => setSortByLowestCropLoss((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  sortByLowestCropLoss
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500 shadow-xs ring-1 ring-indigo-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-750'
                }`}
                title={language === 'zh' ? '点击切换排序：将裁去率最低（画面留存率最高）的画幅排在最前' : 'Toggle sorting: lowest crop loss first'}
              >
                <ArrowDownUp className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {sortByLowestCropLoss
                    ? (language === 'zh' ? '已按裁去率最低排序' : 'Sorted by lowest crop loss')
                    : (language === 'zh' ? '一键按裁去率最低排序' : 'Sort by lowest crop loss')}
                </span>
                {sortByLowestCropLoss && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-800/60 font-normal">
                    {language === 'zh' ? '最优在前' : 'Best first'}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsRatioCropsOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
            >
              <span className="hidden sm:inline">
                {isRatioCropsOpen ? (language === 'zh' ? '收起' : 'Collapse') : (language === 'zh' ? '展开' : 'Expand')}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isRatioCropsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isRatioCropsOpen && (
          <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-slate-800/60">
            {/* Two-Column Display */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Cards List (Cols 1-8) */}
          <div className="lg:col-span-8 space-y-3">
            {inputMode === 'both' ? (
              /* DUAL AXIS CROPPING CARDS - WITHOUT EXPORT BUTTONS & SORTED BY LOWEST LOSS */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displayedDualCropResults.map((item, index) => {
                  const isSelected = activeDualCrop?.aspectRatio.key === item.aspectRatio.key;
                  const isBestFit = sortByLowestCropLoss && index === 0;

                  return (
                    <div
                      key={item.aspectRatio.key}
                      onClick={() => setSelectedDualCrop(item)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-950/30 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">
                            {getRatioName(item.aspectRatio.key, item.aspectRatio.name)}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            ({item.aspectRatio.key})
                          </span>
                        </div>

                        {/* Lowest Crop Loss Badge & Discarded Rate */}
                        <div className="flex items-center gap-1.5">
                          {isBestFit && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-emerald-300 bg-emerald-950/70 border border-emerald-700/60 font-semibold">
                              {language === 'zh' ? '裁去率最低' : 'Lowest Crop'}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              item.discardedPercent === 0
                                ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 font-bold'
                                : item.discardedPercent < 15
                                ? 'text-sky-300 bg-sky-950/40 border border-sky-800/40'
                                : item.discardedPercent < 30
                                ? 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
                                : 'text-rose-400 bg-rose-950/40 border border-rose-800/40'
                            }`}
                          >
                            {language === 'zh' ? `裁去率: ${item.discardedPercent}%` : `Crop Loss: ${item.discardedPercent}%`}
                          </span>
                        </div>
                      </div>

                      {/* Resolution Box */}
                      <div className="p-2.5 rounded bg-slate-950 border border-slate-800 mb-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-base font-bold font-mono tabular-nums text-white">
                            {item.alignedWidth} <span className="text-slate-500 font-normal">×</span> {item.alignedHeight}
                          </span>
                          <span className="text-xs font-mono text-indigo-400 font-medium">
                            {formatMegapixels(item.retainedPixels)}
                          </span>
                        </div>

                        {/* Crop trimming notes */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-900">
                          <span>
                            {item.cropType === 'crop_width' && (language === 'zh' ? `裁切左右: ${item.trimmedPixelsWidth} px` : `Trim left/right: ${item.trimmedPixelsWidth} px`)}
                            {item.cropType === 'crop_height' && (language === 'zh' ? `裁切上下: ${item.trimmedPixelsHeight} px` : `Trim top/bottom: ${item.trimmedPixelsHeight} px`)}
                            {item.cropType === 'exact' && (language === 'zh' ? '原生契合无裁切' : 'Native exact fit, no trim')}
                          </span>
                          <span className="text-slate-300">
                            {language === 'zh' ? `留存率 ${item.retainedPercent}%` : `Retained ${item.retainedPercent}%`}
                          </span>
                        </div>

                        {/* Retention ratio progress bar */}
                        <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden mt-1.5">
                          <div
                            className={`h-1 rounded-full transition-all ${
                              item.retainedPercent > 90
                                ? 'bg-emerald-500'
                                : item.retainedPercent > 70
                                ? 'bg-sky-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${item.retainedPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Alignment & Drift Info */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>{language === 'zh' ? `${item.multiple}x 模数校验:` : `${item.multiple}x Divisibility:`}</span>
                        <span className="text-emerald-400">
                          {item.alignedWidth % item.multiple === 0 && item.alignedHeight % item.multiple === 0
                            ? (language === 'zh' ? `✓ 宽/高模${item.multiple}=0` : `✓ W/H%${item.multiple}=0`)
                            : (language === 'zh' ? '模数校验注意' : 'Verify alignment')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono mt-1.5 pt-1.5 border-t border-slate-800/60">
                        {item.ratioErrorPercent === 0 ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            {language === 'zh' ? '✓ 比例 100% 精确 (0 偏离)' : '✓ 100% Exact Ratio (0 drift)'}
                          </span>
                        ) : (
                          <span className="text-amber-400">
                            {language === 'zh' ? `长宽比偏离度: ${item.ratioErrorPercent}%` : `Ratio drift: ${item.ratioErrorPercent}%`}
                          </span>
                        )}
                        <span className={isSelected ? 'text-indigo-400 font-semibold' : 'text-slate-500'}>
                          {isSelected
                            ? (language === 'zh' ? '● 已在视框中预览' : '● In preview')
                            : (language === 'zh' ? '点击查看视框' : 'Click to preview')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* SINGLE SIDE NON-STANDARD CARDS */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {singleNonStandardResults.map((item) => {
                  const isSelected = activeSingleResult?.aspectRatio.key === item.aspectRatio.key;

                  return (
                    <div
                      key={item.aspectRatio.key}
                      onClick={() => setSelectedSingleResult(item)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-950/30 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">
                            {getRatioName(item.aspectRatio.key, item.aspectRatio.name)}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            ({item.aspectRatio.key})
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            item.ratioErrorPercent === 0
                              ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 font-semibold'
                              : 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
                          }`}
                        >
                          {item.ratioErrorPercent === 0
                            ? (language === 'zh' ? '✓ 比例 0 误差' : '✓ Ratio 0 Error')
                            : (language === 'zh' ? `偏离: ${item.ratioErrorPercent}%` : `Drift: ${item.ratioErrorPercent}%`)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded bg-slate-950 border border-slate-800 mb-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-base font-bold font-mono tabular-nums text-white">
                            {item.alignedWidth} <span className="text-slate-500 font-normal">×</span> {item.alignedHeight}
                          </span>
                          <span className="text-xs font-mono text-indigo-400 font-medium">
                            {formatMegapixels(item.totalPixels)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
                          <span>{language === 'zh' ? '总像素数:' : 'Total Pixels:'}</span>
                          <span className="tabular-nums text-slate-200">
                            {formatPixels(item.totalPixels)} px
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1.5 pt-1.5 border-t border-slate-800/60">
                        <span>{language === 'zh' ? `${multiple}x 模数校验:` : `${multiple}x Divisibility:`}</span>
                        <span className="text-emerald-400">
                          {item.alignedWidth % multiple === 0 && item.alignedHeight % multiple === 0
                            ? (language === 'zh' ? `✓ 模${multiple}=0` : `✓ %${multiple}=0`)
                            : (language === 'zh' ? '模数注意' : 'Check multiple')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Inspector & Visualizer (Cols 9-12) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 sticky top-20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {language === 'zh' ? '当前选中画幅裁剪分析' : 'Selected Ratio Analysis'}
              </h4>
              <span className="text-xs font-mono text-indigo-400 font-bold">
                {inputMode === 'both'
                  ? getRatioName(activeDualCrop?.aspectRatio.key || '', activeDualCrop?.aspectRatio.name)
                  : getRatioName(activeSingleResult?.aspectRatio.key || '', activeSingleResult?.aspectRatio.name)}
              </span>
            </div>

            {/* Visual Box Overlay */}
            {inputMode === 'both' && activeDualCrop ? (
              <AspectVisualizer
                width={activeDualCrop.alignedWidth}
                height={activeDualCrop.alignedHeight}
                originalWidth={dualWidth}
                originalHeight={dualHeight}
                aspectRatioLabel={activeDualCrop.aspectRatio.key}
                multiple={activeDualCrop.multiple}
                label={`${activeDualCrop.aspectRatio.key} ${language === 'zh' ? '裁剪视框与原图对照' : 'Crop Comparison'}`}
              />
            ) : activeSingleResult ? (
              <AspectVisualizer
                width={activeSingleResult.alignedWidth}
                height={activeSingleResult.alignedHeight}
                aspectRatioLabel={activeSingleResult.aspectRatio.key}
                multiple={activeSingleResult.multiple}
                label={`${activeSingleResult.aspectRatio.key} ${language === 'zh' ? '几何视框' : 'Geometric Box'}`}
              />
            ) : null}

            {/* Parameter Details List */}
            {inputMode === 'both' && activeDualCrop ? (
              <div className="space-y-2 text-xs divide-y divide-slate-800/80">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">{language === 'zh' ? '原图基准尺寸:' : 'Source Dimensions:'}</span>
                  <span className="font-mono text-slate-200">{dualWidth} × {dualHeight} px</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">{language === 'zh' ? '标准化裁剪尺寸:' : 'Aligned Cropped Res:'}</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {activeDualCrop.alignedWidth} × {activeDualCrop.alignedHeight} px
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">{language === 'zh' ? '裁剪裁切量:' : 'Crop Loss Pixels:'}</span>
                  <span className="font-mono text-amber-400">
                    {activeDualCrop.cropType === 'crop_width' && (language === 'zh' ? `水平宽裁切 ${activeDualCrop.trimmedPixelsWidth} px` : `Trim width ${activeDualCrop.trimmedPixelsWidth} px`)}
                    {activeDualCrop.cropType === 'crop_height' && (language === 'zh' ? `垂直高裁切 ${activeDualCrop.trimmedPixelsHeight} px` : `Trim height ${activeDualCrop.trimmedPixelsHeight} px`)}
                    {activeDualCrop.cropType === 'exact' && (language === 'zh' ? '原生比例 0 px' : 'Native ratio 0 px')}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">{language === 'zh' ? '留存像素比率:' : 'Retained Area Ratio:'}</span>
                  <span className="font-mono text-slate-200">
                    {activeDualCrop.retainedPercent}% ({formatPixels(activeDualCrop.retainedPixels)} px)
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">{language === 'zh' ? '长宽比例精度:' : 'Aspect Ratio Accuracy:'}</span>
                  <span className={`font-mono font-medium ${activeDualCrop.ratioErrorPercent === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {activeDualCrop.ratioErrorPercent === 0
                      ? (language === 'zh' ? '100% 绝对精确 (0% 误差)' : '100% Exact (0% drift)')
                      : (language === 'zh' ? `偏离 ${activeDualCrop.ratioErrorPercent}%` : `Drift ${activeDualCrop.ratioErrorPercent}%`)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">{language === 'zh' ? '整除模数校验:' : 'Divisibility Check:'}</span>
                  <span className="font-mono text-emerald-400">
                    W%{multiple}=0 · H%{multiple}=0 ✓
                  </span>
                </div>
              </div>
            ) : activeSingleResult ? (
              <div className="space-y-2 text-xs divide-y divide-slate-800/80">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">{language === 'zh' ? '标准目标比例:' : 'Target Ratio:'}</span>
                  <span className="font-mono text-slate-200">{activeSingleResult.aspectRatio.key}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">{language === 'zh' ? '微调后实际比例:' : 'Aligned Ratio:'}</span>
                  <span className="font-mono text-slate-200">{activeSingleResult.actualRatio.toFixed(4)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">{language === 'zh' ? '长宽比例精度:' : 'Aspect Ratio Accuracy:'}</span>
                  <span className={`font-mono font-medium ${activeSingleResult.ratioErrorPercent === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {activeSingleResult.ratioErrorPercent === 0
                      ? (language === 'zh' ? '100% 绝对精确 (0% 误差)' : '100% Exact (0% drift)')
                      : (language === 'zh' ? `偏离 ${activeSingleResult.ratioErrorPercent}%` : `Drift ${activeSingleResult.ratioErrorPercent}%`)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">{language === 'zh' ? '总像素规模:' : 'Total Pixels:'}</span>
                  <span className="font-mono text-sky-400 font-bold">
                    {formatPixels(activeSingleResult.totalPixels)} px
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )}
  </section>
</div>
);
};
