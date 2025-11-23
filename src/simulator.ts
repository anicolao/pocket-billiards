import { Ball } from './store/ballSlice';
import { Pocket } from './store/tableSlice';
import {
  PHYSICS_TIMESTEP,
  updateBallPhysics,
  handleRailCollisions,
  checkPocketCollision,
  anyBallMoving,
} from './physics';

export interface SimulationState {
  balls: Ball[];
  pockets: Pocket[];
  tableWidth: number;
  tableHeight: number;
}

/**
 * Run physics simulation until all balls stop or max iterations reached
 * Returns the final state and whether any balls were pocketed
 */
export function runPhysicsSimulation(
  state: SimulationState,
  maxIterations: number = 10000
): { balls: Ball[]; pocketedBalls: number[]; iterations: number } {
  const pocketedBalls: number[] = [];
  let iterations = 0;
  
  // Deep copy balls to avoid mutating input
  const balls = state.balls.map((b) => ({
    ...b,
    position: { ...b.position },
    velocity: { ...b.velocity },
  }));
  
  while (anyBallMoving(balls) && iterations < maxIterations) {
    // Update physics for all active balls
    for (const ball of balls) {
      if (ball.active) {
        // Update ball physics (position and velocity)
        updateBallPhysics(ball, PHYSICS_TIMESTEP);
        
        // Handle rail collisions
        handleRailCollisions(ball, state.tableWidth, state.tableHeight);
        
        // Check for pocket collisions
        for (const pocket of state.pockets) {
          if (checkPocketCollision(ball, pocket)) {
            ball.active = false;
            ball.velocity.x = 0;
            ball.velocity.y = 0;
            pocketedBalls.push(ball.id);
            break;
          }
        }
      }
    }
    
    iterations++;
  }
  
  return { balls, pocketedBalls, iterations };
}
