import type { FaceLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { calculateFaceScale, median } from "./faceDistance";

export interface FaceMeasurement {
  faceScale: number | null;
  faceCount: number;
  timestamp: number;
}

export type MeasurementListener = (measurement: FaceMeasurement) => void;

export interface FaceTracker {
  start(video: HTMLVideoElement, listener: MeasurementListener): Promise<void>;
  stop(): void;
}

const MEASUREMENT_INTERVAL_MS = 100;
const SMOOTHING_WINDOW = 5;
const XNNPACK_INITIALIZATION_MESSAGE = "Created TensorFlow Lite XNNPACK delegate for CPU";

export function isBenignMediaPipeConsoleMessage(args: readonly unknown[]): boolean {
  return args.some(
    (argument) => typeof argument === "string" && argument.includes(XNNPACK_INITIALIZATION_MESSAGE),
  );
}

async function initializeFaceLandmarker(): Promise<FaceLandmarker> {
  const originalConsoleError = console.error;

  // MediaPipe's generated WASM loader binds informational stderr output to console.error.
  // Bind it through this exact-message filter so Next.js does not present a harmless
  // XNNPACK initialization notice as an application error.
  console.error = (...args: unknown[]) => {
    if (!isBenignMediaPipeConsoleMessage(args)) {
      originalConsoleError(...args);
    }
  };

  try {
    const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    return await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: "/models/face_landmarker.task",
        delegate: "CPU",
      },
      runningMode: "VIDEO",
      numFaces: 2,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
  } finally {
    console.error = originalConsoleError;
  }
}

export class MediaPipeFaceTracker implements FaceTracker {
  private landmarker: FaceLandmarker | null = null;
  private initializationPromise: Promise<FaceLandmarker> | null = null;
  private animationFrameId: number | null = null;
  private lastMeasurementAt = 0;
  private lastVideoTime = -1;
  private recentScales: number[] = [];
  private running = false;
  private runToken = 0;

  async start(video: HTMLVideoElement, listener: MeasurementListener): Promise<void> {
    this.stop();
    this.running = true;
    const runToken = this.runToken;

    if (!this.landmarker) {
      const initialization = this.initializationPromise ?? initializeFaceLandmarker();
      this.initializationPromise = initialization;
      try {
        this.landmarker = await initialization;
      } finally {
        if (this.initializationPromise === initialization) {
          this.initializationPromise = null;
        }
      }
    }

    if (!this.running || runToken !== this.runToken) return;

    const measure = (timestamp: number) => {
      if (!this.running || runToken !== this.runToken || !this.landmarker) return;

      if (
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.currentTime !== this.lastVideoTime &&
        timestamp - this.lastMeasurementAt >= MEASUREMENT_INTERVAL_MS
      ) {
        this.lastMeasurementAt = timestamp;
        this.lastVideoTime = video.currentTime;
        try {
          const result = this.landmarker.detectForVideo(video, timestamp);
          const faceCount = result.faceLandmarks.length;
          let faceScale: number | null = null;

          if (faceCount === 1) {
            const scale = calculateFaceScale(
              result.faceLandmarks[0] as readonly NormalizedLandmark[],
            );
            this.recentScales = [...this.recentScales, scale].slice(-SMOOTHING_WINDOW);
            faceScale = median(this.recentScales);
          } else {
            this.recentScales = [];
          }

          listener({ faceScale, faceCount, timestamp });
        } catch {
          this.recentScales = [];
          listener({ faceScale: null, faceCount: 0, timestamp });
        }
      }

      this.animationFrameId = requestAnimationFrame(measure);
    };

    this.animationFrameId = requestAnimationFrame(measure);
  }

  stop(): void {
    this.running = false;
    this.runToken += 1;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.lastMeasurementAt = 0;
    this.lastVideoTime = -1;
    this.recentScales = [];
  }

  close(): void {
    this.stop();
    this.landmarker?.close();
    this.landmarker = null;
  }
}
