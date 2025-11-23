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
  // Calculate pocket offsets based on having exactly 25% of the pocket area on the table
  
  // For a circle with a chord cutting it, the area of the circular segment is:
  // A = r² * (θ - sin(θ)) / 2, where θ is the central angle in radians
  // We want this segment area to be 25% of the total circle area (πr²)
  // So: r² * (θ - sin(θ)) / 2 = 0.25 * πr²
  // Simplifying: (θ - sin(θ)) / 2 = 0.25π
  // θ - sin(θ) = 0.5π
  
  // Solving numerically: θ ≈ 2.3099 radians
  // The distance from center to chord: d = r * cos(θ/2)
  // d ≈ r * cos(1.15495) ≈ r * 0.3927
  // So the pocket center should be at distance d from the edge
  // Offset from edge = r - d ≈ r * (1 - 0.3927) ≈ 0.607r
  
  const sideInset = pocketRadius * 0.607; // For 25% area on one side
  
  // Corner pockets have two edges cutting the circle at right angles
  // For 25% total area with two perpendicular chords through the center,
  // the pocket center should be at the corner (0 offset)
  // But we want roughly 25% total, so we use a small offset
  // With two chords at 90°, if we want ~25% on table, offset ≈ 0
  const cornerInset = 0; // Pocket center exactly at corner for ~25% area
  
  // Note: width=1000, height=500, so width > height
  // Long edges are TOP and BOTTOM (along the width)
  // Short edges are LEFT and RIGHT (along the height)
  
  return [
    // Four corner pockets - centered at corners
    // Top-left corner
    { x: cornerInset, y: cornerInset, radius: pocketRadius },
    // Top-right corner
    { x: width - cornerInset, y: cornerInset, radius: pocketRadius },
    // Bottom-left corner
    { x: cornerInset, y: height - cornerInset, radius: pocketRadius },
    // Bottom-right corner
    { x: width - cornerInset, y: height - cornerInset, radius: pocketRadius },
    
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
