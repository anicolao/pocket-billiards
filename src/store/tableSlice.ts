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
  // Side pockets: offset by 0.5 * radius to get ~1/4 area on table
  const sideInset = pocketRadius * 0.5;
  
  // Corner pockets: need smaller offset since they're diagonal
  // Using ~0.3 * radius to keep more area on the table
  const cornerInset = pocketRadius * 0.3;
  
  // Note: width=1000, height=500, so width > height
  // Long edges are TOP and BOTTOM (along the width)
  // Short edges are LEFT and RIGHT (along the height)
  
  return [
    // Four corner pockets
    // Top-left corner
    { x: -cornerInset, y: -cornerInset, radius: pocketRadius },
    // Top-right corner
    { x: width + cornerInset, y: -cornerInset, radius: pocketRadius },
    // Bottom-left corner
    { x: -cornerInset, y: height + cornerInset, radius: pocketRadius },
    // Bottom-right corner
    { x: width + cornerInset, y: height + cornerInset, radius: pocketRadius },
    
    // Two side pockets on the LONG edges (top and bottom)
    // Middle-top (on top long edge)
    { x: width / 2, y: -sideInset, radius: pocketRadius },
    // Middle-bottom (on bottom long edge)
    { x: width / 2, y: height + sideInset, radius: pocketRadius },
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
