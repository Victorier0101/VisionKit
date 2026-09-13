"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MediaPipeFaceTracker, type FaceMeasurement } from "@/lib/calibration/faceTracker";
import { median } from "@/lib/calibration/faceDistance";

interface ScaleSample {
  scale: number;
  timestamp: number;
}

export function useFaceDistance(video: HTMLVideoElement | null, enabled: boolean) {
  const trackerRef = useRef(new MediaPipeFaceTracker());
  const samplesRef = useRef<ScaleSample[]>([]);
  const [measurement, setMeasurement] = useState<FaceMeasurement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!video || !enabled) {
      trackerRef.current.stop();
      setMeasurement(null);
      samplesRef.current = [];
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    trackerRef.current
      .start(video, (nextMeasurement) => {
        if (cancelled) return;
        setMeasurement(nextMeasurement);
        if (nextMeasurement.faceScale) {
          samplesRef.current = [
            ...samplesRef.current.filter(
              (sample) => nextMeasurement.timestamp - sample.timestamp <= 2000,
            ),
            { scale: nextMeasurement.faceScale, timestamp: nextMeasurement.timestamp },
          ].slice(-20);
        } else {
          samplesRef.current = [];
        }
      })
      .then(() => {
        if (cancelled) trackerRef.current.stop();
        else setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setError("Face positioning could not start on this browser.");
        }
      });

    return () => {
      cancelled = true;
      trackerRef.current.stop();
    };
  }, [enabled, video]);

  useEffect(
    () => () => {
      trackerRef.current.close();
    },
    [],
  );

  const getRecentFaceScale = useCallback(() => {
    const now = performance.now();
    const recent = samplesRef.current
      .filter((sample) => now - sample.timestamp <= 1500)
      .map((sample) => sample.scale);
    return recent.length >= 5 ? median(recent) : null;
  }, []);

  return { measurement, loading, error, getRecentFaceScale };
}
