import {
  AlignmentMultiple,
  AspectRatioDef,
  CropPriorityMode,
  DimensionType,
  DualAxisCropResult,
  NonStandardResult,
  RoundingMode,
  ScaledResolutionResult,
  StandardMatchDualResult,
  StandardMatchResult,
  StandardResolution,
} from '../types';
import { COMMON_ASPECT_RATIOS } from '../data/aspectRatios';
import { STANDARD_RESOLUTIONS } from '../data/standardResolutions';

/**
 * Snap a number to the nearest, floor, or ceil multiple of M
 */
export function snapToMultiple(
  value: number,
  multiple: AlignmentMultiple,
  mode: RoundingMode = 'nearest'
): number {
  if (multiple <= 1) return Math.max(1, Math.round(value));
  
  let snapped: number;
  if (mode === 'floor') {
    snapped = Math.floor(value / multiple) * multiple;
  } else if (mode === 'ceil') {
    snapped = Math.ceil(value / multiple) * multiple;
  } else {
    snapped = Math.round(value / multiple) * multiple;
  }
  return Math.max(multiple, snapped);
}

/**
 * Calculate greatest common divisor for aspect ratio simplification
 */
export function gcd(a: number, b: number): number {
  a = Math.round(Math.abs(a));
  b = Math.round(Math.abs(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

/**
 * Calculate least common multiple
 */
export function lcm(a: number, b: number): number {
  a = Math.round(Math.abs(a));
  b = Math.round(Math.abs(b));
  if (!a || !b) return 0;
  return Math.round((a * b) / gcd(a, b));
}

/**
 * Compute irreducible integer ratio step (unitW, unitH) that strictly adheres
 * to the aspect ratio wNum:hNum and guarantees both unitW % multiple === 0 and unitH % multiple === 0.
 */
export function getStrictRatioStep(
  wNum: number,
  hNum: number,
  multiple: AlignmentMultiple
): { unitW: number; unitH: number; reducedW: number; reducedH: number } {
  const g = gcd(wNum, hNum);
  const rw = Math.round(wNum / g);
  const rh = Math.round(hNum / g);
  if (multiple <= 1) {
    return { unitW: rw, unitH: rh, reducedW: rw, reducedH: rh };
  }
  // To satisfy (rw * k) % multiple === 0 and (rh * k) % multiple === 0:
  // k must be a multiple of multiple / gcd(rw, multiple)
  // and k must be a multiple of multiple / gcd(rh, multiple)
  const reqKw = multiple / gcd(rw, multiple);
  const reqKh = multiple / gcd(rh, multiple);
  const kStep = lcm(reqKw, reqKh);

  const unitW = rw * kStep;
  const unitH = rh * kStep;
  return { unitW, unitH, reducedW: rw, reducedH: rh };
}

/**
 * Format number with comma separators (e.g. 2,073,600)
 */
export function formatPixels(num: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
}

/**
 * Format megapixels (e.g. 2.07 MP)
 */
export function formatMegapixels(pixels: number): string {
  const mp = pixels / 1000000;
  if (mp >= 10) return `${mp.toFixed(1)} MP`;
  if (mp >= 1) return `${mp.toFixed(2)} MP`;
  return `${mp.toFixed(3)} MP`;
}

/**
 * Compute simplified aspect ratio string from dimensions
 */
export function getSimplifiedRatio(w: number, h: number): string {
  if (!w || !h) return '0:0';
  const divisor = gcd(w, h);
  const sw = w / divisor;
  const sh = h / divisor;

  // Check if matches common standard decimal forms like 2.39:1, 1.85:1
  const decimal = w / h;
  if (Math.abs(decimal - 16 / 9) < 0.01) return '16:9';
  if (Math.abs(decimal - 9 / 16) < 0.01) return '9:16';
  if (Math.abs(decimal - 4 / 3) < 0.01) return '4:3';
  if (Math.abs(decimal - 3 / 4) < 0.01) return '3:4';
  if (Math.abs(decimal - 1) < 0.001) return '1:1';
  if (Math.abs(decimal - 3 / 2) < 0.01) return '3:2';
  if (Math.abs(decimal - 2 / 3) < 0.01) return '2:3';
  if (Math.abs(decimal - 21 / 9) < 0.05) return '21:9';

  if (sw <= 50 && sh <= 50) {
    return `${sw}:${sh}`;
  }
  return `${decimal.toFixed(2)}:1`;
}

/**
 * FEATURE 1 - PART A (Single Side):
 * Match standard resolutions close to the given dimension value
 */
export function matchStandardResolutions(
  dimensionType: DimensionType,
  value: number,
  categoryFilter: 'all' | 'landscape' | 'portrait' | 'square' = 'all',
  limit: number = 8,
  pool: StandardResolution[] = STANDARD_RESOLUTIONS
): StandardMatchResult[] {
  if (value <= 0) return [];

  const results: StandardMatchResult[] = [];

  for (const std of pool) {
    if (categoryFilter !== 'all') {
      const isLandscape = std.width > std.height;
      const isPortrait = std.height > std.width;
      const isSquare = std.width === std.height;

      if (categoryFilter === 'landscape' && !isLandscape) continue;
      if (categoryFilter === 'portrait' && !isPortrait) continue;
      if (categoryFilter === 'square' && !isSquare) continue;
    }

    const targetDimension = dimensionType === 'height' ? std.height : std.width;
    const signedDelta = targetDimension - value;
    const absDelta = Math.abs(signedDelta);
    const deltaPercent = +((absDelta / targetDimension) * 100).toFixed(2);
    const computedOtherSide = dimensionType === 'height' ? std.width : std.height;
    const sizeRelation = signedDelta === 0 ? 'exact' : signedDelta > 0 ? 'larger' : 'smaller';

    results.push({
      resolution: std,
      delta: signedDelta,
      absDelta,
      deltaPercent,
      matchedSide: dimensionType,
      computedOtherSide,
      isExact: signedDelta === 0,
      sizeRelation,
    });
  }

  // Sort by absolute delta ascending, then by total pixels
  results.sort((a, b) => {
    if (a.absDelta !== b.absDelta) return a.absDelta - b.absDelta;
    return b.resolution.totalPixels - a.resolution.totalPixels;
  });

  return results.slice(0, limit);
}

/**
 * FEATURE 1 - PART A (Dual Axis / Both Sides):
 * Match standard resolutions close to both input Width and Height
 */
export function matchStandardResolutionsDual(
  width: number,
  height: number,
  categoryFilter: 'all' | 'landscape' | 'portrait' | 'square' = 'all',
  limit: number = 8,
  pool: StandardResolution[] = STANDARD_RESOLUTIONS
): StandardMatchDualResult[] {
  if (width <= 0 || height <= 0) return [];

  const results: StandardMatchDualResult[] = [];

  for (const std of pool) {
    if (categoryFilter !== 'all') {
      const isLandscape = std.width > std.height;
      const isPortrait = std.height > std.width;
      const isSquare = std.width === std.height;

      if (categoryFilter === 'landscape' && !isLandscape) continue;
      if (categoryFilter === 'portrait' && !isPortrait) continue;
      if (categoryFilter === 'square' && !isSquare) continue;
    }

    const deltaW = std.width - width; // Signed delta
    const deltaH = std.height - height; // Signed delta
    const absDeltaW = Math.abs(deltaW);
    const absDeltaH = Math.abs(deltaH);

    // Normalized Euclidean distance
    const normDist = Math.sqrt(
      Math.pow(absDeltaW / Math.max(1, width), 2) +
      Math.pow(absDeltaH / Math.max(1, height), 2)
    );

    const isExact = deltaW === 0 && deltaH === 0;

    let sizeRelation: 'larger' | 'smaller' | 'mixed' | 'exact' = 'exact';
    if (!isExact) {
      if (deltaW >= 0 && deltaH >= 0) sizeRelation = 'larger';
      else if (deltaW <= 0 && deltaH <= 0) sizeRelation = 'smaller';
      else sizeRelation = 'mixed';
    }

    let cropAction: 'crop_width' | 'crop_height' | 'expand' | 'exact' = 'exact';
    if (!isExact) {
      const origRatio = width / height;
      const stdRatio = std.width / std.height;
      if (Math.abs(origRatio - stdRatio) < 0.01) {
        cropAction = std.width > width ? 'expand' : 'exact';
      } else if (origRatio > stdRatio) {
        cropAction = 'crop_width';
      } else {
        cropAction = 'crop_height';
      }
    }

    results.push({
      resolution: std,
      deltaW,
      deltaH,
      absDeltaW,
      absDeltaH,
      totalDistance: Math.round(normDist * 10000) / 100, // percentage distance
      isExact,
      sizeRelation,
      cropAction,
    });
  }

  // Sort by combined distance
  results.sort((a, b) => a.totalDistance - b.totalDistance);

  return results.slice(0, limit);
}

/**
 * FEATURE 1 - PART B (Single Side):
 * Calculate the closest non-standard ("非常用") resolution for fixed common aspect ratios
 * under a multiple alignment constraint (2, 4, 8, 16, 32, 64)
 */
export function calculateNonStandardResolutions(
  dimensionType: DimensionType,
  inputValue: number,
  multiple: AlignmentMultiple = 8,
  roundingMode: RoundingMode = 'nearest',
  alignBothSides: boolean = true,
  categoryFilter: 'all' | 'landscape' | 'portrait' | 'square' = 'all',
  priorityMode: CropPriorityMode = 'strict_ratio'
): NonStandardResult[] {
  if (inputValue <= 0) return [];

  const targetRatios = COMMON_ASPECT_RATIOS.filter((r) => {
    if (categoryFilter === 'all') return true;
    return r.category === categoryFilter;
  });

  return targetRatios.map((ar) => {
    let alignedWidth = 0;
    let alignedHeight = 0;
    let exactOtherSide = 0;
    let isStrict = false;

    if (priorityMode === 'strict_ratio') {
      const { unitW, unitH } = getStrictRatioStep(ar.w, ar.h, multiple);
      let s = 1;

      if (dimensionType === 'height') {
        exactOtherSide = inputValue * ar.ratio;
        const idealS = inputValue / unitH;
        if (roundingMode === 'floor') {
          s = Math.max(1, Math.floor(idealS));
        } else if (roundingMode === 'ceil') {
          s = Math.max(1, Math.ceil(idealS));
        } else {
          s = Math.max(1, Math.round(idealS));
        }
        alignedHeight = unitH * s;
        alignedWidth = unitW * s;
        isStrict = true;
      } else {
        exactOtherSide = inputValue / ar.ratio;
        const idealS = inputValue / unitW;
        if (roundingMode === 'floor') {
          s = Math.max(1, Math.floor(idealS));
        } else if (roundingMode === 'ceil') {
          s = Math.max(1, Math.ceil(idealS));
        } else {
          s = Math.max(1, Math.round(idealS));
        }
        alignedWidth = unitW * s;
        alignedHeight = unitH * s;
        isStrict = true;
      }
    } else {
      // Independent max_area mode
      if (dimensionType === 'height') {
        const baseHeight = alignBothSides
          ? snapToMultiple(inputValue, multiple, roundingMode)
          : inputValue;
        exactOtherSide = baseHeight * ar.ratio;
        alignedHeight = baseHeight;
        alignedWidth = snapToMultiple(exactOtherSide, multiple, roundingMode);
      } else {
        const baseWidth = alignBothSides
          ? snapToMultiple(inputValue, multiple, roundingMode)
          : inputValue;
        exactOtherSide = baseWidth / ar.ratio;
        alignedWidth = baseWidth;
        alignedHeight = snapToMultiple(exactOtherSide, multiple, roundingMode);
      }
      isStrict = Math.abs(alignedWidth / alignedHeight - ar.ratio) < 0.0001;
    }

    const totalPixels = alignedWidth * alignedHeight;
    const megapixels = +(totalPixels / 1000000).toFixed(3);
    const actualRatio = +(alignedWidth / alignedHeight).toFixed(4);
    const targetRatio = ar.ratio;
    const ratioErrorPercent = isStrict
      ? 0
      : +(
          (Math.abs(actualRatio - targetRatio) / targetRatio) *
          100
        ).toFixed(2);

    const deltaWidth =
      dimensionType === 'height' ? alignedWidth - exactOtherSide : 0;
    const deltaHeight =
      dimensionType === 'width' ? alignedHeight - exactOtherSide : 0;

    return {
      aspectRatio: ar,
      targetSide: dimensionType,
      inputValue,
      exactOtherSide: Math.round(exactOtherSide * 10) / 10,
      alignedWidth,
      alignedHeight,
      multiple,
      totalPixels,
      megapixels,
      actualRatio,
      targetRatio,
      ratioErrorPercent,
      deltaWidth: Math.round(deltaWidth),
      deltaHeight: Math.round(deltaHeight),
      priorityMode,
      isStrictRatio: isStrict,
    };
  });
}

/**
 * FEATURE 1 - PART B (Dual Axis / Both Sides Cropping):
 * Calculate optimal crop inside W x H to match fixed common aspect ratios
 * strictly aligned to multiples of M (2, 4, 8, 16, 32, 64)
 */
export function calculateDualAxisCropResults(
  origWidth: number,
  origHeight: number,
  multiple: AlignmentMultiple = 16,
  roundingMode: RoundingMode = 'floor',
  categoryFilter: 'all' | 'landscape' | 'portrait' | 'square' = 'all',
  priorityMode: CropPriorityMode = 'strict_ratio'
): DualAxisCropResult[] {
  if (origWidth <= 0 || origHeight <= 0) return [];

  const targetRatios = COMMON_ASPECT_RATIOS.filter((r) => {
    if (categoryFilter === 'all') return true;
    return r.category === categoryFilter;
  });

  const origRatio = origWidth / origHeight;
  const origTotal = origWidth * origHeight;

  return targetRatios.map((ar) => {
    const targetR = ar.ratio;
    let cropType: 'crop_width' | 'crop_height' | 'exact' = 'exact';
    let rawCropW = origWidth;
    let rawCropH = origHeight;

    if (Math.abs(origRatio - targetR) < 0.0001) {
      cropType = 'exact';
      rawCropW = origWidth;
      rawCropH = origHeight;
    } else if (origRatio > targetR) {
      // Original is wider: keep height, crop width
      cropType = 'crop_width';
      rawCropH = origHeight;
      rawCropW = origHeight * targetR;
    } else {
      // Original is taller: keep width, crop height
      cropType = 'crop_height';
      rawCropW = origWidth;
      rawCropH = origWidth / targetR;
    }

    let alignedWidth = 0;
    let alignedHeight = 0;
    let isStrict = false;

    if (priorityMode === 'strict_ratio') {
      const { unitW, unitH } = getStrictRatioStep(ar.w, ar.h, multiple);
      const maxFittingS = Math.min(
        Math.floor(origWidth / unitW),
        Math.floor(origHeight / unitH)
      );

      if (roundingMode === 'floor') {
        if (maxFittingS >= 1) {
          alignedWidth = unitW * maxFittingS;
          alignedHeight = unitH * maxFittingS;
          isStrict = true;
        } else {
          // If a full integer unit doesn't fit within the image bounds,
          // fallback to max_area snap to not overflow orig bounds
          alignedWidth = snapToMultiple(rawCropW, multiple, 'floor');
          alignedHeight = snapToMultiple(rawCropH, multiple, 'floor');
          if (alignedWidth > origWidth) {
            alignedWidth = Math.max(multiple, Math.floor(origWidth / multiple) * multiple);
          }
          if (alignedHeight > origHeight) {
            alignedHeight = Math.max(multiple, Math.floor(origHeight / multiple) * multiple);
          }
          isStrict = Math.abs(alignedWidth / alignedHeight - targetR) < 0.0001;
        }
      } else if (roundingMode === 'ceil') {
        const sIdeal = Math.max(rawCropW / unitW, rawCropH / unitH);
        const s = Math.max(1, Math.ceil(sIdeal));
        alignedWidth = unitW * s;
        alignedHeight = unitH * s;
        isStrict = true;
      } else {
        // 'nearest'
        const sIdeal = rawCropW / unitW;
        const s = Math.max(1, Math.round(sIdeal));
        alignedWidth = unitW * s;
        alignedHeight = unitH * s;
        isStrict = true;
      }
    } else {
      // Independent max_area mode
      alignedWidth = snapToMultiple(rawCropW, multiple, roundingMode);
      alignedHeight = snapToMultiple(rawCropH, multiple, roundingMode);

      if (roundingMode === 'floor') {
        if (alignedWidth > origWidth) {
          alignedWidth = Math.max(multiple, Math.floor(origWidth / multiple) * multiple);
        }
        if (alignedHeight > origHeight) {
          alignedHeight = Math.max(multiple, Math.floor(origHeight / multiple) * multiple);
        }
      }
      isStrict = Math.abs(alignedWidth / alignedHeight - targetR) < 0.0001;
    }

    const retainedPixels = alignedWidth * alignedHeight;
    const discardedPixels = Math.max(0, origTotal - retainedPixels);
    const retainedPercent = Math.min(100, +((retainedPixels / origTotal) * 100).toFixed(1));
    const discardedPercent = Math.max(0, +(100 - retainedPercent).toFixed(1));

    const trimmedPixelsWidth = Math.max(0, origWidth - alignedWidth);
    const trimmedPixelsHeight = Math.max(0, origHeight - alignedHeight);

    const actualRatio = +(alignedWidth / alignedHeight).toFixed(4);
    const ratioErrorPercent = isStrict
      ? 0
      : +(
          (Math.abs(actualRatio - targetR) / targetR) *
          100
        ).toFixed(2);

    return {
      aspectRatio: ar,
      origWidth,
      origHeight,
      alignedWidth,
      alignedHeight,
      multiple,
      cropType,
      trimmedPixelsWidth,
      trimmedPixelsHeight,
      retainedPixels,
      retainedPercent,
      discardedPixels,
      discardedPercent,
      actualRatio,
      targetRatio: +targetR.toFixed(4),
      ratioErrorPercent,
      priorityMode,
      isStrictRatio: isStrict,
    };
  });
}

/**
 * FEATURE 2:
 * Scale image/video based on target total pixels in a fixed aspect ratio,
 * auto-optimizing to the best resolution strictly divisible by the specified multiple.
 */
export function calculateScaledResolution(
  targetPixels: number,
  aspectRatio: AspectRatioDef,
  multiple: AlignmentMultiple = 8,
  optimizationGoal: 'balanced' | 'strict_ratio' | 'max_pixels' | 'min_pixels' = 'balanced'
): ScaledResolutionResult {
  if (targetPixels <= 0) {
    return {
      aspectRatio,
      targetPixels: 0,
      alignedWidth: multiple,
      alignedHeight: multiple,
      multiple,
      actualPixels: multiple * multiple,
      pixelDelta: 0,
      pixelDeltaPercent: 0,
      actualRatio: 1,
      targetRatio: aspectRatio.ratio,
      ratioErrorPercent: 0,
      score: 0,
    };
  }

  const r = aspectRatio.ratio;
  // Ideal continuous dimensions
  const idealW = Math.sqrt(targetPixels * r);
  const idealH = Math.sqrt(targetPixels / r);

  // Search neighborhood around ideal snapped factors
  const m = multiple <= 1 ? 1 : multiple;
  const kwCenter = Math.max(1, Math.round(idealW / m));
  const khCenter = Math.max(1, Math.round(idealH / m));

  const searchRadius = 6;
  const candidates: Array<{
    w: number;
    h: number;
    pixels: number;
    pixelDelta: number;
    pixelDeltaPercent: number;
    actualRatio: number;
    ratioErrorPercent: number;
    score: number;
  }> = [];

  for (let kw = Math.max(1, kwCenter - searchRadius); kw <= kwCenter + searchRadius; kw++) {
    for (let kh = Math.max(1, khCenter - searchRadius); kh <= khCenter + searchRadius; kh++) {
      const w = kw * m;
      const h = kh * m;
      const actualPixels = w * h;
      const pixelDelta = actualPixels - targetPixels;
      const pixelDeltaPercent = (Math.abs(pixelDelta) / targetPixels) * 100;
      const actualRatio = w / h;
      const ratioErrorPercent = (Math.abs(actualRatio - r) / r) * 100;

      // Filter by boundary conditions if specified
      if (optimizationGoal === 'max_pixels' && actualPixels > targetPixels) {
        continue;
      }
      if (optimizationGoal === 'min_pixels' && actualPixels < targetPixels) {
        continue;
      }

      // Weights
      let score = 0;
      if (optimizationGoal === 'strict_ratio') {
        score = ratioErrorPercent * 10.0 + pixelDeltaPercent * 0.5;
      } else {
        // Balanced
        score = ratioErrorPercent * 2.0 + pixelDeltaPercent * 1.0;
      }

      candidates.push({
        w,
        h,
        pixels: actualPixels,
        pixelDelta,
        pixelDeltaPercent,
        actualRatio,
        ratioErrorPercent,
        score,
      });
    }
  }

  // If strict ratio is requested, inject exact integer ratio candidates
  if (optimizationGoal === 'strict_ratio') {
    const { unitW, unitH } = getStrictRatioStep(aspectRatio.w, aspectRatio.h, multiple);
    const idealS = Math.sqrt(targetPixels / (unitW * unitH));
    const sCenter = Math.max(1, Math.round(idealS));
    for (let s = Math.max(1, sCenter - 8); s <= sCenter + 8; s++) {
      const w = unitW * s;
      const h = unitH * s;
      const actualPixels = w * h;
      const pixelDelta = actualPixels - targetPixels;
      const pixelDeltaPercent = (Math.abs(pixelDelta) / targetPixels) * 100;
      candidates.push({
        w,
        h,
        pixels: actualPixels,
        pixelDelta,
        pixelDeltaPercent,
        actualRatio: +(w / h).toFixed(4),
        ratioErrorPercent: 0,
        score: pixelDeltaPercent * 0.5, // 0 ratio penalty!
      });
    }
  }

  // Fallback if strict filter eliminated all
  if (candidates.length === 0) {
    const w = kwCenter * m;
    const h = khCenter * m;
    const actualPixels = w * h;
    return {
      aspectRatio,
      targetPixels,
      alignedWidth: w,
      alignedHeight: h,
      multiple,
      actualPixels,
      pixelDelta: actualPixels - targetPixels,
      pixelDeltaPercent: +((Math.abs(actualPixels - targetPixels) / targetPixels) * 100).toFixed(2),
      actualRatio: +(w / h).toFixed(4),
      targetRatio: +r.toFixed(4),
      ratioErrorPercent: +((Math.abs(w / h - r) / r) * 100).toFixed(2),
      score: 0,
    };
  }

  // Pick lowest score candidate
  candidates.sort((a, b) => a.score - b.score);
  const best = candidates[0];

  return {
    aspectRatio,
    targetPixels,
    alignedWidth: best.w,
    alignedHeight: best.h,
    multiple,
    actualPixels: best.pixels,
    pixelDelta: best.pixelDelta,
    pixelDeltaPercent: +best.pixelDeltaPercent.toFixed(2),
    actualRatio: +best.actualRatio.toFixed(4),
    targetRatio: +r.toFixed(4),
    ratioErrorPercent: +best.ratioErrorPercent.toFixed(2),
    score: +best.score.toFixed(3),
  };
}

/**
 * FEATURE 2 - BATCH:
 * Calculate scaled resolutions for all common aspect ratios under the same pixel budget
 */
export function calculateBatchScaledResolutions(
  targetPixels: number,
  multiple: AlignmentMultiple = 8,
  optimizationGoal: 'balanced' | 'strict_ratio' | 'max_pixels' | 'min_pixels' = 'balanced'
): ScaledResolutionResult[] {
  return COMMON_ASPECT_RATIOS.map((ar) =>
    calculateScaledResolution(targetPixels, ar, multiple, optimizationGoal)
  );
}
