import { combineReducers } from '@reduxjs/toolkit';
import { baseApiReducer } from '@services/api';
import { pokemonQueryReducer } from '@services/pokemon';
import { authReducer, settingsReducer } from '@slices/index';
import cartReducer from '@/slices/cart-slice';

const rootReducer = combineReducers({
  auth: authReducer,
  settings: settingsReducer,
  cart: cartReducer,
  ...baseApiReducer,
  ...pokemonQueryReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
