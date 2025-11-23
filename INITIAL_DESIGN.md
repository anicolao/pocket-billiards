# Initial Design: Pocket Billiards MVP

This document outlines the minimal viable product (MVP) design for the Pocket Billiards project. The MVP is targeted for a specific deployment: a **Raspberry Pi 5 running Chrome in kiosk mode** on a tabletop display.

## Target Environment

- **Hardware**: Raspberry Pi 5
- **Browser**: Chrome (latest stable) in kiosk mode
- **Display**: Full-screen tabletop touchscreen
- **Input**: Touch-based controls

No cross-browser compatibility, networking, or multiple environment support needed for MVP.

## Technology Stack

### Core Technologies
- **TypeScript**: For type safety and modern JavaScript features
- **Redux**: State management for predictable game state
- **HTML5 Canvas**: 2D Canvas API for rendering
- **Vite**: Build system and development server

### Testing
- **Vitest**: Unit testing framework
- **Playwright**: End-to-end testing

### Rendering Approach
- **No sprites or assets**: Plain canvas rendering using drawing primitives
- **No audio**: Audio deferred to future releases
- **No persistence**: No state saving between sessions
- **No networking**: Local multiplayer only

## Architecture

### State Management

Redux manages all application state with these key slices:
- **Game State**: Current game mode, turn, scores, game phase
- **Table State**: Ball positions, velocities, spins
- **Physics State**: Active collisions, simulations in progress
- **UI State**: Touch tracking, power level, aim direction

### Rendering Architecture

The MVP uses a layered canvas approach optimized for performance:

**Table Background:**
- Single full-screen canvas element renders the table surface (felt, rails, pockets)
- Redrawn only when necessary (static between shots)

**Dynamic Objects:**
- Balls and other moving objects rendered on **small canvases drawn from a pool**
- Each small canvas positioned absolutely atop the main canvas
- Canvases returned to pool when objects are stationary or removed
- Reduces redraw overhead by updating only moving elements

**Rendering Order:**
1. Main canvas: table background
2. Pooled canvases: shadows (if needed)
3. Pooled canvases: balls
4. Pooled canvases: cue stick
5. Pooled canvases: UI overlays (power meter, aim line)

This architecture will be detailed in a future rendering design document.

### Physics Engine

**Minimal physics simulation:**
- Fixed timestep updates (60Hz)
- Basic Verlet integration for ball movement
- Simple collision detection (ball-ball, ball-rail, ball-pocket)
- Friction model for realistic slowdown
- No advanced spin mechanics in MVP

### Touch Controls

**Simple tap-based interface:**
1. **Aim**: Tap on table to set direction
2. **Power**: Tap and hold to charge, release to shoot
3. **Visual feedback**: Aim line, power meter, ghost ball indicator

## MVP Features

**Core Gameplay:**
- 8-ball pool rules only
- Turn-based local two-player mode
- Ball rendering with solid colors (no textures)
- Basic collision physics
- Pocket detection and ball removal
- Foul detection and ball-in-hand
- Win condition detection

**User Interface:**
- Full-screen canvas rendering
- Minimal HUD showing current player and ball type
- Touch-based aiming and power control
- Simple text overlays for game state messages

**Out of Scope for MVP:**
- Advanced graphics (shadows, reflections, textures)
- Audio effects
- Multiple game modes
- AI opponents
- Network multiplayer
- Game state persistence
- Settings or customization
- Statistics or history

## Code Organization

```
src/
  ├── main.ts               # Entry point, Vite setup
  ├── store/                # Redux store
  │   ├── index.ts
  │   ├── gameSlice.ts
  │   ├── tableSlice.ts
  │   ├── physicsSlice.ts
  │   └── uiSlice.ts
  ├── physics/              # Physics engine
  │   ├── collision.ts
  │   ├── integration.ts
  │   └── constants.ts
  ├── rendering/            # Canvas rendering
  │   ├── renderer.ts
  │   ├── canvasPool.ts
  │   └── drawPrimitives.ts
  ├── input/                # Touch handling
  │   └── touchHandler.ts
  ├── rules/                # Game rules
  │   └── eightBall.ts
  └── utils/                # Utilities
      └── math.ts

tests/
  ├── unit/                 # Vitest unit tests
  └── e2e/                  # Playwright tests
```

## Testing Strategy

**Unit Tests (Vitest):**
- Physics calculations and collision detection
- Game rule logic and state transitions
- Redux reducers and selectors
- Utility functions

**End-to-End Tests (Playwright):**
- Full game flow from break to win
- Touch interaction sequences
- UI state updates

Testing architecture details will be documented separately.

## Performance Targets

- **60 FPS** consistent frame rate during gameplay
- **< 100ms** touch input latency
- **< 5 seconds** initial load time on Raspberry Pi 5

## Next Steps

1. Set up Vite project with TypeScript
2. Configure Vitest and Playwright
3. Implement Redux store structure
4. Create canvas rendering system with object pooling
5. Build basic physics engine
6. Implement touch input handling
7. Add 8-ball game rules
8. Test and optimize on Raspberry Pi 5

---

*This MVP design focuses on delivering a playable game on the target hardware. Future design documents will cover detailed rendering architecture, advanced physics, and feature enhancements.*
