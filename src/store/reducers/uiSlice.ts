import { PayloadAction } from "@reduxjs/toolkit";

import { createSlice } from "@reduxjs/toolkit";

interface UiState {
  isNavigationMenuOpen: boolean;
}

const initialState: UiState = {
  isNavigationMenuOpen: false
}

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setIsNavigationMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isNavigationMenuOpen = action.payload;
    }
  }
})

export const { setIsNavigationMenuOpen } = uiSlice.actions;
export default uiSlice.reducer;