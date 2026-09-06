# VisionKit

VisionKit is a desktop-first browser project for quick, playful visual-performance challenges. It is an informal benchmark, not a medical exam, diagnosis, or prescription.

## Current implementation

Phases 1–4 provide a polished navigable shell, physical screen calibration, calibrated geometry, and a complete adaptive Distance Acuity test. Users can choose an eye mode, enter a measured viewing distance, complete practice and scored trials, and save a versioned VisionKit result locally.

## Local setup

```bash
npm install
npm run dev
```

Run checks with `npm test` and `npm run build`.

## Architecture and privacy

The app uses Next.js, React, TypeScript, and Tailwind CSS. Measurement and randomization logic live outside React components and accept testable inputs. There is no account, backend database, analytics, AI API, image upload, or remote user state.

## Roadmap

Later phases add local webcam positioning, near acuity, contrast, colour differentiation, and a full local result-history dashboard. Accuracy depends on calibration, display configuration, lighting, distance, fatigue, and attention.
