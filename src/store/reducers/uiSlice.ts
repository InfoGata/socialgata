import { PayloadAction } from "@reduxjs/toolkit";

import { createSlice } from "@reduxjs/toolkit";

interface CloudSyncSettings {
  enabled: boolean;
  autoSync: boolean;
  syncIntervalSeconds: number;
  pluginId?: string;
}

interface UiState {
  isNavigationMenuOpen: boolean;
  cloudSync: CloudSyncSettings;
}

const initialState: UiState = {
  isNavigationMenuOpen: false,
  cloudSync: {
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
    setCloudSyncEnabled: (state, action: PayloadAction<boolean>) => {
      state.cloudSync.enabled = action.payload;
    },
    setCloudSyncAutoSync: (state, action: PayloadAction<boolean>) => {
      state.cloudSync.autoSync = action.payload;
    },
    setCloudSyncInterval: (state, action: PayloadAction<number>) => {
      state.cloudSync.syncIntervalSeconds = action.payload;
    },
    setCloudSyncPluginProvider: (state, action: PayloadAction<{ pluginId: string }>) => {
      state.cloudSync.pluginId = action.payload.pluginId;
    },
    disconnectCloudSync: (state) => {
      state.cloudSync.enabled = false;
      state.cloudSync.pluginId = undefined;
    }
  }
})

export const {
  setIsNavigationMenuOpen,
  setCloudSyncEnabled,
  setCloudSyncAutoSync,
  setCloudSyncInterval,
  setCloudSyncPluginProvider,
  disconnectCloudSync
} = uiSlice.actions;
export default uiSlice.reducer;