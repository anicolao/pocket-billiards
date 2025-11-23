import { describe, it, expect } from 'vitest';
import { store } from '../../src/store';

describe('store', () => {
  it('should be configured with table and balls reducers', () => {
    const state = store.getState();
    
    // Verify the store has the expected structure
    expect(state).toHaveProperty('table');
    expect(state).toHaveProperty('balls');
    
    // Verify table state is initialized
    expect(state.table.dimensions).toBeDefined();
    expect(state.table.dimensions.width).toBe(1000);
    expect(state.table.dimensions.height).toBe(500);
    
    // Verify balls state is initialized
    expect(state.balls.balls).toBeDefined();
    expect(state.balls.balls).toHaveLength(1);
    expect(state.balls.balls[0].type).toBe('cue');
  });
});
