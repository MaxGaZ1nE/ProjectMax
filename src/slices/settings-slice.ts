import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'en' | 'th';

export interface SettingsState {
  theme: ThemeMode;
  language: Language;
  sidebarCollapsed: boolean;
}

const initialState: SettingsState = {
  theme: 'light', // ✅ Default light mode (ignore persisted dark mode)
  language: 'en',
  sidebarCollapsed: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      // ✅ Never allow dark theme - force light only
      if (action.payload === 'dark') {
        state.theme = 'light';
      } else {
        state.theme = action.payload;
      }
    },
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
  },
});

export const { setTheme, setLanguage, toggleSidebar, setSidebarCollapsed } =
  settingsSlice.actions;
export default settingsSlice.reducer;
