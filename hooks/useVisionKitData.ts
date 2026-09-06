"use client";

import { useCallback, useEffect, useState } from "react";
import {
  appendResult,
  loadVisionKitData,
  saveDistanceCalibration,
  saveScreenCalibration,
} from "@/lib/storage/storage";
import { defaultData, type VisionKitStorageV1 } from "@/lib/storage/schema";
import type { DistanceCalibration, ScreenCalibration } from "@/types/calibration";
import type { TestResult } from "@/types/results";

export function useVisionKitData() {
  const [data, setData] = useState<VisionKitStorageV1>(defaultData);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    setData(loadVisionKitData());
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const storeScreenCalibration = useCallback((calibration: ScreenCalibration) => {
    const saved = saveScreenCalibration(calibration);
    if (saved) setData(loadVisionKitData());
    return saved;
  }, []);

  const storeDistanceCalibration = useCallback((calibration: DistanceCalibration) => {
    const saved = saveDistanceCalibration(calibration);
    if (saved) setData(loadVisionKitData());
    return saved;
  }, []);

  const storeResult = useCallback((result: TestResult) => {
    const saved = appendResult(result);
    if (saved) setData(loadVisionKitData());
    return saved;
  }, []);

  return {
    data,
    loaded,
    refresh,
    storeScreenCalibration,
    storeDistanceCalibration,
    storeResult,
  };
}
