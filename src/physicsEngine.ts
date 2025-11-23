import { store } from './store';
import { setBallPosition, setBallVelocity, setBallActive } from './store/ballSlice';
import { setPhysicsRunning } from './store/physicsSlice';
import {
  PHYSICS_TIMESTEP,
  updateBallPhysics,
  handleRailCollisions,
  checkPocketCollision,
  anyBallMoving,
} from './physics';

/**
 * Physics Engine
 * 
 * Provides integration between the physics simulation and Redux store.
 * Supports both automatic (requestAnimationFrame) and manual stepping for testing.
 */

export interface PhysicsEngineConfig {
  autoRun?: boolean; // If true, use requestAnimationFrame. If false, manual stepping only.
}

class PhysicsEngine {
  private animationFrameId: number | null = null;
  private autoRun: boolean = true;

  constructor(config: PhysicsEngineConfig = {}) {
    this.autoRun = config.autoRun !== undefined ? config.autoRun : true;
  }

  /**
   * Perform a single physics step
   * Updates all ball positions and velocities, handles collisions, checks for pockets
   * Returns true if simulation should continue, false if all balls have stopped
   */
  step(): boolean {
    const state = store.getState();
    const { balls } = state.balls;
    const { pockets, width, height } = state.table.dimensions;

    // Check if any balls are moving
    if (!anyBallMoving(balls)) {
      store.dispatch(setPhysicsRunning(false));
      return false;
    }

    // Update each active ball
    for (const ball of balls) {
      if (!ball.active) continue;

      // Create mutable copy for physics update
      const ballCopy = {
        ...ball,
        position: { ...ball.position },
        velocity: { ...ball.velocity },
      };

      // Update physics
      updateBallPhysics(ballCopy, PHYSICS_TIMESTEP);

      // Handle rail collisions
      handleRailCollisions(ballCopy, width, height);

      // Check for pocket collisions
      for (const pocket of pockets) {
        if (checkPocketCollision(ballCopy, pocket)) {
          ballCopy.active = false;
          ballCopy.velocity.x = 0;
          ballCopy.velocity.y = 0;
          break;
        }
      }

      // Update store with new state
      store.dispatch(setBallPosition({ id: ball.id, position: ballCopy.position }));
      store.dispatch(setBallVelocity({ id: ball.id, velocity: ballCopy.velocity }));
      
      if (!ballCopy.active) {
        store.dispatch(setBallActive({ id: ball.id, active: false }));
      }
    }

    return true;
  }

  /**
   * Start the physics simulation
   * If autoRun is true, uses requestAnimationFrame loop
   * If autoRun is false, does nothing (tests must call step() manually)
   */
  start(): void {
    store.dispatch(setPhysicsRunning(true));

    if (this.autoRun) {
      this.runLoop();
    }
  }

  /**
   * Stop the physics simulation
   */
  stop(): void {
    store.dispatch(setPhysicsRunning(false));
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Internal animation loop (only used when autoRun is true)
   */
  private runLoop = (): void => {
    const shouldContinue = this.step();

    if (shouldContinue && store.getState().physics.isRunning) {
      this.animationFrameId = requestAnimationFrame(this.runLoop);
    } else {
      this.animationFrameId = null;
    }
  };

  /**
   * Check if simulation is complete (no balls moving)
   */
  isComplete(): boolean {
    const state = store.getState();
    return !anyBallMoving(state.balls.balls);
  }

  /**
   * Check if simulation is currently running
   */
  isRunning(): boolean {
    return store.getState().physics.isRunning;
  }
}

// Export singleton instance for normal application use
export const physicsEngine = new PhysicsEngine({ autoRun: true });

// Export class for tests to create custom instances
export { PhysicsEngine };
