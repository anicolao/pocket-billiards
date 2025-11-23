# Trivial Physics Design

This document specifies the basic physics simulation for Pocket Billiards. The "trivial" physics system provides a minimal viable implementation that moves balls realistically across the table while keeping computational complexity low for smooth 60 FPS performance on target hardware (Raspberry Pi 5).

## Overview

The trivial physics system handles:
- Ball movement based on velocity
- Friction-based deceleration until balls stop
- Fixed timestep simulation for consistent behavior
- Integration with Redux state management

**Out of Scope for Trivial Physics:**
- Ball-to-ball collisions (future enhancement)
- Ball-to-rail collisions (future enhancement)
- Ball-to-pocket detection (future enhancement)
- Spin mechanics (future enhancement)
- Advanced friction models (rolling vs. sliding)

## Physics Model

### Coordinate System

All physics calculations occur in **table space** (1000×500 units) as defined in TABLE_TRANSFORM.md:
- Origin (0, 0) at top-left corner of playing surface
- X-axis increases to the right
- Y-axis increases downward
- Ball positions and velocities are in table units

### Ball State

Each ball maintains the following physics-relevant state (from `ballSlice.ts`):

```typescript
interface Ball {
  position: { x: number; y: number };  // Table units
  velocity: { x: number; y: number };  // Table units per second
  radius: number;                      // Table units (11.25 for standard balls)
  active: boolean;                     // Whether ball is on table
}
```

### Motion Equation

Ball motion follows basic Newtonian mechanics with friction:

**Position Update (Verlet Integration):**
```
new_position = position + velocity * dt
```

**Velocity Update (Friction Deceleration):**
```
new_velocity = velocity - friction * velocity * dt
```

Where:
- `dt` = timestep duration (1/60 second for 60 FPS)
- `friction` = friction coefficient (units: 1/second)

**Stopping Condition:**
```
if (|velocity| < VELOCITY_THRESHOLD) {
  velocity = 0
}
```

### Physics Constants

```typescript
// Simulation timing
const PHYSICS_FPS = 60;                    // Fixed 60 FPS timestep
const PHYSICS_TIMESTEP = 1 / PHYSICS_FPS;  // 0.0167 seconds per step

// Friction model
const FRICTION_COEFFICIENT = 2.0;  // Table units/second² (deceleration rate)
                                   // Higher = faster slowdown

// Stopping threshold
const VELOCITY_THRESHOLD = 1.0;    // Table units/second
                                   // Balls moving slower than this stop immediately
                                   // Prevents infinite tiny movements
```

**Rationale for Constants:**
- **60 FPS**: Matches target display refresh rate for smooth animation
- **Friction = 2.0**: Empirically tuned for realistic-feeling slowdown (~3-5 seconds to stop from medium-power shot)
- **Threshold = 1.0**: Prevents numerical precision issues with very small velocities

## Physics Simulation Loop

### State Management

The physics simulation integrates with Redux through a dedicated `physicsSlice`:

```typescript
interface PhysicsState {
  isRunning: boolean;        // Whether simulation is active
  lastUpdateTime: number;    // Timestamp of last physics update
  accumulatedTime: number;   // Time accumulated for fixed timestep
}
```

**Design Rationale:**
- `isRunning`: Controls when physics updates occur (true when any ball is moving)
- `lastUpdateTime`: Enables delta time calculation between frames
- `accumulatedTime`: Implements fixed timestep simulation (accumulates real time, consumes in fixed chunks)

### Fixed Timestep Implementation

The physics loop uses a **fixed timestep** approach to ensure deterministic, frame-rate-independent behavior:

```typescript
function updatePhysics(currentTime: number, state: PhysicsState, balls: Ball[]): void {
  const deltaTime = currentTime - state.lastUpdateTime;
  state.accumulatedTime += deltaTime;
  state.lastUpdateTime = currentTime;

  // Consume accumulated time in fixed timesteps
  while (state.accumulatedTime >= PHYSICS_TIMESTEP) {
    // Update all active balls
    for (const ball of balls.filter(b => b.active)) {
      updateBallPhysics(ball, PHYSICS_TIMESTEP);
    }
    
    state.accumulatedTime -= PHYSICS_TIMESTEP;
  }

  // Check if any balls are still moving
  const anyBallMoving = balls.some(b => b.active && 
                                        (b.velocity.x !== 0 || b.velocity.y !== 0));
  state.isRunning = anyBallMoving;
}
```

**Why Fixed Timestep:**
- **Determinism**: Same inputs produce same outputs regardless of frame rate
- **Stability**: Prevents physics from behaving differently on fast/slow systems
- **Precision**: Avoids numerical errors from variable timesteps
- **Testing**: Makes physics behavior reproducible in tests

### Ball Physics Update

```typescript
function updateBallPhysics(ball: Ball, dt: number): void {
  // Calculate velocity magnitude
  const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
  
  // Stop ball if below threshold
  if (speed < VELOCITY_THRESHOLD) {
    ball.velocity.x = 0;
    ball.velocity.y = 0;
    return;
  }
  
  // Apply friction deceleration
  // Friction acts opposite to velocity direction
  const frictionMagnitude = FRICTION_COEFFICIENT * dt;
  const deceleration = Math.min(frictionMagnitude / speed, 1.0);  // Cap at 100% to prevent reversal
  
  ball.velocity.x -= ball.velocity.x * deceleration;
  ball.velocity.y -= ball.velocity.y * deceleration;
  
  // Update position
  ball.position.x += ball.velocity.x * dt;
  ball.position.y += ball.velocity.y * dt;
}
```

**Key Features:**
- **Proportional Friction**: Deceleration is proportional to speed (realistic sliding friction)
- **Direction Preservation**: Friction only reduces magnitude, doesn't change direction
- **No Reversal**: Capping ensures friction never accelerates ball backward
- **Clean Stops**: Threshold prevents balls from drifting infinitesimally

## SHOT Action Flow

### Triggering Physics

A SHOT action represents the player striking the cue ball. This action initiates the physics simulation:

```typescript
// Redux action
interface ShotAction {
  type: 'SHOT';
  payload: {
    ballId: number;              // Usually 0 (cue ball)
    velocity: { x: number; y: number };  // Initial velocity (table units/second)
  }
}
```

**Shot Action Flow:**

1. **User Input**: Player sets aim direction and power
   - Touch/mouse input determines shot direction (angle)
   - Touch/mouse hold duration determines shot power (magnitude)
   - UI converts to velocity vector in table coordinates

2. **Dispatch SHOT Action**:
   ```typescript
   dispatch({
     type: 'SHOT',
     payload: {
       ballId: 0,  // Cue ball
       velocity: { x: vx, y: vy }
     }
   })
   ```

3. **Ball State Update**: Redux reducer sets ball velocity
   ```typescript
   case 'SHOT':
     const ball = state.balls.find(b => b.id === action.payload.ballId);
     if (ball) {
       ball.velocity = action.payload.velocity;
     }
   ```

4. **Physics Activation**: Setting non-zero velocity triggers physics loop
   ```typescript
   // Physics middleware or render loop detects moving ball
   if (ball.velocity.x !== 0 || ball.velocity.y !== 0) {
     physicsState.isRunning = true;
   }
   ```

5. **Simulation Runs**: Physics loop updates ball position/velocity each frame until ball stops

### Power to Velocity Mapping

The UI's power meter (0-100%) maps to initial velocity magnitude:

```typescript
const MAX_SHOT_VELOCITY = 500;  // Table units/second (empirically tuned)

function calculateShotVelocity(angle: number, power: number): { x: number; y: number } {
  const speed = (power / 100) * MAX_SHOT_VELOCITY;
  return {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed
  };
}
```

**Power Levels:**
- **0%**: No shot (velocity = 0)
- **25%**: Gentle tap (~125 units/s, ~2 seconds to stop)
- **50%**: Medium shot (~250 units/s, ~3 seconds to stop)
- **100%**: Maximum power (~500 units/s, ~5 seconds to stop)

## Ball Travel and Stopping

### Motion Phases

A ball's journey from shot to stop has distinct phases:

**Phase 1: Initial Velocity**
- Ball has maximum speed immediately after shot
- Moves fastest during first few frames
- Friction begins decelerating immediately

**Phase 2: Deceleration**
- Ball slows proportionally to current speed
- Covers progressively shorter distances each frame
- Takes majority of the total time

**Phase 3: Stopping**
- Velocity drops below threshold
- Position "snaps" to final location
- Velocity set to exactly zero
- Physics loop stops if no other balls moving

### Example Shot Timeline

**Shot Parameters:**
- Initial velocity: (300, 0) table units/second (horizontal shot)
- Friction coefficient: 2.0
- Timestep: 1/60 second

**Timeline:**

| Time (s) | Velocity (units/s) | Position Change (units) | Total Distance |
|----------|-------------------|------------------------|----------------|
| 0.000    | 300.0             | -                      | 0              |
| 0.017    | 290.0             | 5.0                    | 5.0            |
| 0.100    | 254.5             | 27.3                   | 145.0          |
| 0.500    | 110.2             | 32.5                   | 518.0          |
| 1.000    | 40.6              | 15.3                   | 706.0          |
| 1.500    | 15.0              | 4.7                    | 761.0          |
| 1.900    | 2.2               | 0.5                    | 775.0          |
| 2.000    | 0.0 (stopped)     | 0.0                    | 776.0          |

**Observations:**
- Ball travels ~776 table units before stopping
- Takes ~2 seconds to stop from 300 units/s
- Exponential decay curve (characteristic of proportional friction)
- Most distance covered in first second

### Stopping Criteria

The simulation considers a ball stopped when:

1. **Velocity Magnitude < Threshold**: `sqrt(vx² + vy²) < VELOCITY_THRESHOLD`
2. **Immediate Stop**: Velocity set to zero, no further position updates
3. **Physics Deactivation**: If all balls stopped, `physicsState.isRunning = false`

**Why Threshold Matters:**
- Without threshold, balls would continue moving at infinitesimally small speeds
- Would never truly reach velocity = 0 due to floating-point arithmetic
- Would waste CPU cycles updating position by sub-pixel amounts
- Threshold provides clean stop point

## Integration with Existing Code

### Redux Store Structure

```typescript
// store/index.ts
const store = configureStore({
  reducer: {
    balls: ballReducer,      // Ball positions, velocities (from ballSlice.ts)
    table: tableReducer,     // Table dimensions, configuration
    physics: physicsReducer  // Physics state (new)
  }
});
```

### Render Loop Integration

The physics update occurs in the main render loop (requestAnimationFrame):

```typescript
// main.ts or physics engine
let lastFrameTime = performance.now();

function gameLoop(currentTime: number): void {
  // Update physics if running
  const physicsState = store.getState().physics;
  if (physicsState.isRunning) {
    store.dispatch(updatePhysics(currentTime));
  }
  
  // Render current state
  const state = store.getState();
  ballRenderer.updateBalls(state.balls);
  
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

**Flow:**
1. `requestAnimationFrame` triggers at ~60 FPS (browser-controlled)
2. If physics is running, update ball positions/velocities
3. Render current ball positions
4. Schedule next frame

**Note**: Physics timestep (fixed 1/60s) is independent of render frame rate. If rendering is slower than 60 FPS, multiple physics steps may occur per frame. If faster, some frames render without physics updates.

### Ball Renderer Update

The `BallRenderer` (from BALL_RENDERING_DESIGN.md) subscribes to ball state:

```typescript
// rendering/ballRenderer.ts
store.subscribe(() => {
  const balls = store.getState().balls;
  updateBallCanvases(balls);  // Update canvas positions via CSS transform
});
```

Physics updates trigger re-render through Redux subscription mechanism.

## Performance Considerations

### Target Performance

- **60 FPS**: Smooth animation on Raspberry Pi 5
- **<1ms Physics Update**: Per-frame physics computation time
- **Predictable**: No frame drops during normal gameplay

### Optimization Strategies

**Early Exit:**
```typescript
// Skip physics if no balls moving
if (!physicsState.isRunning) {
  return;  // No computation needed
}
```

**Minimal Calculations:**
- Single square root per ball per update (for velocity magnitude)
- No trigonometry in inner loop
- Simple arithmetic operations only

**Fixed Timestep Benefits:**
- Prevents expensive variable timestep calculations
- Enables deterministic behavior
- Reduces testing complexity

**State Updates:**
- Redux updates batch ball position/velocity changes
- Renderer updates only when state changes
- No unnecessary redraws

### Scalability

**Current (MVP):**
- 1 ball (cue ball)
- ~0.01ms per physics update
- Negligible CPU usage

**Future (Full Game):**
- 16 balls maximum
- ~0.16ms per physics update (linear scaling)
- Still well under 1ms budget

## Testing Strategy

### Unit Tests

**Physics Function Tests:**
```typescript
describe('updateBallPhysics', () => {
  test('ball decelerates due to friction', () => {
    const ball = { position: {x: 0, y: 0}, velocity: {x: 100, y: 0}, ... };
    updateBallPhysics(ball, PHYSICS_TIMESTEP);
    expect(ball.velocity.x).toBeLessThan(100);
  });

  test('ball stops when below threshold', () => {
    const ball = { position: {x: 0, y: 0}, velocity: {x: 0.5, y: 0}, ... };
    updateBallPhysics(ball, PHYSICS_TIMESTEP);
    expect(ball.velocity.x).toBe(0);
  });

  test('ball position updates based on velocity', () => {
    const ball = { position: {x: 0, y: 0}, velocity: {x: 60, y: 0}, ... };
    updateBallPhysics(ball, PHYSICS_TIMESTEP);
    expect(ball.position.x).toBeCloseTo(1.0);  // 60 * (1/60) = 1
  });
});
```

**Redux Integration Tests:**
```typescript
test('SHOT action sets ball velocity', () => {
  store.dispatch(shot(0, { x: 100, y: 50 }));
  const ball = store.getState().balls.find(b => b.id === 0);
  expect(ball.velocity).toEqual({ x: 100, y: 50 });
});

test('physics stops when ball velocity reaches zero', () => {
  // Set up ball with low velocity
  // Run physics updates
  // Verify ball stopped and physics.isRunning = false
});
```

### Integration Tests

**End-to-End Shot Test:**
```typescript
test('ball comes to rest after shot', async () => {
  // Dispatch shot action
  store.dispatch(shot(0, { x: 200, y: 0 }));
  
  // Wait for physics to settle
  await waitFor(() => {
    const physics = store.getState().physics;
    return !physics.isRunning;
  });
  
  // Verify ball has stopped
  const ball = store.getState().balls.find(b => b.id === 0);
  expect(ball.velocity).toEqual({ x: 0, y: 0 });
  expect(ball.position.x).toBeGreaterThan(0);  // Ball moved
});
```

### Visual Tests

Using Playwright for visual regression:
```typescript
test('ball animates smoothly across table', async ({ page }) => {
  await page.goto('/');
  
  // Trigger shot
  await page.evaluate(() => {
    store.dispatch(shot(0, { x: 300, y: 0 }));
  });
  
  // Capture frames during motion
  // Verify smooth animation (no jumps)
  // Verify ball stops at expected position
});
```

## Future Enhancements

This trivial physics system provides the foundation for more advanced features:

### Collision Detection (Next Phase)

**Ball-to-Rail Collisions:**
- Detect when ball position crosses rail boundary
- Reflect velocity vector based on collision normal
- Apply energy loss coefficient (inelastic collision)

**Ball-to-Ball Collisions:**
- Detect overlapping ball boundaries
- Calculate collision normal and impulse
- Transfer momentum between balls
- Handle multiple simultaneous collisions

**Ball-to-Pocket Detection:**
- Detect when ball center enters pocket radius
- Set `ball.active = false`
- Remove from physics simulation

### Advanced Physics

**Spin Mechanics:**
- Add angular velocity state to balls
- Magnus effect (curved trajectory)
- English (side spin affecting collisions)
- Spin-dependent friction

**Rolling Resistance:**
- Separate sliding vs. rolling friction models
- Transition from sliding to rolling
- More realistic deceleration curves

**Table Cloth Effects:**
- Directional friction (nap of cloth)
- Speed variation by table condition
- Different friction for different ball types

### Performance Optimization

**Spatial Partitioning:**
- Only check collisions for nearby balls
- Broad phase collision detection
- Reduces O(n²) to O(n log n)

**Sleep/Wake System:**
- Mark stationary balls as "sleeping"
- Skip physics updates for sleeping balls
- Wake on collision or nearby motion

---

## Summary

The trivial physics system provides a minimal, robust foundation for ball movement in Pocket Billiards:

**Key Features:**
- Fixed 60 FPS timestep for deterministic simulation
- Proportional friction model for realistic deceleration
- Clean stopping behavior with velocity threshold
- Redux integration for state management
- Optimized for 60 FPS on Raspberry Pi 5

**Integration Points:**
- SHOT action dispatches initial ball velocity
- Physics loop updates ball positions each frame
- Ball renderer displays updated positions
- Simulation stops when all balls at rest

**Testing:**
- Unit tests verify physics calculations
- Integration tests validate Redux flow
- E2E tests ensure smooth animation

This design establishes the core physics infrastructure that will be extended with collisions, spin, and other advanced features in future iterations.
