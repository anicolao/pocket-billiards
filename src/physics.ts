import { Ball } from './store/ballSlice';
import { Pocket } from './store/tableSlice';

// Physics constants from TRIVIAL_PHYSICS.md
export const PHYSICS_FPS = 60;
export const PHYSICS_TIMESTEP = 1 / PHYSICS_FPS; // 0.0167 seconds
export const FRICTION_COEFFICIENT = 2.0; // 1/second
export const VELOCITY_THRESHOLD = 1.0; // Table units/second
export const MAX_SHOT_VELOCITY = 500; // Table units/second

/**
 * Update a single ball's physics for one timestep
 * Implements the motion equation from TRIVIAL_PHYSICS.md
 */
export function updateBallPhysics(ball: Ball, dt: number): void {
  // Calculate velocity magnitude
  const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
  
  // Stop ball if below threshold
  if (speed < VELOCITY_THRESHOLD) {
    ball.velocity.x = 0;
    ball.velocity.y = 0;
    return;
  }
  
  // Update position first (using current velocity)
  ball.position.x += ball.velocity.x * dt;
  ball.position.y += ball.velocity.y * dt;
  
  // Apply friction deceleration
  // Using Euler integration to approximate exponential decay
  const decayFactor = 1 - FRICTION_COEFFICIENT * dt;
  
  // Apply friction to both velocity components
  ball.velocity.x *= decayFactor;
  ball.velocity.y *= decayFactor;
}

/**
 * Check if a ball has entered a pocket
 * Returns true if the ball center is within the pocket radius
 */
export function checkPocketCollision(ball: Ball, pocket: Pocket): boolean {
  const dx = ball.position.x - pocket.x;
  const dy = ball.position.y - pocket.y;
  const distanceSquared = dx * dx + dy * dy;
  const pocketRadiusSquared = pocket.radius * pocket.radius;
  
  return distanceSquared <= pocketRadiusSquared;
}

/**
 * Handle ball-to-rail collisions
 * Reflects the ball's velocity when it hits a rail
 */
export function handleRailCollisions(
  ball: Ball,
  tableWidth: number,
  tableHeight: number
): void {
  const minX = ball.radius;
  const maxX = tableWidth - ball.radius;
  const minY = ball.radius;
  const maxY = tableHeight - ball.radius;
  
  // Check left and right rails
  if (ball.position.x < minX) {
    ball.position.x = minX;
    ball.velocity.x = -ball.velocity.x;
  } else if (ball.position.x > maxX) {
    ball.position.x = maxX;
    ball.velocity.x = -ball.velocity.x;
  }
  
  // Check top and bottom rails
  if (ball.position.y < minY) {
    ball.position.y = minY;
    ball.velocity.y = -ball.velocity.y;
  } else if (ball.position.y > maxY) {
    ball.position.y = maxY;
    ball.velocity.y = -ball.velocity.y;
  }
}

/**
 * Check if any balls are still moving
 */
export function anyBallMoving(balls: Ball[]): boolean {
  return balls.some(
    (b) => b.active && (b.velocity.x !== 0 || b.velocity.y !== 0)
  );
}
