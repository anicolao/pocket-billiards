# Initial Design: Pocket Billiards

This document outlines the technical design, architecture decisions, and development roadmap for the Pocket Billiards project.

## Technology Stack

### Core Technologies
- **TypeScript**: Vanilla TypeScript for type safety and modern JavaScript features
- **Redux**: State management for predictable, centralized application state
- **HTML5 Canvas**: 2D Canvas API for rendering graphics
- **ES Modules**: Modern module system for code organization

### Development Tools
- TypeScript compiler
- Build tooling (to be determined)
- Local web server for testing

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Architecture

### State Management with Redux

The application state will be managed using Redux, providing:
- **Predictable state updates**: All state changes through actions and reducers
- **Time-travel debugging**: Ability to replay actions during development
- **Centralized game state**: Single source of truth for game logic

**Key State Slices:**
- **Game State**: Current game mode, turn, scores, game phase
- **Table State**: Ball positions, velocities, spins
- **Physics State**: Active collisions, simulations in progress
- **UI State**: Active tool, zoom level, visual settings
- **Input State**: Touch/mouse tracking, gesture recognition

### Rendering Architecture

**2D Canvas Rendering:**
- Single full-screen canvas element
- Coordinate system mapped to table dimensions
- Layers: table surface → shadows → balls → cue stick → UI overlays
- Request animation frame loop for smooth 60 FPS rendering

**Rendering Pipeline:**
1. Clear canvas
2. Render table (felt, rails, pockets)
3. Render shadows (under balls)
4. Render balls (solid, stripe, 8-ball, cue ball)
5. Render cue stick (when aiming)
6. Render UI elements (power meter, aim assist)
7. Render overlays (score, messages)

### Physics Engine

**Simulation Approach:**
- Fixed timestep physics updates (60Hz or 120Hz)
- Verlet integration for position updates
- Continuous collision detection for ball-ball and ball-rail
- Friction model: rolling resistance and sliding friction

**Collision Detection:**
- Broad phase: Spatial hashing for ball proximity
- Narrow phase: Circle-circle intersection tests
- Pocket detection: Distance checks to pocket centers

**Physics Properties:**
- Ball mass, radius, restitution coefficient
- Table friction coefficients (rolling, sliding)
- Rail cushion elasticity
- Pocket capture radius

## User Interface Design

### Touch Interaction Model

**Tap-Based Controls** (optimized for large touchscreens):

1. **Aiming**
   - Tap on the table to set aim direction
   - Visual: Line from cue ball through aim point
   - Ghost ball shows contact point on target ball

2. **Power Control**
   - Tap and hold to charge power
   - Visual: Power meter fills up during hold
   - Release to execute shot
   - Power range: gentle tap to maximum break power

3. **Spin Control** (future enhancement)
   - Two-finger tap on cue ball region
   - Position indicates English (top/bottom, left/right)
   - Visual: Indicator on cue ball showing spin direction

4. **Camera Control** (if implemented)
   - Two-finger pinch to zoom
   - Two-finger drag to pan
   - Double-tap to reset view

### Visual Feedback Elements

**Aiming Assistance:**
- Aim line from cue ball
- Ghost ball at contact point
- Optional: Trajectory line showing first ball's path
- Optional: Pocket indicators

**Power Indication:**
- Linear or curved power meter
- Color changes: green → yellow → red as power increases
- Haptic feedback on touch release (if supported)

**Game State Display:**
- Current player indicator
- Ball type assignment (solids/stripes)
- Remaining balls for each player
- Turn counter
- Game phase (break, open table, assigned)

## Development Phases

### Phase 1: MVP Foundation (8-Ball Proof of Concept)

**Goal**: Playable 8-ball game with basic physics and tap controls

**Features:**
- 8-ball game rules implementation
- Ball rendering and basic animations
- Tap to aim, tap-and-hold for power
- Ball-ball and ball-rail collision physics
- Pocket detection
- Turn-based local multiplayer
- Basic score tracking

**Deliverables:**
- Working game loop
- Physics simulation
- Touch input handling
- 8-ball rule enforcement
- Simple UI for game state

**Success Criteria:**
- Game is playable end-to-end
- Physics feel reasonably realistic
- Touch controls are responsive
- Runs at 60 FPS on target hardware

### Phase 2: Polish and Enhancement

**Goal**: Improve visual quality, physics accuracy, and game feel

**Features:**
- Enhanced graphics (shadows, reflections, table textures)
- Improved physics (better friction, spin mechanics)
- Sound effects (ball collisions, pocket drops)
- Advanced spin control
- Game statistics and history
- 9-ball game mode

**Deliverables:**
- Visual polish pass
- Physics refinement
- Audio system
- Additional game mode
- Stats tracking

### Phase 3: Expansion

**Goal**: Add variety and customization options

**Features:**
- Additional game modes (straight pool, cutthroat)
- Custom table configurations
- Theme customization (felt colors, ball designs)
- Practice mode with shot scenarios
- Tournament bracket system
- Achievement system

**Deliverables:**
- Game mode variety
- Customization options
- Practice tools
- Tournament support

### Phase 4: Advanced Features

**Goal**: Add sophisticated features for enhanced gameplay

**Features:**
- AI opponent with adjustable difficulty
- Online multiplayer (WebRTC or server-based)
- Replay system for memorable shots
- Video recording/sharing
- Integration with external displays
- Customizable rule sets

**Deliverables:**
- AI system
- Network multiplayer
- Replay functionality
- Advanced integrations

## Technical Considerations

### Performance Optimization

**Target Performance:**
- 60 FPS minimum on mid-range hardware (3-year-old device)
- Load time under 3 seconds
- Responsive touch input (< 50ms latency)

**Optimization Strategies:**
- Efficient canvas rendering (minimal redraws)
- Object pooling for physics calculations
- Spatial partitioning for collision detection
- RequestAnimationFrame for render loop
- Web Workers for physics simulation (if needed)

### Code Organization

**Module Structure:**
```
src/
  ├── index.ts              # Entry point
  ├── store/                # Redux store and configuration
  │   ├── index.ts
  │   ├── gameSlice.ts      # Game state
  │   ├── tableSlice.ts     # Table and balls
  │   └── uiSlice.ts        # UI state
  ├── physics/              # Physics engine
  │   ├── collision.ts
  │   ├── integration.ts
  │   └── constants.ts
  ├── rendering/            # Canvas rendering
  │   ├── renderer.ts
  │   ├── layers.ts
  │   └── assets.ts
  ├── input/                # Touch/mouse handling
  │   ├── touchHandler.ts
  │   └── gestureDetector.ts
  ├── rules/                # Game rules
  │   ├── eightBall.ts
  │   └── nineBall.ts
  └── utils/                # Utilities
      ├── math.ts
      └── helpers.ts
```

### Testing Strategy

**Unit Tests:**
- Physics calculations
- Collision detection
- Game rule logic
- State management

**Integration Tests:**
- Input → State → Rendering pipeline
- Full game flow scenarios

**Manual Testing:**
- Touch interaction on actual hardware
- Performance profiling
- Cross-browser compatibility

## Open Questions

1. **Build System**: Webpack, Vite, or simple TypeScript compilation?
2. **Asset Loading**: How to handle table textures and ball sprites?
3. **State Persistence**: LocalStorage for game history?
4. **Networking**: WebRTC for peer-to-peer or server-based for multiplayer?
5. **Audio**: Web Audio API or simple audio elements?

## Next Steps

1. Set up TypeScript project structure
2. Implement basic Redux store
3. Create canvas rendering scaffold
4. Implement basic physics engine
5. Add touch input handling
6. Implement 8-ball rules
7. Test on target hardware

---

*This design document will be updated as implementation progresses and technical decisions are finalized.*
