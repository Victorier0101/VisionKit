# VisionKit — Technical Design Document

**Status:** MVP v1  
**Companion document:** `REQUIREMENTS.md`

Codex should read `REQUIREMENTS.md` before implementing this design.

---

## 1. Architecture Summary

VisionKit is a client-heavy Next.js application.

The MVP intentionally has:

- no backend database;
- no authentication;
- no LLM/AI API;
- no server-side user state;
- no cloud image/video processing.

Most application logic runs in the browser.

Recommended stack:

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- MediaPipe Tasks Vision / Face Landmarker for browser face landmarks
- localStorage
- native browser MediaDevices API
- Vitest or Jest for unit tests
- Playwright for critical browser flows if time permits
- Vercel deployment

Do **not** add shadcn/ui for MVP unless a component becomes difficult to maintain manually. The interface is small enough to use plain React components styled with Tailwind.

---

## 2. Engineering Principles

1. **Measurement logic must be separate from UI.**
2. **All test algorithms must be deterministic except randomized trial selection.**
3. **Randomized trials should use injectable RNG utilities for testability.**
4. **Scoring must be versioned.**
5. **Calibration data must be snapshotted with results.**
6. **Never silently use invalid calibration.**
7. **Webcam frames never leave the browser.**
8. **Components should not directly manipulate localStorage.**
9. **Do not over-engineer the MVP.**
10. **Prefer simple, testable functions over large frameworks.**

---

## 3. Suggested Project Structure

```text
visionkit/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ globals.css
│  ├─ calibration/
│  │  └─ page.tsx
│  ├─ tests/
│  │  ├─ distance-acuity/
│  │  │  └─ page.tsx
│  │  ├─ near-acuity/
│  │  │  └─ page.tsx
│  │  ├─ contrast/
│  │  │  └─ page.tsx
│  │  └─ colour/
│  │     └─ page.tsx
│  ├─ results/
│  │  └─ page.tsx
│  └─ settings/
│     └─ page.tsx
│
├─ components/
│  ├─ layout/
│  │  ├─ Header.tsx
│  │  └─ Footer.tsx
│  ├─ home/
│  │  ├─ TestCard.tsx
│  │  └─ RecentResults.tsx
│  ├─ calibration/
│  │  ├─ CardCalibration.tsx
│  │  ├─ CameraPermission.tsx
│  │  ├─ FaceDistanceGuide.tsx
│  │  └─ ManualDistanceFallback.tsx
│  ├─ test/
│  │  ├─ TestShell.tsx
│  │  ├─ EyeModeSelector.tsx
│  │  ├─ EyeCoverInstructions.tsx
│  │  ├─ DirectionalE.tsx
│  │  ├─ TrialFeedback.tsx
│  │  └─ ProgressIndicator.tsx
│  ├─ results/
│  │  ├─ ScoreCard.tsx
│  │  ├─ ScoreDelta.tsx
│  │  └─ TestHistory.tsx
│  └─ ui/
│     ├─ Button.tsx
│     ├─ Card.tsx
│     └─ Modal.tsx
│
├─ lib/
│  ├─ calibration/
│  │  ├─ screenCalibration.ts
│  │  ├─ faceDistance.ts
│  │  └─ geometry.ts
│  ├─ tests/
│  │  ├─ staircase.ts
│  │  ├─ acuity.ts
│  │  ├─ contrast.ts
│  │  ├─ colour.ts
│  │  └─ random.ts
│  ├─ scoring/
│  │  ├─ scoreAcuity.ts
│  │  ├─ scoreContrast.ts
│  │  ├─ scoreColour.ts
│  │  └─ overallScore.ts
│  ├─ storage/
│  │  ├─ schema.ts
│  │  ├─ storage.ts
│  │  └─ migrations.ts
│  └─ utils/
│     ├─ clamp.ts
│     └─ ids.ts
│
├─ hooks/
│  ├─ useArrowKeys.ts
│  ├─ useLocalResults.ts
│  ├─ useCamera.ts
│  └─ useFaceDistance.ts
│
├─ types/
│  ├─ calibration.ts
│  ├─ results.ts
│  └─ tests.ts
│
├─ public/
│  └─ models/
│
├─ tests/
│  ├─ staircase.test.ts
│  ├─ scoring.test.ts
│  ├─ calibration.test.ts
│  └─ storage.test.ts
│
├─ REQUIREMENTS.md
├─ DESIGN.md
└─ README.md
```

This is a recommendation, not a mandate. Keep the implementation simpler if unnecessary folders appear.

---

## 4. Application State

Avoid global state libraries initially.

Use:

- React component state for active test/session state.
- Context only if test-shell state becomes cumbersome.
- localStorage abstraction for persisted data.

Do not introduce Redux/Zustand unless there is a demonstrated need.

---

## 5. Core Types

### Eye Mode

```ts
export type EyeMode = "both" | "left" | "right";
```

### Direction

```ts
export type Direction = "up" | "right" | "down" | "left";
```

### Test Type

```ts
export type TestType = "distance-acuity" | "near-acuity" | "contrast" | "colour";
```

### Calibration

```ts
export interface ScreenCalibration {
  version: 1;
  pixelsPerMm: number;
  cardWidthPx: number;
  referenceWidthMm: 85.6;
  devicePixelRatio: number;
  viewportWidth: number;
  viewportHeight: number;
  calibratedAt: string;
}
```

### Distance Calibration

```ts
export interface DistanceCalibration {
  version: 1;
  mode: "camera" | "manual";
  referenceDistanceCm?: number;
  referenceFaceScale?: number;
  manualDistanceCm?: number;
  calibratedAt: string;
}
```

### Test Result

```ts
export interface TestResult {
  id: string;
  testType: TestType;
  eyeMode: EyeMode | null;
  score: number;
  scoreVersion: "v1";
  rawMetrics: Record<string, number | string | boolean>;
  calibrationSnapshot: {
    screen?: ScreenCalibration;
    distance?: DistanceCalibration;
  } | null;
  createdAt: string;
}
```

---

## 6. Physical Screen Calibration

### Problem

A browser can provide CSS pixel dimensions and device pixel ratio, but that does not reliably provide the monitor's physical millimeter dimensions.

Therefore VisionKit needs user calibration.

### Reference Object

Use an ISO ID-1 sized card:

- width: 85.60 mm
- height: 53.98 mm

Only width is required in the MVP.

### Flow

1. Render a rectangle.
2. Initial width: ~320 CSS px.
3. Let user change width with:
   - slider;
   - plus/minus buttons;
   - optional drag handle.
4. User holds card against screen.
5. User confirms when widths match.

Then:

```ts
pixelsPerMm = measuredCardWidthCssPx / 85.6;
```

Conversion:

```ts
function mmToCssPx(mm: number, pixelsPerMm: number): number {
  return mm * pixelsPerMm;
}
```

Store calibration.

### Validation

Reject obviously invalid values.

Example broad guardrails:

```ts
if (pixelsPerMm < 1 || pixelsPerMm > 20) {
  // ask user to recalibrate
}
```

Do not treat these guardrails as physical truth; they are sanity checks.

### Resize Behavior

A normal window resize should not automatically invalidate `pixelsPerMm`.

However:

- detect large `devicePixelRatio` changes;
- detect moving window to another display where possible;
- allow manual recalibration prominently.

If browser zoom is changed, CSS geometry can change. Show a small notice if calibration appears inconsistent.

---

## 7. Viewing Distance Estimation

### Important Constraint

A face-landmark model gives image-space landmarks and relative depth information. It should not be treated as an absolute centimeter ruler without calibration.

Therefore the MVP uses **calibrated face scale**, not raw model Z values, for approximate distance tracking.

### MediaPipe

Use MediaPipe Face Landmarker in browser video mode.

Requirements:

- run locally;
- one face only;
- do not save frames;
- do not upload frames.

### Face Scale Metric

Choose stable horizontal landmark pairs, e.g.:

- outer eye-corner distance;
- cheek/face-width landmarks.

Prefer a normalized metric:

```ts
faceScale = landmarkPixelDistance / videoFrameWidth;
```

Use multiple pairs and median them if helpful.

### Camera Calibration Flow

Preferred v1 flow:

1. User grants camera.
2. Ask user to sit at a known reference distance, e.g. 50 cm.
3. Explain they may measure roughly with an arm/ruler for initial setup.
4. Capture face scale over ~1 second.
5. Compute median reference face scale.
6. Save:
   - `referenceDistanceCm`
   - `referenceFaceScale`

During tests:

Under a pinhole-camera approximation, apparent face size is approximately inversely proportional to distance:

```ts
estimatedDistanceCm = referenceDistanceCm * (referenceFaceScale / currentFaceScale);
```

Smooth current estimates with a short rolling median or EMA.

This is an **approximation for positioning**, not a clinical measurement.

### Alternative MVP Simplification

If the camera-distance calibration creates too much friction:

- ask user to enter target distance manually;
- use MediaPipe only to warn when their relative face scale drifts more than a percentage from the initial test position.

This may be the better Phase 1 implementation.

### Status Bands

Example:

```ts
const ratio = currentDistance / targetDistance;

if (ratio < 0.9) status = "move-back";
else if (ratio > 1.1) status = "move-closer";
else status = "good";
```

Tune bands during testing.

### Multiple / Missing Faces

- 0 faces: pause test or show "Face not detected."
- > 1 face: show "Please make sure only one person is in view."
- unreliable landmark confidence: pause size-sensitive trial.

---

## 8. Visual Angle / Optotype Geometry

Keep geometry logic isolated.

For a target with physical height `h` at viewing distance `d`:

```ts
angularSizeRadians = 2 * atan(h / (2 * d));
```

Inverse:

```ts
h = 2 * d * tan(angularSizeRadians / 2);
```

Use consistent units, e.g. both millimeters:

```ts
distanceMm = distanceCm * 10;
```

Then convert physical height to CSS pixels using the calibrated `pixelsPerMm`.

### Why This Matters

The acuity engine should specify difficulty in angular-size terms or in a level table that maps to angular sizes.

Do not define difficulty only as arbitrary CSS pixels.

### Directional E Geometry

Implement the E with SVG or CSS shapes.

Recommended SVG viewBox:

```text
0 0 5 5
```

Create a canonical right-facing E using a five-unit grid, then rotate by:

- right: 0deg
- down: 90deg
- left: 180deg
- up: 270deg

Do not rely on a text glyph.

---

## 9. Generic Adaptive Staircase Engine

Both acuity and contrast need threshold-finding logic.

Create one reusable staircase engine.

### Interface

```ts
export interface StaircaseConfig {
  minLevel: number;
  maxLevel: number;
  startLevel: number;
  minTrials: number;
  maxTrials: number;
  targetReversals: number;
}

export interface StaircaseState {
  currentLevel: number;
  trialCount: number;
  reversals: number[];
  lastDirection: "harder" | "easier" | null;
  history: TrialRecord[];
  finished: boolean;
}
```

### Update

```ts
advanceStaircase(state, correct, config): StaircaseState
```

MVP algorithm:

- correct → harder by one level;
- incorrect → easier by one level;
- clamp level;
- reversal occurs when movement direction changes;
- finish after:
  - `minTrials`,
  - `targetReversals`,
  - or `maxTrials`.

Threshold:

```ts
mean(lastKReversalLevels);
```

Use configurable `K`.

### Future

The implementation should permit swapping to:

- 2-down/1-up;
- 3-down/1-up;
- Bayesian thresholding;

without changing UI components.

Do not implement those now.

---

## 10. Acuity Engine

### Config

```ts
export interface AcuityTestConfig {
  id: "distance-acuity" | "near-acuity";
  targetDistanceCm: number;
  levelAngularSizesArcMin: number[];
  staircase: StaircaseConfig;
}
```

The exact angular-size table should live in config and be easy to tune.

### Trial

```ts
interface AcuityTrial {
  id: string;
  level: number;
  direction: Direction;
  angularSizeArcMin: number;
  renderedSizePx: number;
  response?: Direction;
  correct?: boolean;
  responseTimeMs?: number;
}
```

### Randomization

Create:

```ts
getNextDirection(history, rng);
```

Rules:

- approximately balanced;
- avoid >2 identical orientations consecutively.

---

## 11. Contrast Engine

### Contrast Representation

Use a defined relative contrast parameter from 0–1.

For MVP UI generation, choose a neutral background luminance value and derive optotype luminance explicitly.

Avoid simple `opacity` if it introduces compositing ambiguity.

Example conceptual form:

```ts
background = 0.5;
foreground = background - delta;
```

Convert the resulting values to CSS colors.

Keep all math in one utility.

### Levels

```ts
const contrastLevels = [
  0.8,
  0.6,
  0.45,
  0.32,
  0.22,
  0.15,
  0.10,
  0.07,
  0.05,
  ...
];
```

These are VisionKit difficulty values, not claimed clinical contrast-sensitivity units unless later validated.

### Trial

Reuse:

- DirectionalE
- arrow keys
- staircase
- orientation randomization.

---

## 12. Colour Differentiation Engine

### MVP Color Space

Prefer generating colors in a perceptual color space if supported by the chosen implementation/library.

A simple MVP can use HSL, but difficulty spacing will not be perceptually uniform.

If adding a tiny dependency is acceptable, use a color library capable of OKLCH/LAB conversions.

Do not use AI.

### Round Generation

```ts
interface ColourRound {
  gridSize: number;
  baseColor: string;
  targetColor: string;
  targetIndex: number;
  difficulty: number;
}
```

Difficulty controls delta between base and target.

Example:

- easy: obvious lightness/hue delta;
- medium: smaller delta;
- hard: subtle delta.

Randomize:

- base hue;
- target index;
- direction of color delta.

Avoid invalid/out-of-gamut colors by clamping/converting safely.

### Scoring

Use:

- highest stable difficulty;
- overall accuracy;
- optional response time tie-breaker.

Do not over-weight reaction speed; the product is testing discrimination first.

---

## 13. Keyboard Input

Create `useArrowKeys`.

Responsibilities:

- subscribe only during active directional tests;
- map browser keys to `Direction`;
- prevent page scrolling;
- ignore repeat keydown if appropriate;
- ignore input after trial is locked;
- cleanup listeners on unmount.

Example:

```ts
const KEY_TO_DIRECTION = {
  ArrowUp: "up",
  ArrowRight: "right",
  ArrowDown: "down",
  ArrowLeft: "left",
} as const;
```

---

## 14. Trial Timing / Feedback

For directional tests:

1. render stimulus;
2. start response clock after paint;
3. accept one answer;
4. briefly show correct/incorrect feedback;
5. wait ~150–300 ms;
6. render next trial.

Avoid long animations.

User should be able to build a rhythm.

Do not make reaction speed central to score.

---

## 15. Local Storage Design

Storage key:

```text
visionkit:v1
```

Schema:

```ts
interface VisionKitStorageV1 {
  version: 1;
  calibration: {
    screen: ScreenCalibration | null;
    distance: DistanceCalibration | null;
  };
  preferences: {
    disclaimerAcknowledged: boolean;
  };
  results: TestResult[];
}
```

Create one storage service:

```ts
loadVisionKitData();
saveVisionKitData(data);
appendResult(result);
clearVisionKitData();
```

Rules:

- wrap JSON parsing in try/catch;
- validate minimum schema;
- recover to defaults if corrupted;
- never call localStorage during SSR;
- keep browser access behind client code.

---

## 16. Score Design

Scoring should be intentionally simple in v1.

### Principles

- 0 = minimum test range
- 100 = maximum test range
- interpolate between level thresholds
- score must be monotonic
- clamp result

Example utility:

```ts
function scoreFromLevel(thresholdLevel: number, minLevel: number, maxLevel: number): number {
  const normalized = (thresholdLevel - minLevel) / (maxLevel - minLevel);

  return Math.round(clamp(normalized * 100, 0, 100));
}
```

If level direction means "lower is better", invert appropriately.

### Versioning

```ts
export const SCORE_VERSION = "v1";
```

Never retroactively mutate old stored scores.

---

## 17. Overall Score

Only compute once all four scored tests have a recent completed result.

Use:

```ts
overall = distance * 0.3 + near * 0.25 + contrast * 0.25 + colour * 0.2;
```

Round integer.

Label:

> Visual Performance Score

Not:

> Eye Health Score

The overall score is a fun VisionKit metric.

---

## 18. UI State Machines

Each test should have clear phases.

Directional test:

```text
intro
→ calibration-check
→ eye-selection
→ eye-instructions
→ position-check
→ practice
→ testing
→ result
```

Colour:

```text
intro
→ practice
→ testing
→ result
```

Use an enum/union rather than many unrelated booleans.

Example:

```ts
type AcuityPhase =
  "intro" | "calibration" | "eye-mode" | "position" | "practice" | "testing" | "result";
```

---

## 19. Camera Hook

`useCamera`:

- request `getUserMedia({ video: true, audio: false })`;
- expose permission/status;
- expose video stream;
- stop tracks on unmount;
- handle denied/error states.

Never request camera on page load.

Require an explicit user action:

> Enable camera positioning

This provides context before the browser permission prompt.

---

## 20. Face Landmarker Integration

Create a dedicated client-only module.

Pseudo-interface:

```ts
interface FaceTracker {
  start(video: HTMLVideoElement): Promise<void>;
  getLatestMeasurement(): FaceMeasurement | null;
  stop(): void;
}

interface FaceMeasurement {
  faceScale: number;
  confidence: number;
  faceCount: number;
  timestamp: number;
}
```

Do not let React test components depend directly on MediaPipe-specific result objects.

This abstraction makes it easier to replace the CV implementation later.

### Performance

- do not run inference unnecessarily fast;
- ~10–15 measurements/sec is likely sufficient for positioning feedback;
- test on average laptops;
- pause/stop tracking when test is not active.

---

## 21. Test Validity Guards

During size-dependent active trials:

Pause or prevent advancing if:

- no valid screen calibration;
- face distance is outside tolerance;
- face temporarily disappears for a configurable duration;
- window becomes hidden.

Do not count an answer given while stimulus validity is known to be compromised.

If camera mode fails during a test:

- pause;
- offer retry;
- offer manual fallback;
- resume without discarding previous valid trials.

---

## 22. Styling

Use Tailwind.

Suggested design tokens in CSS variables:

```css
:root {
  --background: ...;
  --foreground: ...;
  --surface: ...;
  --muted: ...;
  --success: ...;
  --danger: ...;
  --accent: ...;
}
```

Do not scatter arbitrary hex colors throughout components.

The contrast test is an exception: stimulus colors are generated algorithmically.

### Design Direction

Human Benchmark-like:

- large central interaction;
- bold solid sections;
- immediate feedback;
- score is the hero;
- minimal card chrome;
- fast restart.

But create original styling/branding.

---

## 23. Testing Strategy

### Unit Tests

Required:

#### Staircase

- moves harder after correct;
- easier after incorrect;
- clamps boundaries;
- reversal detection;
- stop criteria;
- threshold calculation.

#### Geometry

- mm ↔ CSS px conversion;
- angular-size forward/inverse;
- finite values only.

#### Scoring

- min = 0;
- max = 100;
- monotonic behavior;
- clamping.

#### Storage

- empty storage;
- valid load;
- corrupted JSON;
- append result;
- history cap;
- clear.

#### Randomization

- valid directions only;
- no prohibited streak behavior.

### Browser / Integration Tests

If time permits:

- keyboard directional test;
- localStorage persistence after reload;
- camera-denied fallback;
- result navigation.

Do not attempt to automate actual webcam CV accuracy in the MVP test suite.

---

## 24. Phased Implementation Plan

Codex should implement in this order.

### Phase 1 — App Skeleton

Build:

- Next.js project;
- Tailwind;
- layout;
- home page;
- test cards;
- disclaimer;
- placeholder routes;
- reusable buttons/cards;
- basic localStorage service.

**Exit criterion:** polished navigable shell.

### Phase 2 — Directional E + Generic Test Engine

Build:

- SVG DirectionalE;
- keyboard hook;
- random direction generation;
- generic staircase;
- practice/trial UI;
- unit tests.

Use arbitrary visual sizes temporarily.

**Exit criterion:** playable directional-E benchmark works.

### Phase 3 — Screen Calibration + Geometry

Build:

- ID-1 card calibration;
- pixels/mm storage;
- angular-size utilities;
- calibrated E rendering.

**Exit criterion:** rendered optotype can be specified by physical/angular size.

### Phase 4 — Distance Acuity

Build:

- eye-mode selection;
- cover-eye instructions;
- distance-test config;
- staircase threshold;
- 0–100 v1 score;
- result persistence.

Manual viewing distance is acceptable at the beginning of this phase.

**Exit criterion:** complete Distance Acuity test.

### Phase 5 — Webcam Position Tracking

Build:

- camera permission;
- MediaPipe Face Landmarker;
- face-scale abstraction;
- reference calibration;
- live move closer/back/good feedback;
- manual fallback.

**Exit criterion:** user position can be monitored without server upload.

### Phase 6 — Near Acuity

Reuse acuity engine with new configuration.

**Exit criterion:** separate Near Acuity score.

### Phase 7 — Contrast

Reuse directional E, input, staircase.

**Exit criterion:** adaptive contrast score.

### Phase 8 — Colour Differentiation

Build tile game and scoring.

**Exit criterion:** playable adaptive colour score.

### Phase 9 — Dashboard / History

Build:

- recent results;
- best scores;
- previous-score delta;
- overall score when all tests completed;
- clear data.

### Phase 10 — Polish

- responsive layout;
- reduced-motion;
- loading/error states;
- desktop compatibility;
- camera error handling;
- README;
- Vercel deployment readiness.

Do not add future features until these phases are stable.

---

## 25. Dependencies

Prefer minimal dependencies.

Expected:

```text
next
react
react-dom
typescript
tailwindcss
@mediapipe/tasks-vision
```

Testing dependencies as appropriate.

Optional:

- tiny color utility library for LAB/OKLCH math.

Avoid:

- full UI suites;
- Redux;
- database SDKs;
- authentication SDKs;
- chart libraries until necessary;
- LLM SDKs;
- server CV APIs.

---

## 26. Browser Compatibility Notes

Camera requires a secure context in deployed environments. Localhost is generally suitable during development.

Do capability detection:

```ts
const cameraSupported = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
```

MediaPipe must only initialize client-side.

Use dynamic import if needed to avoid server-rendering issues.

---

## 27. Privacy-by-Architecture

The simplest privacy story is:

```text
Camera
  ↓
Browser getUserMedia
  ↓
Local MediaPipe inference
  ↓
faceScale / position estimate
  ↓
discard frame
```

Persist only calibration numbers, not:

- frames;
- face images;
- facial-landmark arrays;
- video;
- biometric templates.

---

## 28. Known Limitations

The MVP should document these rather than hiding them:

- Physical screen calibration depends on the user matching the reference card correctly.
- Browser zoom/display configuration can affect calibration.
- Webcam distance estimation is approximate.
- Lighting and camera angle affect face tracking.
- Results can vary with fatigue, attention, room lighting, monitor characteristics, glasses/contacts, and viewing position.
- Colour differentiation depends on the user's display and display settings.
- VisionKit scores are internal benchmark scores, not medical metrics.

---

## 29. README Expectations

Create a project README containing:

- what VisionKit is;
- screenshot/GIF placeholder;
- disclaimer;
- local setup;
- architecture summary;
- privacy statement;
- supported tests;
- limitations;
- roadmap;
- deployment notes.

Suggested setup:

```bash
npm install
npm run dev
```

---

## 30. Initial Codex Instruction

After these files are added to the repo, give Codex:

> Read `REQUIREMENTS.md` and `DESIGN.md` completely. Implement VisionKit incrementally. Start with Phase 1 and Phase 2 only. Keep measurement/test logic separate from React UI, add unit tests for the staircase engine, and do not add authentication, a database, AI APIs, mobile controls, or other out-of-scope features. When Phase 1 and Phase 2 are complete, run tests/build, fix issues, and summarize what was implemented before moving to later phases.

This prevents Codex from trying to build the entire project in one uncontrolled pass.

---

## 31. Source / Technical Notes

These are implementation references, not claims of medical validation:

- Google MediaPipe Face Landmarker for web:
  https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker
- MDN `window.devicePixelRatio`:
  https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
- ISO/IEC 7810 reference card dimensions:
  https://www.iso.org/standard/31432.html

Use official/current documentation when APIs differ from this design.
