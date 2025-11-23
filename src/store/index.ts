import { configureStore } from '@reduxjs/toolkit';
import tableReducer from './tableSlice';
import ballReducer from './ballSlice';

export const store = configureStore({
  reducer: {
    table: tableReducer,
    balls: ballReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
