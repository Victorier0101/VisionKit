"use client";

import { useCallback, useEffect } from "react";

export function CameraPreview({
  stream,
  setVideoElement,
  compact = false,
}: {
  stream: MediaStream;
  setVideoElement: (element: HTMLVideoElement | null) => void;
  compact?: boolean;
}) {
  const attachVideo = useCallback(
    (element: HTMLVideoElement | null) => {
      setVideoElement(element);
      if (element) element.srcObject = stream;
    },
    [setVideoElement, stream],
  );

  useEffect(
    () => () => {
      setVideoElement(null);
    },
    [setVideoElement],
  );

  return (
    <video
      ref={attachVideo}
      className={`rounded-2xl border-2 border-[var(--ink)] bg-black object-cover [transform:scaleX(-1)] ${compact ? "h-28 w-40" : "aspect-[4/3] w-full"}`}
      autoPlay
      muted
      playsInline
      aria-label="Local camera preview"
    />
  );
}
