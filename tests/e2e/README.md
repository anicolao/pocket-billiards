# E2E Test Documentation: Table Rendering Verification

## Test Overview

This test suite validates the rendering correctness of the pool table in both landscape and portrait orientations. These are **Rendering Verification Tests** as defined in E2E_TESTING.md, which validate that the renderer correctly displays game states by capturing visual output and comparing against baseline images.

**Test Type**: Rendering Verification  
**Test Scope**: Initial table setup with cue ball at head spot (break position)  
**Validation Method**: Zero-tolerance pixel-perfect screenshot comparison

---

## Test Suite: Initial Table Setup (Landscape Orientation)

### Screenshot 0000: Initial Table with Cue Ball (Landscape)

**File**: `table.spec.ts-snapshots/rendering-screenshots-0000-initial-table-with-cue-ball-chromium-linux.png`

**Test**: `renders pool table with cue ball at head spot`

**Viewport**: 1280×720 (landscape orientation)

**What to Verify**:

1. **Table Positioning**:
   - Pool table is centered horizontally and vertically in the viewport
   - Table maintains 2:1 aspect ratio (width is twice the height)
   - Dark background (#1a1a1a) fills the entire viewport around the table
   - Appropriate padding (~40-50px) on all sides between table and viewport edges

2. **Table Structure**:
   - **Outer rails** (dark wood, #4a3428) form a border around the playing surface
   - **Playing surface** (green felt, #0b6623) occupies the interior
   - Rails are approximately 40 table units thick, visible on all four sides

3. **Pockets**:
   - **Six black pockets** positioned correctly:
     - Four corner pockets (top-left, top-right, bottom-left, bottom-right)
     - Two side pockets on the long edges (middle-top, middle-bottom)
   - Pockets are circular and filled with black (#000000)
   - Approximately 25% of each pocket area overlaps the playing surface

4. **Cue Ball**:
   - **White cue ball** positioned at the head spot (break position)
   - Located at table coordinates (250, 250) - one quarter from the left edge, centered vertically
   - Ball is rendered as a small white circle with a subtle dark border
   - Ball appears in the left-center area of the table when viewed in landscape

5. **Coordinate System**:
   - Table uses fixed 1000×500 table coordinate system
   - Origin (0,0) is at the top-left of the playing surface (not the rails)
   - Rails extend from negative coordinates to beyond table width/height

**Expected State**:
- Orientation: Landscape (no rotation)
- Table dimensions: 1000×500 table units (playing surface)
- Total renderable area: 1080×580 (including 40-unit rails on all sides)
- Cue ball position: (250, 250) in table coordinates
- Cue ball active: true
- Cue ball velocity: (0, 0)

---

## Test Suite: Portrait Mode Setup

### Screenshot 0001: Portrait Mode Table with Cue Ball

**File**: `table.spec.ts-snapshots/rendering-screenshots-0001-portrait-mode-table-with-cue-ball-chromium-linux.png`

**Test**: `renders pool table in portrait orientation with 90° rotation`

**Viewport**: 720×1280 (portrait orientation)

**What to Verify**:

1. **Table Orientation**:
   - Table is **rotated 90° clockwise** to maximize vertical screen space
   - Table's long axis (1000 units) now aligns with screen height
   - Table's short axis (500 units) now aligns with screen width
   - Table is centered horizontally and vertically in the portrait viewport

2. **Visual Appearance After Rotation**:
   - What was the **left edge** in landscape is now the **top edge** in portrait
   - What was the **right edge** in landscape is now the **bottom edge** in portrait
   - What was the **top edge** in landscape is now the **right edge** in portrait
   - What was the **bottom edge** in landscape is now the **left edge** in portrait

3. **Table Structure** (same as landscape):
   - Outer rails (dark wood, #4a3428) visible on all four sides
   - Playing surface (green felt, #0b6623) in the interior
   - Rails approximately 40 table units thick

4. **Pockets After Rotation**:
   - **Six black pockets** in rotated positions:
     - Original top-left corner → now top-right
     - Original top-right corner → now bottom-right
     - Original bottom-left corner → now top-left
     - Original bottom-right corner → now bottom-left
     - Original middle-top side pocket → now right-middle
     - Original middle-bottom side pocket → now left-middle
   - Pockets maintain circular shape and black fill

5. **Cue Ball After Rotation**:
   - **White cue ball** maintains its table coordinate position (250, 250)
   - After 90° clockwise rotation, appears in the **lower portion** of the screen
   - This corresponds to what was the left-center area in landscape orientation
   - Ball size and rendering remain consistent with landscape view

6. **Transform Verification**:
   - Rotation: -90° (clockwise, using canvas rotation convention)
   - Scale factor: Calculated to maximize screen usage while maintaining aspect ratio
   - Translation: Centers the rotated table in the viewport
   - Padding: ~40-50 pixels on all sides

**Expected State**:
- Orientation: Portrait (90° clockwise rotation applied)
- Table dimensions: 1000×500 table units (playing surface, unchanged in table coordinates)
- Total renderable area after rotation: 580 screen width × 1080 screen height
- Cue ball position: (250, 250) in table coordinates (unchanged)
- Cue ball screen position: Lower portion of screen after rotation
- Cue ball active: true
- Cue ball velocity: (0, 0)

**Rotation Mathematics**:
- Viewport: 720×1280 (width < height, triggers portrait mode)
- Table total dimensions: 1080×580 (including rails)
- After rotation: 580×1080 fits in portrait viewport
- Scale: ~1.70 (maximizes usage while preserving aspect ratio)
- The 90° clockwise rotation is implemented as -90° in canvas rotation (negative = clockwise)

---

## Additional Test Validations

### Canvas Viewport Filling (Landscape)

**Test**: `table canvas fills viewport`

**Validation**:
- Main canvas dimensions exactly match viewport size
- Canvas width = viewport width (1280px)
- Canvas height = viewport height (720px)
- Canvas positioned at (0, 0) with absolute positioning

### Ball Canvas Positioning (Landscape)

**Test**: `ball canvas is properly positioned`

**Validation**:
- Multiple canvas elements exist (table canvas + ball canvases)
- At least one ball canvas is visible (for the cue ball)
- Ball canvas has `display: block` and `position: absolute`
- Ball canvas is correctly positioned relative to the table

### Ball Canvas Positioning (Portrait)

**Test**: `ball canvas is properly positioned in portrait mode`

**Validation**:
- Ball canvases remain properly positioned after rotation
- Ball canvas position is within viewport bounds (0 ≤ x ≤ 720, 0 ≤ y ≤ 1280)
- Ball canvas maintains `display: block` and `position: absolute`
- Ball rendering adapts correctly to portrait orientation

### Orientation Switching

**Test**: `table orientation switches correctly on viewport change`

**Validation**:
- Starting in landscape (1280×720), table renders without rotation
- After switching to portrait (720×1280), table re-renders with rotation
- Canvas dimensions update to match new viewport
- Ball canvases remain visible and properly positioned after switch
- No rendering artifacts or layout issues during transition

---

## Design Compliance

These tests validate compliance with **TABLE_TRANSFORM.md** specifications:

✅ **Fixed coordinate system**: Table uses 1000×500 table coordinates  
✅ **Origin placement**: (0,0) at playing surface top-left, rails extend to negative coords  
✅ **Orientation detection**: Automatic landscape (width ≥ height) vs portrait (width < height)  
✅ **Portrait rotation**: 90° clockwise rotation when width < height  
✅ **Aspect ratio preservation**: 2:1 ratio maintained in both orientations  
✅ **Centering**: Table centered with appropriate padding in all orientations  
✅ **DOMMatrix transformations**: Accurate coordinate transformations for rendering  
✅ **Zero-tolerance validation**: Pixel-perfect screenshot comparison  

---

## Reviewing These Tests

When reviewing these E2E tests, verify:

1. **Visual Correctness**: Each screenshot matches the expected appearance described above
2. **Positioning Accuracy**: Table and balls are centered and properly positioned
3. **Color Accuracy**: Rails, felt, pockets, and balls use correct colors
4. **Rotation Correctness**: Portrait mode shows proper 90° clockwise rotation
5. **Consistency**: Both orientations show the same game state (just rotated)
6. **No Rendering Artifacts**: Clean edges, no pixelation or anti-aliasing issues
7. **Baseline Stability**: Screenshots remain pixel-identical across test runs (zero-tolerance)

Any deviation from these expectations indicates a rendering regression or transform calculation error.
