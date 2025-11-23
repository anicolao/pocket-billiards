import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Pocket {
  x: number;
  y: number;
  radius: number;
}

export interface TableDimensions {
  width: number;
  height: number;
  pocketRadius: number;
  railWidth: number;
  pockets: Pocket[];
}

export interface TableState {
  dimensions: TableDimensions;
}

// Standard pool table proportions (9-foot table)
// Playing surface is 100" x 50" (2:1 ratio)
// Pocket positions are relative to the playing surface origin (top-left of felt)
const createPockets = (
  width: number,
  height: number,
  pocketRadius: number
): Pocket[] => {
  // Corner pockets are inset slightly from corners
  // Side pockets are at the midpoint of the long edges
  // Pockets intrude at most 1/4 of their radius into the playing surface
  const cornerInset = pocketRadius * 0.75; // 3/4 of radius stays outside
  
  return [
    // Top-left corner
    { x: -cornerInset, y: -cornerInset, radius: pocketRadius },
    // Top-right corner
    { x: width + cornerInset, y: -cornerInset, radius: pocketRadius },
    // Bottom-left corner
    { x: -cornerInset, y: height + cornerInset, radius: pocketRadius },
    // Bottom-right corner
    { x: width + cornerInset, y: height + cornerInset, radius: pocketRadius },
    // Middle-left (on long edge)
    { x: -cornerInset, y: height / 2, radius: pocketRadius },
    // Middle-right (on long edge)
    { x: width + cornerInset, y: height / 2, radius: pocketRadius },
  ];
};

const initialState: TableState = {
  dimensions: {
    width: 1000,
    height: 500,
    pocketRadius: 25,
    railWidth: 40,
    pockets: createPockets(1000, 500, 25),
  },
};

const tableSlice = createSlice({
  name: 'table',
  initialState,
  reducers: {
    setDimensions: (state, action: PayloadAction<Omit<TableDimensions, 'pockets'>>) => {
      const { width, height, pocketRadius, railWidth } = action.payload;
      state.dimensions = {
        width,
        height,
        pocketRadius,
        railWidth,
        pockets: createPockets(width, height, pocketRadius),
      };
    },
  },
});

export const { setDimensions } = tableSlice.actions;
export default tableSlice.reducer;
