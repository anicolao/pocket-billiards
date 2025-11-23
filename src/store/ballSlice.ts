import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type BallType = 'cue' | 'solid' | 'stripe' | 'eight';

export interface Ball {
  id: number;           // Ball number (0 = cue ball, 1-15 = object balls)
  type: BallType;       // Ball type
  position: { x: number; y: number };  // Position on playing surface
  velocity: { x: number; y: number };  // Current velocity
  active: boolean;      // Whether ball is on table (false if pocketed)
  radius: number;       // Ball radius
}

export interface BallState {
  balls: Ball[];
}

// Standard ball radius for pool balls
const BALL_RADIUS = 11.25; // Half of 2.25" diameter in table units

// Foot spot is 3/4 down the table from the head
const createInitialBalls = (tableWidth: number, tableHeight: number): Ball[] => {
  const footSpotX = tableWidth * 0.75;
  const footSpotY = tableHeight * 0.5;

  // For MVP, just create a cue ball at the foot spot
  return [
    {
      id: 0,
      type: 'cue',
      position: { x: footSpotX, y: footSpotY },
      velocity: { x: 0, y: 0 },
      active: true,
      radius: BALL_RADIUS,
    },
  ];
};

const initialState: BallState = {
  balls: createInitialBalls(1000, 500), // Default table dimensions
};

const ballSlice = createSlice({
  name: 'balls',
  initialState,
  reducers: {
    setBallPosition: (
      state,
      action: PayloadAction<{ id: number; position: { x: number; y: number } }>
    ) => {
      const ball = state.balls.find((b) => b.id === action.payload.id);
      if (ball) {
        ball.position = action.payload.position;
      }
    },
    setBallVelocity: (
      state,
      action: PayloadAction<{ id: number; velocity: { x: number; y: number } }>
    ) => {
      const ball = state.balls.find((b) => b.id === action.payload.id);
      if (ball) {
        ball.velocity = action.payload.velocity;
      }
    },
    setBallActive: (
      state,
      action: PayloadAction<{ id: number; active: boolean }>
    ) => {
      const ball = state.balls.find((b) => b.id === action.payload.id);
      if (ball) {
        ball.active = action.payload.active;
      }
    },
    initializeBalls: (
      state,
      action: PayloadAction<{ tableWidth: number; tableHeight: number }>
    ) => {
      const { tableWidth, tableHeight } = action.payload;
      state.balls = createInitialBalls(tableWidth, tableHeight);
    },
  },
});

export const {
  setBallPosition,
  setBallVelocity,
  setBallActive,
  initializeBalls,
} = ballSlice.actions;

export default ballSlice.reducer;
