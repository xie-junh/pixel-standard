export type DimensionType = 'height' | 'width';
export type DimensionInputMode = 'height' | 'width' | 'both';

export type AlignmentMultiple = 1 | 2 | 4 | 8 | 16 | 32 | 64;

export type RoundingMode = 'nearest' | 'floor' | 'ceil';

export type CropPriorityMode = 'strict_ratio' | 'max_area';

export type AspectRatioCategory = 'all' | 'landscape' | 'portrait' | 'square';

export interface AspectRatioDef {
  key: string;
  name: string;
  w: number;
  h: number;
  ratio: number; // w / h
  category: 'landscape' | 'portrait' | 'square';
  commonUsage: string;
}

export interface StandardResolution {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  ratioValue: number;
  totalPixels: number;
  megapixels: number;
  category: 'video' | 'photo' | 'social' | 'cinema' | 'ai' | 'display' | 'custom';
  tag?: string;
  description: string;
  isCustom?: boolean;
  createdAt?: number;
}

export interface StandardMatchResult {
  resolution: StandardResolution;
  delta: number; // Signed delta: stdDimension - inputValue (e.g. +56, -224, 0)
  absDelta: number;
  deltaPercent: number;
  matchedSide: DimensionType;
  computedOtherSide: number;
  isExact: boolean;
  sizeRelation: 'larger' | 'smaller' | 'exact';
}

export interface StandardMatchDualResult {
  resolution: StandardResolution;
  deltaW: number; // Signed delta: std.width - width (e.g. +56, -224, 0)
  deltaH: number; // Signed delta: std.height - height
  absDeltaW: number;
  absDeltaH: number;
  totalDistance: number;
  isExact: boolean;
  sizeRelation: 'larger' | 'smaller' | 'mixed' | 'exact';
  cropAction: 'crop_width' | 'crop_height' | 'expand' | 'exact';
}

export interface DualAxisCropResult {
  aspectRatio: AspectRatioDef;
  origWidth: number;
  origHeight: number;
  alignedWidth: number;
  alignedHeight: number;
  multiple: AlignmentMultiple;
  cropType: 'crop_width' | 'crop_height' | 'exact';
  trimmedPixelsWidth: number; // width pixels removed
  trimmedPixelsHeight: number; // height pixels removed
  retainedPixels: number;
  retainedPercent: number;
  discardedPixels: number;
  discardedPercent: number;
  actualRatio: number;
  targetRatio: number;
  ratioErrorPercent: number;
  priorityMode?: CropPriorityMode;
  isStrictRatio?: boolean;
}

export interface NonStandardResult {
  aspectRatio: AspectRatioDef;
  targetSide: DimensionType;
  inputValue: number;
  exactOtherSide: number;
  alignedWidth: number;
  alignedHeight: number;
  multiple: AlignmentMultiple;
  totalPixels: number;
  megapixels: number;
  actualRatio: number;
  targetRatio: number;
  ratioErrorPercent: number; // |actual - target| / target * 100
  deltaWidth: number; // alignedWidth - exactWidth
  deltaHeight: number; // alignedHeight - exactHeight
  priorityMode?: CropPriorityMode;
  isStrictRatio?: boolean;
}

export interface ScaledResolutionResult {
  aspectRatio: AspectRatioDef;
  targetPixels: number;
  alignedWidth: number;
  alignedHeight: number;
  multiple: AlignmentMultiple;
  actualPixels: number;
  pixelDelta: number; // actual - target
  pixelDeltaPercent: number;
  actualRatio: number;
  targetRatio: number;
  ratioErrorPercent: number;
  score: number;
}
