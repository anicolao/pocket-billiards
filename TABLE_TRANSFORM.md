# Table Transform Design Document

## Purpose

This document specifies the coordinate transformation system for Pocket Billiards. The transform maps between the table's model coordinate system (1000×500 units) and the screen's pixel coordinate system while maximizing screen real estate usage.

The design enables separation of concerns: physics, game logic, and ball positions operate in the consistent table coordinate system, while only the UI/rendering layer handles coordinate transformations.

## Coordinate Systems

### Model Coordinate System (Table Space)

The model uses a fixed-size coordinate system representing the pool table's playing surface:

- **Origin**: Top-left corner of the playing surface (felt area)
- **Dimensions**: 1000 units wide × 500 units tall
- **Aspect Ratio**: 2:1 (standard pool table proportions)
- **Units**: Abstract units (not pixels or physical measurements)
- **Axis Convention**: 
  - X-axis increases from left to right
  - Y-axis increases from top to bottom

**Key Model Elements:**
- Playing surface: (0, 0) to (1000, 500)
- Rails: Extend beyond playing surface by `railWidth` units in all directions
- Pockets: Positioned at corners and midpoints of long edges
- Balls: Center positions expressed in table coordinates
- Physics calculations: All computed in table space

**Design Rationale:** The fixed 1000×500 coordinate system provides:
- Consistent physics calculations regardless of screen size
- Simple 2:1 aspect ratio matching standard pool tables
- Easy mental model (1000 units = table width, 500 = table height)
- Decoupling from display resolution and orientation

### Screen Coordinate System (Display Space)

The screen coordinate system represents the actual display pixels:

- **Origin**: Top-left corner of the viewport/canvas
- **Dimensions**: Variable, determined by display size (e.g., 1920×1080, 3840×2160)
- **Units**: CSS pixels
- **Axis Convention**: Standard web canvas (x right, y down)

**Characteristics:**
- Dynamic dimensions that change with window resize
- May have any aspect ratio (16:9, 16:10, 4:3, portrait orientations, etc.)
- Subject to browser viewport constraints
- May differ from physical pixel dimensions due to device pixel ratio

## Transformation Requirements

### Primary Goals

1. **Maximize Screen Usage**: The table should occupy as much screen space as possible while maintaining proper aspect ratio and providing comfortable padding
2. **Preserve Aspect Ratio**: The 2:1 table proportions must be maintained (no distortion)
3. **Support Rotation**: Handle both landscape and portrait orientations by rotating the table 90° when beneficial
4. **Center Alignment**: The table should be centered in available space
5. **Maintain Readability**: Ensure minimum padding prevents table elements from touching screen edges

### Transformation Components

The complete transformation from table space to screen space consists of:

1. **Rotation**: 0° or 90° clockwise, depending on screen orientation
2. **Uniform Scale**: Single scale factor applied to both axes
3. **Translation**: Offset to center the scaled/rotated table on screen

## Transform Specification

### Orientation Decision

**Landscape Screen (width ≥ height):**
- Table orientation: Horizontal (no rotation)
- Table's long axis (1000 units) aligns with screen width
- Rotation angle: 0°

**Portrait Screen (width < height):**
- Table orientation: Vertical (90° clockwise rotation)
- Table's long axis (1000 units) aligns with screen height after rotation
- Rotation angle: 90°

**Rationale**: Rotating the table in portrait mode maximizes the use of vertical screen space, as the table's 2:1 aspect ratio naturally fits better when rotated to align its long axis with the dominant screen dimension.

### Scale Calculation

The scale factor must fit the table (including rails) within the screen with appropriate padding:

```
totalTableWidth = tableWidth + (2 × railWidth)     // 1000 + 80 = 1080
totalTableHeight = tableHeight + (2 × railWidth)   // 500 + 80 = 580
```

**For Landscape Orientation (no rotation):**
```
scaleX = (screenWidth - 2 × padding) / totalTableWidth
scaleY = (screenHeight - 2 × padding) / totalTableHeight
scale = min(scaleX, scaleY)
```

**For Portrait Orientation (90° rotation):**
After rotation, the table's dimensions swap, so:
```
scaleX = (screenWidth - 2 × padding) / totalTableHeight
scaleY = (screenHeight - 2 × padding) / totalTableWidth
scale = min(scaleX, scaleY)
```

**Padding**: Recommended minimum 40 CSS pixels to prevent table edges from touching screen boundaries

**Properties:**
- Single uniform scale factor (preserves aspect ratio)
- Always ≤ 1.0 (table never scaled larger than actual size in model units)
- May be > 1.0 on very large displays (table can be magnified)

### Translation Calculation

After scaling (and rotation if applicable), the table is centered in the available screen space:

**For Landscape Orientation:**
```
translationX = (screenWidth - totalTableWidth × scale) / 2
translationY = (screenHeight - totalTableHeight × scale) / 2
```

**For Portrait Orientation:**
After rotation, dimensions swap:
```
translationX = (screenWidth - totalTableHeight × scale) / 2
translationY = (screenHeight - totalTableWidth × scale) / 2
```

### Complete Transformation Matrix

The transformation from table coordinates to screen coordinates is applied as:

**Landscape (no rotation):**
```
screenX = translationX + (tableX × scale)
screenY = translationY + (tableY × scale)
```

**Portrait (90° clockwise rotation):**

When rotating, the entire renderable table area (including rails) is rotated. The formulas below work with table coordinates where the origin (0,0) is at the playing surface top-left:

```
// For a point in table coordinates:
// 1. Apply 90° CW rotation
// 2. Scale
// 3. Translate to screen position

// Note: These formulas assume rails are handled separately in rendering
// or that coordinates are adjusted for rail offset as needed

// Simplified rotation (90° CW): (x, y) → (y, width - x)
// where width is the reference width being rotated
rotatedX = tableY + railWidth
rotatedY = totalTableWidth - (tableX + railWidth)

screenX = translationX + (rotatedX × scale)
screenY = translationY + (rotatedY × scale)
```

Alternatively, using canvas transformation matrix (see Rendering section for implementation details)

## Input Transformation (Screen to Model)

Touch and pointer events occur in screen coordinates and must be transformed to table coordinates for game logic.

### Inverse Transform Process

1. **Un-translate**: Subtract the centering offset
2. **Un-rotate**: Apply inverse rotation (0° or -90°)
3. **Un-scale**: Divide by scale factor

**Landscape (no rotation):**
```
tableX = (screenX - translationX) / scale
tableY = (screenY - translationY) / scale
```

**Portrait (90° CCW inverse rotation):**
```
// Remove translation
adjustedX = screenX - translationX
adjustedY = screenY - translationY

// Undo scale
scaledX = adjustedX / scale
scaledY = adjustedY / scale

// Undo rotation (90° CCW: reverse of CW)
// Forward was: rotatedX = tableY + railWidth, rotatedY = totalTableWidth - (tableX + railWidth)
// Inverse: tableY = rotatedX - railWidth, tableX = totalTableWidth - rotatedY - railWidth
tableY = scaledX - railWidth
tableX = totalTableWidth - scaledY - railWidth
```

### Bounds Checking

After transformation, validate that input coordinates fall within valid table bounds:
- **Playing surface**: 0 ≤ tableX ≤ 1000, 0 ≤ tableY ≤ 500
- **Including rails**: -railWidth ≤ tableX ≤ 1000 + railWidth, -railWidth ≤ tableY ≤ 500 + railWidth

Coordinates outside valid bounds should be clamped or rejected based on use case (e.g., ball placement vs. UI interaction).

## Rendering Transformation (Model to Screen)

All rendering occurs on an HTML5 canvas. The transformation is applied using the canvas 2D context transformation matrix.

### Canvas Context Setup

**Landscape:**
```typescript
ctx.save()
ctx.translate(translationX, translationY)
ctx.scale(scale, scale)
// Draw table elements in model coordinates
ctx.restore()
```

**Portrait:**
```typescript
ctx.save()
// Approach: Translate to final position, rotate, scale, then draw
// The table (including rails) will be properly positioned and rotated
const offsetX = translationX
const offsetY = translationY + totalTableWidth * scale
ctx.translate(offsetX, offsetY)
ctx.rotate(Math.PI / 2)  // 90° clockwise
ctx.scale(scale, scale)
// At this point, drawing at (0, 0) represents the top-left of the full table (including rails)
// For model coordinates, offset by railWidth when drawing:
// e.g., ctx.arc(railWidth + ballX, railWidth + ballY, radius, 0, Math.PI * 2)
ctx.restore()
```

**Note:** The exact translation and rotation order may vary based on implementation, but the key principle is that canvas transformations handle the conversion from table coordinates to rotated, scaled, and positioned screen coordinates.

### Drawing Model Elements

With the transformation applied, all drawing operations use table coordinates directly:

```typescript
// Example: Draw a ball at table position (250, 125)
ctx.beginPath()
ctx.arc(250, 125, ballRadius, 0, Math.PI * 2)
ctx.fill()
```

The canvas transformation automatically converts these to correct screen positions.

### Layer Considerations

Different rendering layers may require different transformation handling:

**Background Layer (Table Surface):**
- Applied once during static rendering
- Rarely updated (only on resize)
- Full transform applied

**Dynamic Objects Layer (Balls, Cue):**
- Updated frequently during gameplay
- Transform applied each frame
- May use individual canvas elements (per design) or single canvas

**UI Overlay Layer (Aim Lines, Power Meter):**
- May combine table and screen coordinates
- Some elements in table space (aim line from cue ball)
- Some elements in screen space (power meter in screen corner)
- Requires selective application of transform

## Design Principles

### Separation of Concerns

**Game Logic (Table Space):**
- Ball positions, velocities, and physics
- Collision detection and resolution
- Game rules and state
- Path prediction and trajectories
- Shot mechanics

**UI/Rendering (Screen Space):**
- Canvas rendering setup and management
- Coordinate transformation
- Touch/mouse event handling
- Visual effects and animations
- Screen-space UI elements (scores, buttons)

**Benefits:**
- Game logic is screen-independent
- Testing physics without rendering
- Consistent behavior across devices
- Easy to add new display modes

### Minimal State

The transformation parameters (scale, translation, rotation) are derived from:
- Screen dimensions (dynamic)
- Table dimensions (constant: 1000×500)
- Rail width (constant: typically 40)
- Padding (constant: typically 40)

No transformation state needs to be stored in game state—it's computed on demand from screen size.

### Performance Considerations

**Canvas Transformations:**
- Use native canvas context transformations (hardware accelerated)
- Avoid manual coordinate conversion for rendering
- Cache transformation state when possible

**Input Events:**
- Transform touch/click coordinates once per event
- Don't repeatedly transform during event processing

**Resize Handling:**
- Recalculate transform only on window resize events
- Debounce resize events to avoid excessive recalculation
- Redraw only after transform stabilizes

## Example Scenarios

### Scenario 1: Desktop Landscape Display (1920×1080)

**Given:**
- Screen: 1920×1080 pixels
- Table: 1000×500 + 80 rail = 1080×580 total
- Padding: 40 pixels

**Calculations:**
- Orientation: Landscape (width > height)
- Rotation: 0°
- scaleX = (1920 - 80) / 1080 = 1.70
- scaleY = (1080 - 80) / 580 = 1.72
- scale = min(1.70, 1.72) = 1.70
- Scaled table: 1836×986 pixels
- translationX = (1920 - 1836) / 2 = 42 pixels
- translationY = (1080 - 986) / 2 = 47 pixels

**Result:** Table is 1836 pixels wide, centered horizontally and vertically with comfortable margins.

### Scenario 2: Tablet Portrait Display (1080×1920)

**Given:**
- Screen: 1080×1920 pixels (portrait)
- Table: 1000×500 + 80 rail = 1080×580 total
- Padding: 40 pixels

**Calculations:**
- Orientation: Portrait (width < height)
- Rotation: 90° clockwise
- After rotation, table occupies: 580 width × 1080 height
- scaleX = (1080 - 80) / 580 = 1.72
- scaleY = (1920 - 80) / 1080 = 1.70
- scale = min(1.72, 1.70) = 1.70
- Scaled rotated table: 986×1836 pixels
- translationX = (1080 - 986) / 2 = 47 pixels
- translationY = (1920 - 1836) / 2 = 42 pixels

**Result:** Table is rotated 90°, now 986 pixels wide and 1836 pixels tall, maximizing vertical space.

### Scenario 3: Large Touchscreen (3840×2160, 4K)

**Given:**
- Screen: 3840×2160 pixels
- Table: 1000×500 + 80 rail = 1080×580 total
- Padding: 40 pixels

**Calculations:**
- Orientation: Landscape
- Rotation: 0°
- scaleX = (3840 - 80) / 1080 = 3.48
- scaleY = (2160 - 80) / 580 = 3.59
- scale = min(3.48, 3.59) = 3.48
- Scaled table: 3758×2018 pixels
- translationX = (3840 - 3758) / 2 = 41 pixels
- translationY = (2160 - 2018) / 2 = 71 pixels

**Result:** Table is magnified 3.48× to fill the large 4K display while maintaining aspect ratio and padding.

### Scenario 4: Square Display (1200×1200)

**Given:**
- Screen: 1200×1200 pixels (square)
- Table: 1000×500 + 80 rail = 1080×580 total
- Padding: 40 pixels

**Calculations:**
- Orientation: Landscape (width ≥ height, square treated as landscape)
- Rotation: 0°
- scaleX = (1200 - 80) / 1080 = 1.04
- scaleY = (1200 - 80) / 580 = 1.93
- scale = min(1.04, 1.93) = 1.04
- Scaled table: 1123×603 pixels
- translationX = (1200 - 1123) / 2 = 39 pixels
- translationY = (1200 - 603) / 2 = 299 pixels

**Result:** Table nearly fills the width (limited by scaleX), centered vertically with large top/bottom margins due to square aspect ratio.

## Implementation Notes

### Rail Width Inclusion

The rail width is included in transform calculations because:
- Rails are visual/interactive elements that must be displayed
- Pockets extend into rail areas
- Complete table boundary needs appropriate spacing from screen edges

### Coordinate System Origin

The table's origin (0,0) is the **playing surface top-left corner**, not the top-left of the rails. This means:
- Rail boundaries extend from -railWidth to tableWidth + railWidth (x-axis)
- Rail boundaries extend from -railWidth to tableHeight + railWidth (y-axis)
- Ball positions are always relative to playing surface
- Pocket positions in corners may be at (0,0) or negative values depending on implementation

### Anti-Aliasing and Sub-Pixel Rendering

When scaling, consider:
- Scaling non-integer values may cause anti-aliasing artifacts
- Critical elements (pocket edges) should align to pixel boundaries when possible
- Text and UI overlays may need separate rendering at native scale for clarity

### Future Enhancements

Possible extensions to this transform system:
- **Zoom**: Allow user to zoom in/out while maintaining aspect ratio
- **Pan**: Allow viewing different parts of large tables
- **Rotation Preference**: User setting to disable auto-rotation in portrait mode
- **Custom Padding**: Adjustable padding for different installation contexts
- **Multi-Display**: Spanning table across multiple screens

---

## Summary

The table transform system provides a clean separation between game logic (1000×500 table space) and display rendering (variable screen space). By using automatic orientation detection, uniform scaling, and proper centering, the system maximizes screen usage across diverse display sizes and orientations while keeping physics and game mechanics simple and consistent.

The transform is entirely determined by screen size and requires no stored state. All rendering uses standard canvas transformations, and input events are converted to table coordinates through straightforward inverse transformations.
