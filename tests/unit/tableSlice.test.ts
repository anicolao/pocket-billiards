import { describe, it, expect } from 'vitest';
import tableReducer, {
  setDimensions,
  TableState,
} from '../../src/store/tableSlice';

describe('tableSlice', () => {
  it('should return the initial state', () => {
    const state = tableReducer(undefined, { type: 'unknown' });
    expect(state.dimensions.width).toBe(1000);
    expect(state.dimensions.height).toBe(500);
    expect(state.dimensions.pocketRadius).toBe(25);
    expect(state.dimensions.railWidth).toBe(40);
    expect(state.dimensions.pockets).toHaveLength(6);
    
    // Verify pocket positions
    const { pockets } = state.dimensions;
    const cornerInset = 25 * 0.75; // pocketRadius * 0.75
    
    // Corner pockets
    expect(pockets[0]).toEqual({ x: -cornerInset, y: -cornerInset, radius: 25 });
    expect(pockets[1]).toEqual({ x: 1000 + cornerInset, y: -cornerInset, radius: 25 });
    expect(pockets[2]).toEqual({ x: -cornerInset, y: 500 + cornerInset, radius: 25 });
    expect(pockets[3]).toEqual({ x: 1000 + cornerInset, y: 500 + cornerInset, radius: 25 });
    
    // Side pockets (on long edges)
    expect(pockets[4]).toEqual({ x: -cornerInset, y: 250, radius: 25 });
    expect(pockets[5]).toEqual({ x: 1000 + cornerInset, y: 250, radius: 25 });
  });

  it('should handle setDimensions', () => {
    const initialState: TableState = tableReducer(undefined, { type: 'unknown' });

    const newDimensions = {
      width: 800,
      height: 400,
      pocketRadius: 20,
      railWidth: 35,
    };

    const state = tableReducer(initialState, setDimensions(newDimensions));

    expect(state.dimensions.width).toBe(800);
    expect(state.dimensions.height).toBe(400);
    expect(state.dimensions.pocketRadius).toBe(20);
    expect(state.dimensions.railWidth).toBe(35);
    expect(state.dimensions.pockets).toHaveLength(6);
    
    // Verify pockets were recalculated
    const cornerInset = 20 * 0.75;
    expect(state.dimensions.pockets[0]).toEqual({ x: -cornerInset, y: -cornerInset, radius: 20 });
    expect(state.dimensions.pockets[1]).toEqual({ x: 800 + cornerInset, y: -cornerInset, radius: 20 });
  });

  it('should not mutate the previous state', () => {
    const initialState: TableState = tableReducer(undefined, { type: 'unknown' });

    const newDimensions = {
      width: 800,
      height: 400,
      pocketRadius: 20,
      railWidth: 35,
    };

    const originalWidth = initialState.dimensions.width;
    const originalPockets = initialState.dimensions.pockets;
    
    tableReducer(initialState, setDimensions(newDimensions));

    // Original state should be unchanged
    expect(initialState.dimensions.width).toBe(originalWidth);
    expect(initialState.dimensions.pockets).toBe(originalPockets);
  });

  it('should handle multiple dimension updates', () => {
    let state = tableReducer(undefined, { type: 'unknown' });

    const dimensions1 = {
      width: 800,
      height: 400,
      pocketRadius: 20,
      railWidth: 35,
    };

    state = tableReducer(state, setDimensions(dimensions1));
    expect(state.dimensions.width).toBe(800);
    expect(state.dimensions.height).toBe(400);
    expect(state.dimensions.pockets).toHaveLength(6);

    const dimensions2 = {
      width: 1200,
      height: 600,
      pocketRadius: 30,
      railWidth: 50,
    };

    state = tableReducer(state, setDimensions(dimensions2));
    expect(state.dimensions.width).toBe(1200);
    expect(state.dimensions.height).toBe(600);
    expect(state.dimensions.pockets).toHaveLength(6);
    
    // Verify pockets were recalculated for new dimensions
    const cornerInset = 30 * 0.75;
    expect(state.dimensions.pockets[0].x).toBe(-cornerInset);
    expect(state.dimensions.pockets[4].y).toBe(300); // middle of 600
  });
});
