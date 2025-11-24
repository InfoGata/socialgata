import { PayloadAction } from "@reduxjs/toolkit";

import { createSlice } from "@reduxjs/toolkit";

export type CloudProvider = 'dropbox' | 'googledrive' | 'onedrive' | null;

interface CloudSyncSettings {
  provider: CloudProvider;
  enabled: boolean;
  autoSync: boolean;
  syncIntervalSeconds: number;
}

interface UiState {
  isNavigationMenuOpen: boolean;
  cloudSync: CloudSyncSettings;
}

const initialState: UiState = {
  isNavigationMenuOpen: false,
  cloudSync: {
    provider: null,
    enabled: false,
    autoSync: true,
    syncIntervalSeconds: 30,
  }
}

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setIsNavigationMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isNavigationMenuOpen = action.payload;
    },
    setCloudSyncProvider: (state, action: PayloadAction<CloudProvider>) => {
      state.cloudSync.provider = action.payload;
    },
    setCloudSyncEnabled: (state, action: PayloadAction<boolean>) => {
      state.cloudSync.enabled = action.payload;
    },
    setCloudSyncAutoSync: (state, action: PayloadAction<boolean>) => {
      state.cloudSync.autoSync = action.payload;
    },
    setCloudSyncInterval: (state, action: PayloadAction<number>) => {
      state.cloudSync.syncIntervalSeconds = action.payload;
    },
    disconnectCloudSync: (state) => {
      state.cloudSync.provider = null;
      state.cloudSync.enabled = false;
    }
  }
})

export const {
  setIsNavigationMenuOpen,
  setCloudSyncProvider,
  setCloudSyncEnabled,
  setCloudSyncAutoSync,
  setCloudSyncInterval,
  disconnectCloudSync
} = uiSlice.actions;
export default uiSlice.reducer;