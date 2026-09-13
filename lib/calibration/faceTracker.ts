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

export class MediaPipeFaceTracker implements FaceTracker {
  private landmarker: FaceLandmarker | null = null;
  private animationFrameId: number | null = null;
  private lastMeasurementAt = 0;
  private lastVideoTime = -1;
  private recentScales: number[] = [];
  private running = false;

  async start(video: HTMLVideoElement, listener: MeasurementListener): Promise<void> {
    this.stop();
    this.running = true;

    if (!this.landmarker) {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      this.landmarker = await FaceLandmarker.createFromOptions(fileset, {
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
    }

    const measure = (timestamp: number) => {
      if (!this.running || !this.landmarker) return;

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
