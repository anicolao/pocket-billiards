import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PhysicsState {
  isRunning: boolean;        // Whether simulation is active
  lastUpdateTime: number;    // Timestamp of last physics update
  accumulatedTime: number;   // Time accumulated for fixed timestep
}

const initialState: PhysicsState = {
  isRunning: false,
  lastUpdateTime: 0,
  accumulatedTime: 0,
};

const physicsSlice = createSlice({
  name: 'physics',
  initialState,
  reducers: {
    setPhysicsRunning: (state, action: PayloadAction<boolean>) => {
      state.isRunning = action.payload;
    },
    setLastUpdateTime: (state, action: PayloadAction<number>) => {
      state.lastUpdateTime = action.payload;
    },
    setAccumulatedTime: (state, action: PayloadAction<number>) => {
      state.accumulatedTime = action.payload;
    },
    resetPhysics: (state) => {
      state.isRunning = false;
      state.lastUpdateTime = 0;
      state.accumulatedTime = 0;
    },
  },
});

export const {
  setPhysicsRunning,
  setLastUpdateTime,
  setAccumulatedTime,
  resetPhysics,
} = physicsSlice.actions;

export default physicsSlice.reducer;
