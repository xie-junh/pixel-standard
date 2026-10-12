import { useState, useEffect, useCallback } from 'react';
import { StandardResolution } from '../types';
import { STANDARD_RESOLUTIONS } from '../data/standardResolutions';
import { getSimplifiedRatio } from './calculator';

export const STORAGE_KEY = 'pixelmaster_custom_resolutions';
export const CUSTOM_RESOLUTIONS_CHANGED_EVENT = 'pixelmaster_custom_resolutions_updated';

// Default initial sample custom resolution for demonstration
export const INITIAL_CUSTOM_RESOLUTIONS: StandardResolution[] = [
  {
    id: 'custom-xhs-card',
    name: '小红书 3:4 竖图最佳画质',
    width: 1242,
    height: 1656,
    aspectRatio: '3:4',
    ratioValue: 1242 / 1656,
    totalPixels: 1242 * 1656,
    megapixels: +( (1242 * 1656) / 1000000 ).toFixed(2),
    category: 'custom',
    tag: '社媒精细',
    description: '小红书推荐超高清标准分辨率，保真度高且不被算法压缩',
    isCustom: true,
    createdAt: 1700000000000
  }
];

export function getStoredCustomResolutions(): StandardResolution[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First time initialization with nice default example
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CUSTOM_RESOLUTIONS));
      return INITIAL_CUSTOM_RESOLUTIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        ...item,
        isCustom: true,
      }));
    }
    return [];
  } catch (err) {
    console.error('Failed to parse custom resolutions from localStorage:', err);
    return [];
  }
}

export function saveStoredCustomResolutions(resolutions: StandardResolution[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resolutions));
    window.dispatchEvent(new CustomEvent(CUSTOM_RESOLUTIONS_CHANGED_EVENT));
  } catch (err) {
    console.error('Failed to save custom resolutions to localStorage:', err);
  }
}

export interface CustomResolutionInput {
  name: string;
  width: number;
  height: number;
  category?: StandardResolution['category'];
  tag?: string;
  description?: string;
}

export function buildCustomResolution(input: CustomResolutionInput, existingId?: string): StandardResolution {
  const width = Math.max(1, Math.round(input.width));
  const height = Math.max(1, Math.round(input.height));
  const totalPixels = width * height;
  const megapixels = +(totalPixels / 1000000).toFixed(2);
  const ratioValue = +(width / height).toFixed(6);
  const aspectRatio = getSimplifiedRatio(width, height);

  return {
    id: existingId || `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: input.name.trim() || `${width}×${height} 自定义标准`,
    width,
    height,
    aspectRatio,
    ratioValue,
    totalPixels,
    megapixels,
    category: input.category || 'custom',
    tag: input.tag?.trim() || '自定义',
    description: input.description?.trim() || `用户自定义分辨率标准 (${width} × ${height})`,
    isCustom: true,
    createdAt: Date.now(),
  };
}

export function addCustomResolution(input: CustomResolutionInput): StandardResolution {
  const newResolution = buildCustomResolution(input);
  const current = getStoredCustomResolutions();
  const updated = [newResolution, ...current];
  saveStoredCustomResolutions(updated);
  return newResolution;
}

export function updateCustomResolution(id: string, input: CustomResolutionInput): StandardResolution | null {
  const current = getStoredCustomResolutions();
  const index = current.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const updatedItem = buildCustomResolution(input, id);
  const updatedList = [...current];
  updatedList[index] = updatedItem;
  saveStoredCustomResolutions(updatedList);
  return updatedItem;
}

export function deleteCustomResolution(id: string): boolean {
  const current = getStoredCustomResolutions();
  const updated = current.filter((item) => item.id !== id);
  saveStoredCustomResolutions(updated);
  return true;
}

export function resetCustomResolutionsToDefault(): void {
  saveStoredCustomResolutions(INITIAL_CUSTOM_RESOLUTIONS);
}

/**
 * Returns merged list of all standard and custom resolutions
 */
export function getAllResolutions(includeCustom = true): StandardResolution[] {
  if (!includeCustom) return STANDARD_RESOLUTIONS;
  const custom = getStoredCustomResolutions();
  return [...custom, ...STANDARD_RESOLUTIONS];
}

/**
 * React hook to access and manage custom resolutions with real-time updates
 */
export function useCustomResolutions() {
  const [customResolutions, setCustomResolutions] = useState<StandardResolution[]>(() => {
    return getStoredCustomResolutions();
  });

  const reload = useCallback(() => {
    setCustomResolutions(getStoredCustomResolutions());
  }, []);

  useEffect(() => {
    const handleStorageChange = () => reload();
    window.addEventListener(CUSTOM_RESOLUTIONS_CHANGED_EVENT, handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(CUSTOM_RESOLUTIONS_CHANGED_EVENT, handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [reload]);

  const add = useCallback((input: CustomResolutionInput) => {
    const item = addCustomResolution(input);
    reload();
    return item;
  }, [reload]);

  const edit = useCallback((id: string, input: CustomResolutionInput) => {
    const item = updateCustomResolution(id, input);
    reload();
    return item;
  }, [reload]);

  const remove = useCallback((id: string) => {
    deleteCustomResolution(id);
    reload();
  }, [reload]);

  const reset = useCallback(() => {
    resetCustomResolutionsToDefault();
    reload();
  }, [reload]);

  const allResolutions = [...customResolutions, ...STANDARD_RESOLUTIONS];

  return {
    customResolutions,
    allResolutions,
    addCustomResolution: add,
    editCustomResolution: edit,
    deleteCustomResolution: remove,
    resetCustomResolutions: reset,
  };
}
