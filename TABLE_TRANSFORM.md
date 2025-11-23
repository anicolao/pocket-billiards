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
- Rails: Extend from (-railWidth, -railWidth) to (1000 + railWidth, 500 + railWidth)
- Pockets: Positioned relative to playing surface origin; some may have negative coordinates
- Balls: Center positions expressed in playing surface coordinates (0-1000, 0-500)
- Physics calculations: All computed in table space

**Important:** The model coordinate system origin is at the playing surface top-left corner, NOT at the top-left of the rails. This means:
- Valid ball positions: approximately 0 ≤ x ≤ 1000, 0 ≤ y ≤ 500 (excluding pockets)
- Rail coordinates: negative values up to -railWidth and beyond tableWidth/Height up to +railWidth
- When rendering, both the playing surface and rails must be drawn, accounting for their relative positions

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

The scale factor must fit the entire renderable table area (playing surface plus rails) within the screen with appropriate padding.

**Renderable Table Dimensions:**
```
// The total area to render includes rails on all sides
// railWidth is typically 40 units (configurable in implementation)
const railWidth = 40  // Standard value, may be adjusted
totalTableWidth = tableWidth + (2 × railWidth)     // 1000 + (2 × 40) = 1080
totalTableHeight = tableHeight + (2 × railWidth)   // 500 + (2 × 40) = 580
```

**Note:** These dimensions represent the complete table visual footprint. The model coordinate system origin (0,0) remains at the playing surface, meaning the renderable area spans from (-railWidth, -railWidth) to (tableWidth + railWidth, tableHeight + railWidth) in model coordinates.

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

The transformation handles the entire renderable table area. For coordinates in the model's playing surface space (0-1000, 0-500), the transformation process is:

```
// Method 1: Direct formula approach
// First, determine the position in the renderable area (accounting for rails)
renderX = tableX + railWidth    // Offset from playing surface to renderable area
renderY = tableY + railWidth

// Apply 90° clockwise rotation around the renderable area origin
// Generic 90° CW rotation: (x, y) → (y, width - x)
// Specific application: (renderX, renderY) → (renderY, totalTableWidth - renderX)
rotatedX = renderY  
rotatedY = totalTableWidth - renderX

// Scale and translate to screen position
screenX = translationX + (rotatedX × scale)
screenY = translationY + (rotatedY × scale)
```

**Method 2: Using canvas transformations** (recommended, see Rendering section)

## Input Transformation (Screen to Model)

Touch and pointer events occur in screen coordinates and must be transformed to table coordinates for game logic. This inverse transformation is essential for handling user interactions like aiming shots, placing balls, or detecting clicks on table elements.

### Getting Input Coordinates

Input events provide coordinates relative to the canvas element:

```typescript
// Touch events
canvas.addEventListener('touchstart', (event) => {
  const touch = event.touches[0]
  const rect = canvas.getBoundingClientRect()
  const screenX = touch.clientX - rect.left
  const screenY = touch.clientY - rect.top
  const tablePos = screenToTable(screenX, screenY)
  // Use tablePos.x and tablePos.y for game logic
})

// Mouse/pointer events
canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect()
  const screenX = event.clientX - rect.left
  const screenY = event.clientY - rect.top
  const tablePos = screenToTable(screenX, screenY)
  // Use tablePos.x and tablePos.y for game logic
})
```

### Inverse Transform Process

The inverse transformation reverses the rendering transformation to convert screen coordinates back to table coordinates:

1. **Un-translate**: Subtract the centering offset
2. **Un-rotate**: Apply inverse rotation (0° or -90°)
3. **Un-scale**: Divide by scale factor

**Landscape (no rotation):**
```typescript
function screenToTableLandscape(screenX: number, screenY: number): { x: number, y: number } {
  const tableX = (screenX - translationX) / scale
  const tableY = (screenY - translationY) / scale
  return { x: tableX, y: tableY }
}
```

**Portrait (90° CCW inverse rotation):**
```typescript
function screenToTablePortrait(screenX: number, screenY: number): { x: number, y: number } {
  // Remove screen translation
  const adjustedX = screenX - translationX
  const adjustedY = screenY - translationY
  
  // Undo scale
  const scaledX = adjustedX / scale
  const scaledY = adjustedY / scale
  
  // Undo rotation (reverse of: rotatedX = renderY, rotatedY = totalTableWidth - renderX)
  const renderY = scaledX
  const renderX = totalTableWidth - scaledY
  
  // Convert from renderable area coordinates to playing surface coordinates
  const tableX = renderX - railWidth
  const tableY = renderY - railWidth
  
  return { x: tableX, y: tableY }
}
```

**Combined function:**
```typescript
function screenToTable(screenX: number, screenY: number): { x: number, y: number } {
  const isPortrait = window.innerWidth < window.innerHeight
  return isPortrait 
    ? screenToTablePortrait(screenX, screenY)
    : screenToTableLandscape(screenX, screenY)
}
```

### Bounds Checking

After transformation, validate that input coordinates fall within valid table bounds:

```typescript
function isOnPlayingSurface(tableX: number, tableY: number): boolean {
  return tableX >= 0 && tableX <= 1000 && tableY >= 0 && tableY <= 500
}

function isOnTable(tableX: number, tableY: number): boolean {
  // Includes rails
  return tableX >= -railWidth && tableX <= 1000 + railWidth &&
         tableY >= -railWidth && tableY <= 500 + railWidth
}
```

**Validation strategies:**
- **Playing surface**: 0 ≤ tableX ≤ 1000, 0 ≤ tableY ≤ 500 (for ball placement, shot aiming)
- **Including rails**: -railWidth ≤ tableX ≤ 1000 + railWidth, -railWidth ≤ tableY ≤ 500 + railWidth (for UI interactions)

Coordinates outside valid bounds should be clamped or rejected based on use case (e.g., ball placement vs. UI interaction).

## Rendering Transformation (Model to Screen)

All rendering occurs on an HTML5 canvas. The transformation is applied using the canvas 2D context transformation matrix.

### Canvas Context Setup

The canvas transformation matrix should be set up to transform from the model's renderable area (which includes rails) to screen space.

**Landscape:**
```typescript
ctx.save()
ctx.translate(translationX, translationY)
ctx.scale(scale, scale)
// Now at renderable area origin (top-left of rails)
// To draw at playing surface origin (0,0), offset by railWidth:
ctx.translate(railWidth, railWidth)
// Now (0,0) corresponds to playing surface top-left
// Draw table elements in model coordinates (e.g., ball at 250, 125)
ctx.restore()
```

**Portrait:**
```typescript
ctx.save()
// After 90° rotation, dimensions swap: table width becomes screen height
// Position where the rotated table's renderable area top-left will be
const offsetX = translationX
const offsetY = translationY + totalTableWidth * scale  // Uses width because of rotation
ctx.translate(offsetX, offsetY)
ctx.rotate(Math.PI / 2)  // 90° clockwise
ctx.scale(scale, scale)
// Now at renderable area origin after rotation
// Offset to playing surface origin:
ctx.translate(railWidth, railWidth)
// Now (0,0) corresponds to playing surface top-left in rotated space
// Draw table elements in model coordinates
ctx.restore()
```

### Drawing Model Elements

With the transformation applied (including the railWidth offset), all drawing operations use table coordinates directly, where (0,0) is the playing surface top-left:

```typescript
// Example: Draw a ball at table position (250, 125) on the playing surface
ctx.beginPath()
ctx.arc(250, 125, ballRadius, 0, Math.PI * 2)
ctx.fill()

// Example: Draw the playing surface (green felt)
ctx.fillStyle = '#0b6623'
ctx.fillRect(0, 0, tableWidth, tableHeight)  // (0,0) to (1000, 500)

// Example: Draw the rails (wood border around playing surface)
ctx.fillStyle = '#4a3428'
ctx.fillRect(-railWidth, -railWidth, 
             tableWidth + 2 * railWidth, 
             tableHeight + 2 * railWidth)
```

The canvas transformation automatically converts these model coordinates to correct screen positions, accounting for scale, rotation, and translation.

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
- Table: 1000×500 playing surface
- Rail width: 40 units per side → Total: 1080×580 (including rails)
- Padding: 40 pixels

**Calculations:**
- Orientation: Landscape (width > height)
- Rotation: 0°
- scaleX = (1920 - 2 × 40) / 1080 = 1840 / 1080 ≈ 1.70
- scaleY = (1080 - 2 × 40) / 580 = 1000 / 580 ≈ 1.72
- scale = min(1.70, 1.72) = 1.70
- Scaled table: 1836×986 pixels
- translationX = (1920 - 1836) / 2 = 42 pixels
- translationY = (1080 - 986) / 2 = 47 pixels

**Result:** Table is 1836 pixels wide, centered horizontally and vertically with comfortable margins.

### Scenario 2: Tablet Portrait Display (1080×1920)

**Given:**
- Screen: 1080×1920 pixels (portrait)
- Table: 1000×500 playing surface
- Rail width: 40 units per side → Total: 1080×580 (including rails)
- Padding: 40 pixels

**Calculations:**
- Orientation: Portrait (width < height)
- Rotation: 90° clockwise
- After rotation, table occupies: 580 width × 1080 height
- scaleX = (1080 - 2 × 40) / 580 = 1000 / 580 ≈ 1.72
- scaleY = (1920 - 2 × 40) / 1080 = 1840 / 1080 ≈ 1.70
- scale = min(1.72, 1.70) = 1.70
- Scaled rotated table: 986×1836 pixels
- translationX = (1080 - 986) / 2 = 47 pixels
- translationY = (1920 - 1836) / 2 = 42 pixels

**Result:** Table is rotated 90°, now 986 pixels wide and 1836 pixels tall, maximizing vertical space.

### Scenario 3: Large Touchscreen (3840×2160, 4K)

**Given:**
- Screen: 3840×2160 pixels
- Table: 1000×500 playing surface
- Rail width: 40 units per side → Total: 1080×580 (including rails)
- Padding: 40 pixels

**Calculations:**
- Orientation: Landscape
- Rotation: 0°
- scaleX = (3840 - 2 × 40) / 1080 = 3760 / 1080 ≈ 3.48
- scaleY = (2160 - 2 × 40) / 580 = 2080 / 580 ≈ 3.59
- scale = min(3.48, 3.59) = 3.48
- Scaled table: 3758×2018 pixels
- translationX = (3840 - 3758) / 2 = 41 pixels
- translationY = (2160 - 2018) / 2 = 71 pixels

**Result:** Table is magnified 3.48× to fill the large 4K display while maintaining aspect ratio and padding.

### Scenario 4: Square Display (1200×1200)

**Given:**
- Screen: 1200×1200 pixels (square)
- Table: 1000×500 playing surface
- Rail width: 40 units per side → Total: 1080×580 (including rails)
- Padding: 40 pixels

**Calculations:**
- Orientation: Landscape (width ≥ height, square treated as landscape)
- Rotation: 0°
- scaleX = (1200 - 2 × 40) / 1080 = 1120 / 1080 ≈ 1.04
- scaleY = (1200 - 2 × 40) / 580 = 1120 / 580 ≈ 1.93
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
