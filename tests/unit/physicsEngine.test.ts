import { describe, it, expect } from 'vitest';
import {
  updateBallPhysics,
  handleRailCollisions,
  checkPocketCollision,
  anyBallMoving,
  PHYSICS_TIMESTEP,
  FRICTION_COEFFICIENT,
  VELOCITY_THRESHOLD,
} from '../../src/physics';
import { Ball } from '../../src/store/ballSlice';
import { Pocket } from '../../src/store/tableSlice';

// Helper function to create a test ball with default values
const createTestBall = (overrides: Partial<Ball> = {}): Ball => ({
  id: 0,
  type: 'cue',
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  active: true,
  radius: 11.25,
  ...overrides,
});

describe('Physics Engine', () => {
  describe('updateBallPhysics', () => {
    it('should update ball position based on velocity', () => {
      const ball = createTestBall({
        position: { x: 100, y: 200 },
        velocity: { x: 60, y: 0 },
      });

      updateBallPhysics(ball, PHYSICS_TIMESTEP);

      // Position should increase by velocity * timestep
      // 60 * (1/60) = 1.0
      expect(ball.position.x).toBeCloseTo(101.0, 1);
      expect(ball.position.y).toBe(200);
    });

    it('should apply friction to reduce velocity', () => {
      const ball = createTestBall({
        velocity: { x: 100, y: 0 },
      });

      const initialVelocity = ball.velocity.x;
      updateBallPhysics(ball, PHYSICS_TIMESTEP);

      // Velocity should decrease due to friction
      // velocity *= (1 - FRICTION_COEFFICIENT * dt)
      // velocity *= (1 - 2.0 * (1/60)) = 0.9667
      expect(ball.velocity.x).toBeLessThan(initialVelocity);
      expect(ball.velocity.x).toBeCloseTo(96.67, 1);
    });

    it('should stop ball when velocity drops below threshold', () => {
      const ball = createTestBall({
        velocity: { x: 0.5, y: 0.5 },
      });

      updateBallPhysics(ball, PHYSICS_TIMESTEP);

      // Ball should stop completely
      expect(ball.velocity.x).toBe(0);
      expect(ball.velocity.y).toBe(0);
    });

    it('should preserve velocity direction while reducing magnitude', () => {
      const ball = createTestBall({
        velocity: { x: 100, y: 100 },
      });

      const initialRatio = ball.velocity.y / ball.velocity.x;
      updateBallPhysics(ball, PHYSICS_TIMESTEP);

      // Ratio should be preserved
      const finalRatio = ball.velocity.y / ball.velocity.x;
      expect(finalRatio).toBeCloseTo(initialRatio, 5);
    });
  });

  describe('handleRailCollisions', () => {
    const TABLE_WIDTH = 1000;
    const TABLE_HEIGHT = 500;

    it('should bounce ball off left rail', () => {
      const ball = createTestBall({
        position: { x: 5, y: 250 },
        velocity: { x: -50, y: 0 },
      });

      handleRailCollisions(ball, TABLE_WIDTH, TABLE_HEIGHT);

      // Ball should be pushed back to min position and velocity reversed
      expect(ball.position.x).toBe(11.25);
      expect(ball.velocity.x).toBe(50); // Reversed
    });

    it('should bounce ball off right rail', () => {
      const ball = createTestBall({
        position: { x: 995, y: 250 },
        velocity: { x: 50, y: 0 },
      });

      handleRailCollisions(ball, TABLE_WIDTH, TABLE_HEIGHT);

      // Ball should be pushed back and velocity reversed
      expect(ball.position.x).toBe(TABLE_WIDTH - 11.25);
      expect(ball.velocity.x).toBe(-50);
    });

    it('should bounce ball off top rail', () => {
      const ball = createTestBall({
        position: { x: 500, y: 5 },
        velocity: { x: 0, y: -50 },
      });

      handleRailCollisions(ball, TABLE_WIDTH, TABLE_HEIGHT);

      expect(ball.position.y).toBe(11.25);
      expect(ball.velocity.y).toBe(50);
    });

    it('should bounce ball off bottom rail', () => {
      const ball = createTestBall({
        position: { x: 500, y: 495 },
        velocity: { x: 0, y: 50 },
      });

      handleRailCollisions(ball, TABLE_WIDTH, TABLE_HEIGHT);

      expect(ball.position.y).toBe(TABLE_HEIGHT - 11.25);
      expect(ball.velocity.y).toBe(-50);
    });

    it('should not modify ball that is not near rails', () => {
      const ball = createTestBall({
        position: { x: 500, y: 250 },
        velocity: { x: 50, y: 50 },
      });

      const originalPosition = { ...ball.position };
      const originalVelocity = { ...ball.velocity };

      handleRailCollisions(ball, TABLE_WIDTH, TABLE_HEIGHT);

      expect(ball.position).toEqual(originalPosition);
      expect(ball.velocity).toEqual(originalVelocity);
    });
  });

  describe('checkPocketCollision', () => {
    it('should detect collision when ball center is within pocket radius', () => {
      const ball = createTestBall({
        position: { x: 10, y: 10 },
      });

      const pocket: Pocket = {
        x: 0,
        y: 0,
        radius: 25,
      };

      const result = checkPocketCollision(ball, pocket);
      expect(result).toBe(true);
    });

    it('should not detect collision when ball is outside pocket radius', () => {
      const ball = createTestBall({
        position: { x: 100, y: 100 },
      });

      const pocket: Pocket = {
        x: 0,
        y: 0,
        radius: 25,
      };

      const result = checkPocketCollision(ball, pocket);
      expect(result).toBe(false);
    });

    it('should detect collision at exact pocket radius boundary', () => {
      const ball = createTestBall({
        position: { x: 25, y: 0 },
      });

      const pocket: Pocket = {
        x: 0,
        y: 0,
        radius: 25,
      };

      const result = checkPocketCollision(ball, pocket);
      expect(result).toBe(true);
    });
  });

  describe('anyBallMoving', () => {
    it('should return true when at least one ball is moving', () => {
      const balls: Ball[] = [
        createTestBall({
          id: 0,
          velocity: { x: 10, y: 0 },
        }),
        createTestBall({
          id: 1,
          type: 'solid',
          position: { x: 100, y: 100 },
        }),
      ];

      expect(anyBallMoving(balls)).toBe(true);
    });

    it('should return false when all balls are stopped', () => {
      const balls: Ball[] = [
        createTestBall({ id: 0 }),
        createTestBall({
          id: 1,
          type: 'solid',
          position: { x: 100, y: 100 },
        }),
      ];

      expect(anyBallMoving(balls)).toBe(false);
    });

    it('should ignore inactive balls', () => {
      const balls: Ball[] = [
        createTestBall({
          velocity: { x: 10, y: 10 },
          active: false,
        }),
      ];

      expect(anyBallMoving(balls)).toBe(false);
    });
  });
});
