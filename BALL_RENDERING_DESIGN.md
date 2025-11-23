# Ball Rendering Design

This document describes the rendering architecture for billiard balls in the Pocket Billiards application.

## Overview

The ball rendering system uses a pre-allocated canvas approach optimized for the maximum number of balls in standard pool games. Since we never have more than 16 balls (15 object balls + 1 cue ball), we pre-allocate 16 small HTML5 canvas elements, one for each potential ball.

This approach aligns with the INITIAL_DESIGN.md philosophy of using "small canvases drawn from a pool" for dynamic objects, but simplifies the implementation by pre-allocating a fixed number rather than using a dynamic pool.

## Architecture

### Pre-Allocated Canvases

**Design Decision**: Pre-allocate 16 ball canvases at initialization
- **Rationale**: Pool never requires more than 16 balls (8-ball, 9-ball, etc.)
- **Benefits**:
  - No runtime allocation overhead
  - Simple array-based indexing
  - Predictable memory usage
  - Easy ball-to-canvas mapping

**Canvas Properties**:
- **Size**: Each canvas is sized to accommodate the ball diameter plus shadow/effect space
- **Position**: Absolutely positioned via CSS `transform` for GPU acceleration
- **Z-Index**: Layered above the main table canvas
- **Visibility**: Hidden when ball is pocketed or not in play

### Ball State Management

Ball state is managed in Redux with the following structure:

```typescript
interface Ball {
  id: number;           // Ball number (0 = cue ball, 1-15 = object balls)
  type: BallType;       // 'cue', 'solid', 'stripe', 'eight'
  position: { x: number; y: number };  // Position on playing surface
  velocity: { x: number; y: number };  // Current velocity
  active: boolean;      // Whether ball is on table (false if pocketed)
  radius: number;       // Ball radius
}

type BallType = 'cue' | 'solid' | 'stripe' | 'eight';
```

### Coordinate System

**Playing Surface Coordinates**:
- Origin (0, 0) is at the **top-left corner** of the playing surface (the felt)
- X-axis extends right (width direction)
- Y-axis extends down (height direction)
- Standard table: 1000 units wide × 500 units tall
- Ball positions are in these table coordinates

**Screen Coordinates**:
- The table renderer scales and centers the table on screen
- Ball canvases must be positioned in screen coordinates
- Transformation: `screen_pos = table_renderer.tableToScreen(ball.position)`

### Ball Positioning

**Standard Pool Table Positions**:

```
Table dimensions: width=1000, height=500

Head Spot (break position):
  x: width * 0.25 = 250
  y: height * 0.5 = 250

Foot Spot (rack front ball):
  x: width * 0.75 = 750
  y: height * 0.5 = 250

Center Spot:
  x: width * 0.5 = 500
  y: height * 0.5 = 250
```

**Initial Setup**: For MVP development and testing, a single cue ball is placed at the foot spot (750, 250).

### Rendering Strategy

**BallRenderer Class Responsibilities**:
1. Create and manage 16 pre-allocated canvas elements
2. Subscribe to Redux store for ball state changes
3. Update ball canvas positions when balls move
4. Render ball graphics (solid colors, stripes, numbers)
5. Show/hide canvases based on `active` state
6. Handle coordinate transformation from table to screen space

**Rendering Pipeline**:
1. **Initialization**:
   - Create 16 canvas elements
   - Append to DOM container
   - Set initial CSS properties (position: absolute, etc.)
   - All canvases start hidden

2. **On State Change**:
   - For each active ball:
     - Transform table coordinates to screen coordinates
     - Update canvas position via CSS `transform: translate(x, y)`
     - Redraw ball graphic if needed (color, type change)
   - For inactive balls:
     - Set `display: none` or `visibility: hidden`

3. **Ball Drawing**:
   - Clear canvas
   - Draw shadow (optional - can be deferred)
   - Draw ball circle with appropriate color
   - For striped balls: draw white base, then colored stripe
   - For eight ball: draw black base, then white circle with "8"
   - For solids: draw solid color circle
   - Add ball number (deferred for MVP)

### Ball Colors

Standard pool ball colors (for future reference):

| Ball # | Type   | Color       |
|--------|--------|-------------|
| 0      | Cue    | White       |
| 1      | Solid  | Yellow      |
| 2      | Solid  | Blue        |
| 3      | Solid  | Red         |
| 4      | Solid  | Purple      |
| 5      | Solid  | Orange      |
| 6      | Solid  | Green       |
| 7      | Solid  | Maroon      |
| 8      | Eight  | Black       |
| 9      | Stripe | Yellow/White|
| 10     | Stripe | Blue/White  |
| 11     | Stripe | Red/White   |
| 12     | Stripe | Purple/White|
| 13     | Stripe | Orange/White|
| 14     | Stripe | Green/White |
| 15     | Stripe | Maroon/White|

**MVP Implementation**: Start with simple solid colors, no stripes or numbers.

### Performance Considerations

**GPU Acceleration**:
- Use CSS `transform: translate3d(x, y, 0)` for positioning
- Triggers GPU compositing for smooth movement
- Better than changing `left`/`top` properties

**Redraw Optimization**:
- Only redraw ball graphic when ball type/color changes
- Position updates use CSS transform (no canvas redraw)
- Cache rendered balls for static appearance

**Canvas Size**:
- Ball diameter in screen pixels: `ballRadius * 2 * scale`
- Add padding for shadows/effects: `canvas_size = diameter * 1.5`
- Update canvas size on window resize to maintain quality

## Implementation Plan

### Phase 1: Basic Infrastructure (MVP)
1. Create `ballSlice.ts` - Redux state for balls
2. Create `BallRenderer` class - Canvas management and rendering
3. Initialize single cue ball at foot spot
4. Integrate with `main.ts` and existing renderer
5. Basic unit tests for ball state

### Phase 2: Full Ball Set (Future)
1. Add all 15 object balls with proper colors
2. Implement rack formation logic
3. Add ball-table collision detection
4. Add ball-ball collision detection

### Phase 3: Advanced Rendering (Future)
1. Add shadows for depth perception
2. Add ball numbers
3. Implement stripe patterns
4. Add specular highlights for realism
5. Optimize with requestAnimationFrame loop

## Testing Strategy

**Unit Tests**:
- Ball state initialization and updates
- Coordinate transformations
- Ball activation/deactivation logic
- Redux reducer behavior

**Visual Tests**:
- E2E test to verify ball appears at foot spot
- Screenshot comparison for rendering accuracy
- Responsive behavior on resize

**Performance Tests**:
- Frame rate with all 16 balls moving
- Memory usage (should be constant)
- Render time per frame

## Integration with Existing Code

**TableRenderer Integration**:
- `TableRenderer` continues to manage main table canvas
- `BallRenderer` operates independently with its own canvases
- Both use same coordinate system from `tableSlice`
- Share scale/offset calculations for consistency

**Main Application Flow**:
```typescript
// main.ts
const tableRenderer = new TableRenderer(mainCanvas);
const ballRenderer = new BallRenderer(appContainer, tableRenderer);

store.subscribe(() => {
  const state = store.getState();
  tableRenderer.drawTable(state.table.dimensions);
  ballRenderer.updateBalls(state.balls, state.table.dimensions);
});
```

## Future Enhancements

1. **Ball Pooling**: If we need temporary visual effects (ball trails, etc.), implement actual canvas pooling
2. **WebGL Rendering**: For 3D ball rendering with lighting
3. **Texture Mapping**: High-quality ball textures instead of primitives
4. **Motion Blur**: For fast-moving balls
5. **Particle Effects**: For ball impacts and spin visualization

---

*This design provides a simple, performant foundation for ball rendering that can be enhanced incrementally as the project evolves.*
