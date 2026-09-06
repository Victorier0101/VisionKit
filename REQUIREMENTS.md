# VisionKit — Product Requirements Document

**Status:** MVP v1  
**Product:** VisionKit  
**Platform:** Desktop web first  
**Primary target:** Laptop users  
**Deployment target:** Vercel  
**Business model:** Free personal project  
**AI/API dependency:** None required for MVP

---

## 1. Product Summary

VisionKit is a browser-based visual performance testing website inspired by the fast, simple, replayable experience of Human Benchmark.

The product is for anyone curious about their visual performance. It is **not** intended to diagnose eye disease, determine eyeglass prescriptions, or replace an eye examination.

The MVP provides five experiences:

1. Distance Visual Acuity
2. Near Visual Acuity
3. Contrast Sensitivity
4. Colour Differentiation
5. Screen/Viewing Distance Calibration

Users receive easy-to-understand 0–100 VisionKit scores and can compare results with their own previous attempts stored locally in the browser.

The core product principle is:

> Open the site, calibrate quickly, take a test, get a score, and want to try again.

---

## 2. Goals

### 2.1 Primary Goals

- Make visual-performance testing fun and approachable.
- Require no account.
- Require no paid API.
- Keep all test logic deterministic and browser-based.
- Produce repeatable scores that users can compare with their own past scores.
- Support desktop/laptop browsers well before adding mobile-specific interaction.
- Make the experience polished enough to share as a personal project and deploy publicly.

### 2.2 Non-Goals for MVP

VisionKit v1 will **not**:

- Diagnose medical conditions.
- Estimate eyeglass/contact-lens prescriptions.
- Tell users they have healthy or unhealthy eyes.
- Claim clinical accuracy.
- Give medical advice.
- Use AI chat or LLM APIs.
- Require authentication.
- Store user data in a remote database.
- Provide population percentiles.
- Support voice controls.
- Support hand-gesture controls.
- Support mobile as a first-class testing device.
- Include reaction-time, peripheral-vision, blink-rate, posture, eye-tracking, dominant-eye, blind-spot, or astigmatism tests.
- Require payments.

---

## 3. Target User

Primary target:

- Anyone curious about their vision.
- Primarily laptop/desktop users.
- Comfortable following simple on-screen instructions.
- May or may not wear glasses/contact lenses.

The tone should be:

- Mostly fun and benchmark-like.
- Clean and trustworthy.
- Slightly serious when explaining calibration and limitations.
- Never clinical or alarming.

---

## 4. Safety Positioning

Every test result must be framed as a **VisionKit browser-test result**, not a medical result.

A concise disclaimer should be accessible from the home page and visible before the first test:

> VisionKit is an informal visual-performance tool made for curiosity and fun. Results come from browser-based tests and are not a medical exam, diagnosis, or prescription. If you have concerns about your vision, consult a qualified eye-care professional.

Do not use wording such as:

- "Your eyes are healthy."
- "You have poor vision."
- "You have color blindness."
- "You have 20/20 vision" unless explicitly presented as an experimental/reference conversion with appropriate qualification.
- "You need glasses."
- "Your prescription is..."

Preferred wording:

- "VisionKit score"
- "Your result"
- "Your performance on this test"
- "Your result was lower/higher than your previous attempt"
- "This browser test is not a medical measurement"

---

## 5. High-Level User Flow

### First Visit

1. User opens VisionKit.
2. User sees hero section and five test cards.
3. User starts any size-dependent test.
4. If physical-screen calibration is missing, VisionKit asks the user to calibrate.
5. If viewing-distance estimation is required:
   - ask for webcam permission;
   - guide user through distance calibration/positioning;
   - if unavailable, allow manual-distance fallback.
6. User chooses eye mode:
   - Both eyes
   - Left eye
   - Right eye
7. For single-eye tests, VisionKit instructs the user to cover or close the other eye.
8. User completes the test.
9. VisionKit displays:
   - test score (0–100),
   - eye mode,
   - key raw test metric,
   - previous result if available,
   - retry button,
   - back-to-dashboard button.
10. Result is stored locally.

### Returning Visit

1. Load calibration settings from localStorage.
2. Load previous test results.
3. Show recent scores and personal bests.
4. Allow re-calibration at any time.

---

## 6. Home Page Requirements

The home page should contain:

### Hero

- VisionKit logo/name.
- Short statement such as:
  - "Test your visual performance."
- Supporting text:
  - "Five quick browser-based vision challenges. No account required."
- Primary CTA:
  - "Start Testing"

### Test Cards

Each card should show:

- Test name.
- One-sentence explanation.
- Approximate duration label, e.g. "1–2 min".
- Previous score if available.
- "Start" button.

Tests:

1. Distance Acuity
2. Near Acuity
3. Contrast
4. Colour
5. Calibration

### Recent Results

If local history exists:

- Most recent overall summary.
- Individual recent test scores.
- Simple trend indicator:
  - +3
  - -2
  - no change

Do not show "overall eye health."

---

## 7. Calibration Requirements

Calibration is essential for tests whose stimulus size depends on physical viewing geometry.

### 7.1 Physical Screen Calibration

Do not assume the browser knows physical screen dimensions.

Preferred MVP calibration:

1. Display a resizable rectangle representing the width of a standard ID-1 payment/ID card.
2. Ask the user to hold a standard credit/debit-size card against the screen.
3. User drags a slider or resize handle until the on-screen rectangle matches the physical card width.
4. Store:
   - calibrated CSS pixels per millimeter,
   - viewport dimensions,
   - devicePixelRatio for diagnostics,
   - timestamp.

Reference physical card width:

- 85.60 mm

The user must be able to:

- redo calibration;
- skip calibration with a warning that size-dependent results will be less meaningful.

### 7.2 Viewing Distance

Preferred experience:

1. Ask for webcam permission.
2. Detect one face.
3. Guide the user to a known reference position during initial webcam calibration.
4. Establish a face-scale baseline from landmarks.
5. During the test, estimate changes in viewing distance from relative face size.
6. Display a distance/status indicator such as:
   - "Move back"
   - "Move closer"
   - "Good position"

The system should not claim centimeter-level clinical accuracy.

### 7.3 Distance Fallback

If webcam is:

- denied,
- unavailable,
- unsupported,
- unable to detect a face,

allow the user to enter a manual viewing distance.

Persist manual distance locally.

### 7.4 Recalibration Rules

Prompt for recalibration when:

- no calibration exists;
- viewport/display conditions change substantially;
- user explicitly chooses "Recalibrate";
- the saved calibration is older than a configurable threshold (suggestion: 30 days);
- browser zoom or display changes make the calibration obviously inconsistent.

Do not block the entire site if calibration is unavailable. Non-size-dependent tests should remain usable.

---

## 8. Eye Modes

Tests that support eye-specific measurement must offer:

- Both eyes
- Left eye
- Right eye

For left-eye testing:

> Cover or gently close your right eye. Do not press on the eye.

For right-eye testing:

> Cover or gently close your left eye. Do not press on the eye.

For both eyes:

> Keep both eyes open and look naturally at the screen.

MVP does not use the webcam to verify which eye is covered.

Store results separately by eye mode.

---

## 9. Test 1 — Distance Visual Acuity

### 9.1 Purpose

Measure how accurately the user can identify progressively smaller directional E optotypes at a controlled viewing distance.

### 9.2 Stimulus

Use a block-style uppercase E with four orientations:

- Up
- Right
- Down
- Left

The E must be rendered as vector/CSS/SVG geometry, not a font glyph whose proportions vary by font.

### 9.3 Input

Desktop keyboard only for MVP:

- ArrowUp → Up
- ArrowRight → Right
- ArrowDown → Down
- ArrowLeft → Left

Prevent browser scrolling while the active test owns arrow-key input.

### 9.4 Procedure

1. Confirm calibration.
2. Select eye mode.
3. Confirm viewing distance.
4. Show large E.
5. Randomly choose orientation.
6. User answers with arrow key.
7. Reduce size as performance succeeds.
8. Use an adaptive staircase rather than simply shrinking after every correct answer.
9. Stop when threshold criteria are met.
10. Calculate result and score.

### 9.5 Adaptive Rule — MVP Recommendation

Use difficulty levels from 0 to N.

Suggested rule:

- Start at an easy level.
- Correct answer → move 1 level harder.
- Incorrect answer → move 1 level easier.
- Track reversals.
- Finish after:
  - a minimum number of trials (e.g. 12), and
  - enough staircase reversals (e.g. 6),
  - with a hard maximum trial count (e.g. 30).

Threshold = average difficulty of the final several reversal points.

Exact constants should live in configuration, not be hardcoded inside UI components.

### 9.6 Scoring

Return:

- VisionKit score: 0–100.
- Threshold difficulty/raw geometry metric.
- Eye mode.
- Number of trials.
- Accuracy percentage.

The 0–100 score is a **product score**, not a clinical medical score.

Score mapping should:

- cap at 0 and 100;
- be monotonic with performance;
- be defined in one scoring utility;
- be easy to tune later;
- keep raw test data so future scoring changes do not destroy history.

---

## 10. Test 2 — Near Visual Acuity

### 10.1 Purpose

Provide a near-distance version of the directional-E task designed around normal laptop viewing distance.

### 10.2 Stimulus and Input

Same directional E and arrow-key controls as Distance Acuity.

### 10.3 Procedure

- Confirm screen calibration.
- Confirm/estimate current face-to-screen distance.
- Instruct user to remain at the calibrated near distance.
- Run an adaptive size staircase.
- Record left/right/both results independently.

### 10.4 Difference From Distance Test

Distance and near tests must be separate configurations.

They may differ by:

- target viewing-distance range;
- starting optotype size;
- difficulty-level table;
- instructions;
- score mapping.

Do not duplicate the entire test implementation. Reuse a generic acuity engine with configuration.

---

## 11. Test 3 — Contrast Sensitivity

### 11.1 Purpose

Measure the user's ability to correctly identify the direction of an E as the contrast between the E and background decreases.

### 11.2 Stimulus

- Fixed optotype size selected to be comfortably visible after calibration.
- E orientation: up/right/down/left.
- Background: neutral.
- E contrast decreases with difficulty.
- Avoid pure browser opacity tricks that produce inconsistent blending where possible; calculate explicit foreground/background colors.

### 11.3 Input

Arrow keys.

### 11.4 Procedure

1. Start with high contrast.
2. Randomize E orientation.
3. Reduce contrast with correct answers.
4. Increase contrast after mistakes.
5. Use staircase/reversal threshold logic similar to acuity.
6. Avoid presenting the same orientation too many times consecutively.
7. Finish when threshold criteria are met.

### 11.5 Result

Return:

- Contrast VisionKit score: 0–100.
- Raw contrast threshold used by VisionKit.
- Accuracy.
- Eye mode if eye-specific mode is enabled.

MVP may support both-eye mode first if implementation simplicity requires it, but architecture should permit left/right later.

---

## 12. Test 4 — Colour Differentiation

### 12.1 Purpose

Measure how accurately the user distinguishes a subtly different color from surrounding colors.

This is a game-like color-discrimination test, **not a color-blindness diagnosis**.

### 12.2 Interaction

Display a grid of tiles.

Example:

- 3×3 grid at easy levels.
- One tile differs in hue/lightness/saturation.
- User clicks the different tile.
- Difficulty increases by reducing color difference and optionally increasing grid size.

Keyboard arrows are not required for this test.

### 12.3 Procedure

1. Show easy practice round.
2. Begin scored rounds.
3. Correct → reduce color difference.
4. Incorrect → increase difference or preserve difficulty.
5. Use deterministic difficulty levels.
6. Randomize target tile position.
7. Prevent target from appearing in the same position excessively.
8. End after a fixed number of rounds or adaptive threshold.

### 12.4 Result

Return:

- Colour VisionKit score: 0–100.
- Accuracy.
- Best/threshold color-difference level.
- Number of rounds.

Do not say:

- "You are color blind."
- "You have normal color vision."

Preferred:

> "You scored 82/100 on VisionKit's colour differentiation test."

---

## 13. Score System

### 13.1 Individual Scores

Every test produces a score from 0–100.

The score must be:

- deterministic;
- derived from test performance;
- independent of AI;
- bounded;
- versioned.

Each stored result must include:

```ts
scoreVersion: string;
```

so future score tuning can coexist with old results.

### 13.2 Overall Score

MVP may show an overall **Visual Performance Score** only when enough tests are completed.

Recommended initial formula:

- Distance Acuity: 30%
- Near Acuity: 25%
- Contrast: 25%
- Colour Differentiation: 20%

If a test is missing, either:

A. do not show overall score until all required tests are complete; or  
B. normalize weights across completed tests and clearly label it "Partial score."

Preferred MVP: **A** for simplicity and clarity.

Do not label the overall number "eye health."

### 13.3 Eye-Specific Summary

For tests completed in all three modes, show:

- Left eye
- Right eye
- Both eyes

Do not mathematically infer one eye's score from another.

---

## 14. Local Storage

No account or database is required.

Persist:

### Calibration

- pixelsPerMm
- screenCalibrationTimestamp
- distanceCalibration data
- manualDistanceCm if used
- calibration version

### Preferences

- disclaimer acknowledged
- reduced motion preference if manually set
- sound setting if sounds are later added

### Results

Each result:

```ts
{
  id: string;
  testType: "distance-acuity" | "near-acuity" | "contrast" | "colour";
  eyeMode: "both" | "left" | "right" | null;
  score: number;
  scoreVersion: string;
  rawMetrics: Record<string, number | string | boolean>;
  calibrationSnapshot: object | null;
  createdAt: string;
}
```

Requirements:

- use a versioned storage schema;
- tolerate corrupted/missing localStorage;
- cap history to a reasonable number, e.g. 100 results per test;
- provide "Clear my local data" in Settings.

---

## 15. Results Dashboard

Show:

- Latest scores.
- Personal bests.
- Previous-attempt delta.
- Recent history.

For each test:

```text
Distance Acuity
Today: 88
Previous: 84
Personal best: 91
```

Do not imply that a lower score means medical deterioration.

Suggested copy:

> Scores can vary with lighting, fatigue, distance, calibration, display settings, and attention.

For MVP, simple sparklines or minimal charts are optional. Do not add a charting dependency unless needed.

---

## 16. UX / Visual Design Requirements

### Style

Human Benchmark inspired, but not a clone.

Desired characteristics:

- Full-screen test states.
- Large typography.
- Bold visual feedback.
- Minimal distractions during tests.
- Fast transitions.
- Strong focus state.
- Clear progress.
- Mostly playful, with trustworthy calibration screens.

### Suggested Layout

Home/dashboard:

- top nav;
- hero;
- test card grid;
- history summary;
- footer disclaimer.

Active test:

- no normal site chrome where unnecessary;
- centered stimulus;
- small progress/status;
- keyboard instruction;
- exit button.

Result:

- large score;
- comparison to previous;
- raw metric summary;
- retry;
- next test.

### Accessibility

- Do not depend only on color to communicate success/failure.
- Maintain appropriate UI contrast outside the contrast-test stimulus.
- Keyboard navigation for general UI.
- Respect `prefers-reduced-motion`.
- Visible focus indicators.
- Semantic buttons/headings.
- Provide text explanation of webcam permission before invoking browser permission.

---

## 17. Error / Edge Cases

Handle:

- localStorage unavailable.
- camera permission denied.
- camera unavailable.
- multiple faces detected.
- no face detected.
- face moves too close/far.
- browser window resized mid-test.
- browser zoom changes.
- tab loses focus.
- user presses unsupported key.
- user exits mid-test.
- screen calibration missing.
- test data from an older schema version.
- refresh during active test.

Preferred behavior:

- fail gracefully;
- do not lose completed historical results;
- show actionable recovery;
- never fabricate a measurement when calibration is invalid.

---

## 18. Privacy Requirements

MVP principles:

- No login.
- No server database.
- No uploaded webcam video.
- Webcam processing should happen locally in the browser.
- Do not record or persist camera frames.
- Explain this before camera permission:
  > "Camera video is processed on your device to estimate your viewing position. VisionKit does not upload or save the video."
- localStorage contains only calibration and result data.
- Provide clear-data control.

If analytics are added later, they should not collect webcam frames or raw biometric landmark data.

---

## 19. Desktop Support

MVP priority:

1. Current Chrome desktop
2. Current Edge desktop
3. Current Safari desktop
4. Current Firefox desktop if MediaPipe/browser support permits

If a required feature is unsupported:

- explain limitation;
- provide manual-distance fallback;
- allow tests that remain valid.

Mobile/tablet:

- responsive landing page is desirable;
- testing experience may show "Desktop testing recommended";
- no requirement for full mobile test interaction in v1.

---

## 20. Acceptance Criteria

VisionKit MVP is complete when:

### Core

- [ ] Project runs locally with one command.
- [ ] Home page lists all five MVP experiences.
- [ ] No user account is required.
- [ ] No paid AI/API dependency exists.
- [ ] Results survive refresh/reopen through localStorage.

### Calibration

- [ ] User can calibrate physical screen scale using an ID-1 card.
- [ ] Calibration persists locally.
- [ ] User can grant webcam access.
- [ ] App can detect a face locally.
- [ ] App provides viewing-position guidance.
- [ ] Manual viewing-distance fallback exists.
- [ ] User can recalibrate.

### Distance Acuity

- [ ] Directional E supports four orientations.
- [ ] Arrow keys answer the direction.
- [ ] Difficulty adapts.
- [ ] Left/right/both eye modes exist.
- [ ] Test completes and produces score 0–100.
- [ ] Raw metrics are stored.

### Near Acuity

- [ ] Uses shared acuity engine.
- [ ] Uses its own near-test configuration.
- [ ] Requires valid calibration/distance state.
- [ ] Produces 0–100 score.

### Contrast

- [ ] Contrast changes adaptively.
- [ ] E orientation is randomized.
- [ ] Produces 0–100 score.

### Colour

- [ ] User identifies different tile.
- [ ] Difficulty increases/decreases deterministically.
- [ ] Produces 0–100 score.
- [ ] Does not present medical diagnosis.

### Results

- [ ] Result page shows score.
- [ ] Previous score comparison works.
- [ ] Dashboard shows saved history.
- [ ] Data can be cleared.

### Safety / Privacy

- [ ] Disclaimer is present.
- [ ] No diagnostic wording.
- [ ] Camera processing is local.
- [ ] Camera frames are not persisted or uploaded.

---

## 21. Future Ideas — Explicitly Out of Scope

Keep architecture extensible for:

- voice answering;
- hand-gesture direction answering;
- mobile touch controls;
- peripheral-awareness test;
- visual reaction time;
- astigmatism-pattern demonstration;
- dominant-eye test;
- blind-spot demonstration;
- blink tracking;
- eye tracking;
- posture/screen-use tools;
- accounts and cross-device sync;
- share cards;
- optional reports;
- installable PWA;
- additional languages.

Do not implement these during MVP unless requested.

---

## 22. Definition of Done

A first-time desktop user can:

1. open VisionKit;
2. understand what it is within several seconds;
3. calibrate the display;
4. enable webcam positioning or use fallback;
5. choose an eye mode;
6. complete each of the four scored tests;
7. receive understandable 0–100 results;
8. return later and see their previous scores;
9. understand that the results are for fun/informal performance tracking, not medical diagnosis.

That is VisionKit v1.
