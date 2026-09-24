import { useBetween } from 'use-between';
import { LocalStorageKeys } from '../../api';
import { useLocalStorage } from '../useLocalStorage';

// Real reference defaults, verified live (the reference's own "Réinitialiser"/Reset button restores
// these exact values): 512 staircases, 1024 rectangles, 256 room width/length.
export const FLOOR_STAIRS_DEFAULT = 512;
export const FLOOR_RECT_DEFAULT = 1024;
export const FLOOR_SIZE_DEFAULT = 256;

// Real reference "infinite" thresholds, verified live (the slider's own max is threshold+1, and the
// label shows "Infinite" once the value exceeds this number): 2048/4096/256.
export const FLOOR_STAIRS_MAX = 2048;
export const FLOOR_RECT_MAX = 4096;
export const FLOOR_SIZE_MAX = 256;

const useFloorStairsThresholdState = () => useLocalStorage(LocalStorageKeys.FLOOR_STAIRS_TRESHOLD, FLOOR_STAIRS_DEFAULT);
const useFloorRectThresholdState = () => useLocalStorage(LocalStorageKeys.FLOOR_RECT_TRESHOLD, FLOOR_RECT_DEFAULT);
const useFloorSizeThresholdState = () => useLocalStorage(LocalStorageKeys.FLOOR_SIZE_TRESHOLD, FLOOR_SIZE_DEFAULT);

export const useFloorStairsThreshold = () => useBetween(useFloorStairsThresholdState);
export const useFloorRectThreshold = () => useBetween(useFloorRectThresholdState);
export const useFloorSizeThreshold = () => useBetween(useFloorSizeThresholdState);
