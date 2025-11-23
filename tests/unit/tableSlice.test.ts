import { describe, it, expect } from 'vitest';
import tableReducer, {
  setDimensions,
  TableState,
  TableDimensions,
} from '../../src/store/tableSlice';

describe('tableSlice', () => {
  it('should return the initial state', () => {
    const state = tableReducer(undefined, { type: 'unknown' });
    expect(state).toEqual({
      dimensions: {
        width: 1000,
        height: 500,
        pocketRadius: 25,
        railWidth: 40,
      },
    });
  });

  it('should handle setDimensions', () => {
    const initialState: TableState = {
      dimensions: {
        width: 1000,
        height: 500,
        pocketRadius: 25,
        railWidth: 40,
      },
    };

    const newDimensions: TableDimensions = {
      width: 800,
      height: 400,
      pocketRadius: 20,
      railWidth: 35,
    };

    const state = tableReducer(initialState, setDimensions(newDimensions));

    expect(state.dimensions).toEqual(newDimensions);
    expect(state.dimensions.width).toBe(800);
    expect(state.dimensions.height).toBe(400);
    expect(state.dimensions.pocketRadius).toBe(20);
    expect(state.dimensions.railWidth).toBe(35);
  });

  it('should not mutate the previous state', () => {
    const initialState: TableState = {
      dimensions: {
        width: 1000,
        height: 500,
        pocketRadius: 25,
        railWidth: 40,
      },
    };

    const newDimensions: TableDimensions = {
      width: 800,
      height: 400,
      pocketRadius: 20,
      railWidth: 35,
    };

    const originalDimensions = { ...initialState.dimensions };
    tableReducer(initialState, setDimensions(newDimensions));

    // Original state should be unchanged
    expect(initialState.dimensions).toEqual(originalDimensions);
  });

  it('should handle multiple dimension updates', () => {
    let state = tableReducer(undefined, { type: 'unknown' });

    const dimensions1: TableDimensions = {
      width: 800,
      height: 400,
      pocketRadius: 20,
      railWidth: 35,
    };

    state = tableReducer(state, setDimensions(dimensions1));
    expect(state.dimensions).toEqual(dimensions1);

    const dimensions2: TableDimensions = {
      width: 1200,
      height: 600,
      pocketRadius: 30,
      railWidth: 50,
    };

    state = tableReducer(state, setDimensions(dimensions2));
    expect(state.dimensions).toEqual(dimensions2);
  });
});
