import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TableDimensions {
  width: number;
  height: number;
  pocketRadius: number;
  railWidth: number;
}

export interface TableState {
  dimensions: TableDimensions;
}

// Standard pool table proportions (9-foot table)
// Playing surface is 100" x 50" (2:1 ratio)
const initialState: TableState = {
  dimensions: {
    width: 1000,
    height: 500,
    pocketRadius: 25,
    railWidth: 40,
  },
};

const tableSlice = createSlice({
  name: 'table',
  initialState,
  reducers: {
    setDimensions: (state, action: PayloadAction<TableDimensions>) => {
      state.dimensions = action.payload;
    },
  },
});

export const { setDimensions } = tableSlice.actions;
export default tableSlice.reducer;
