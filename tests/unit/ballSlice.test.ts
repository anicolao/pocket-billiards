import { describe, it, expect } from 'vitest';
import ballReducer, {
  setBallPosition,
  setBallVelocity,
  setBallActive,
  initializeBalls,
  BallState,
} from '../../src/store/ballSlice';

describe('ballSlice', () => {
  it('should return the initial state with cue ball at head spot', () => {
    const state = ballReducer(undefined, { type: 'unknown' });
    
    expect(state.balls).toHaveLength(1);
    
    const cueBall = state.balls[0];
    expect(cueBall.id).toBe(0);
    expect(cueBall.type).toBe('cue');
    expect(cueBall.active).toBe(true);
    expect(cueBall.radius).toBe(11.25);
    
    // Head spot is at 1/4 width, 1/2 height
    expect(cueBall.position.x).toBe(250); // 1000 * 0.25
    expect(cueBall.position.y).toBe(250); // 500 * 0.5
    expect(cueBall.velocity.x).toBe(0);
    expect(cueBall.velocity.y).toBe(0);
  });

  it('should handle setBallPosition', () => {
    const initialState: BallState = ballReducer(undefined, { type: 'unknown' });
    
    const newPosition = { x: 100, y: 200 };
    const state = ballReducer(
      initialState,
      setBallPosition({ id: 0, position: newPosition })
    );
    
    expect(state.balls[0].position).toEqual(newPosition);
  });

  it('should handle setBallVelocity', () => {
    const initialState: BallState = ballReducer(undefined, { type: 'unknown' });
    
    const newVelocity = { x: 10, y: -5 };
    const state = ballReducer(
      initialState,
      setBallVelocity({ id: 0, velocity: newVelocity })
    );
    
    expect(state.balls[0].velocity).toEqual(newVelocity);
  });

  it('should handle setBallActive', () => {
    const initialState: BallState = ballReducer(undefined, { type: 'unknown' });
    
    expect(initialState.balls[0].active).toBe(true);
    
    const state = ballReducer(
      initialState,
      setBallActive({ id: 0, active: false })
    );
    
    expect(state.balls[0].active).toBe(false);
  });

  it('should handle initializeBalls with custom table dimensions', () => {
    const initialState: BallState = ballReducer(undefined, { type: 'unknown' });
    
    const state = ballReducer(
      initialState,
      initializeBalls({ tableWidth: 800, tableHeight: 400 })
    );
    
    expect(state.balls).toHaveLength(1);
    expect(state.balls[0].id).toBe(0);
    expect(state.balls[0].type).toBe('cue');
    
    // Head spot with new dimensions
    expect(state.balls[0].position.x).toBe(200); // 800 * 0.25
    expect(state.balls[0].position.y).toBe(200); // 400 * 0.5
  });

  it('should not mutate the previous state', () => {
    const initialState: BallState = ballReducer(undefined, { type: 'unknown' });
    
    const originalPosition = { ...initialState.balls[0].position };
    
    ballReducer(
      initialState,
      setBallPosition({ id: 0, position: { x: 100, y: 200 } })
    );
    
    // Original state should be unchanged
    expect(initialState.balls[0].position).toEqual(originalPosition);
  });

  it('should ignore updates for non-existent ball IDs', () => {
    const initialState: BallState = ballReducer(undefined, { type: 'unknown' });
    
    const state = ballReducer(
      initialState,
      setBallPosition({ id: 99, position: { x: 100, y: 200 } })
    );
    
    // State should be unchanged
    expect(state.balls[0].position).toEqual(initialState.balls[0].position);
  });

  it('should ignore velocity updates for non-existent ball IDs', () => {
    const initialState: BallState = ballReducer(undefined, { type: 'unknown' });
    
    const state = ballReducer(
      initialState,
      setBallVelocity({ id: 99, velocity: { x: 10, y: 20 } })
    );
    
    // State should be unchanged
    expect(state.balls[0].velocity).toEqual(initialState.balls[0].velocity);
  });

  it('should ignore active updates for non-existent ball IDs', () => {
    const initialState: BallState = ballReducer(undefined, { type: 'unknown' });
    
    const state = ballReducer(
      initialState,
      setBallActive({ id: 99, active: false })
    );
    
    // State should be unchanged
    expect(state.balls[0].active).toEqual(initialState.balls[0].active);
  });
});
