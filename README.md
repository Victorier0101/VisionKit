# VisionKit

VisionKit is a desktop-first browser project for quick, playful visual-performance challenges. It is an informal benchmark, not a medical exam, diagnosis, or prescription.

## Current implementation

Phases 1–5 provide a polished navigable shell, physical screen calibration, calibrated geometry, a complete adaptive Distance Acuity test, and optional local camera positioning. Users can capture a measured face-scale reference, receive move closer/back guidance, fall back to manual distance, and save a versioned VisionKit result locally.

## Local setup

```bash
npm install
npm run dev
```

Run checks with `npm test` and `npm run build`.

Camera access requires `localhost` during development or HTTPS after deployment.

## Architecture and privacy

The app uses Next.js, React, TypeScript, and Tailwind CSS. Measurement and randomization logic live outside React components and accept testable inputs. There is no account, backend database, analytics, AI API, image upload, or remote user state.

## Roadmap

Later phases add near acuity, contrast, colour differentiation, and a full local result-history dashboard. Accuracy depends on calibration, display configuration, lighting, camera angle, distance, fatigue, and attention.

## Camera positioning privacy

Camera access is requested only after the user explicitly enables positioning. MediaPipe processes camera frames locally; VisionKit does not upload or persist frames, photos, video, or landmark arrays. Only reference distance and face-scale numbers are stored. Google states that MediaPipe Tasks may send performance and utilization metrics to Google while task input remains on device.
