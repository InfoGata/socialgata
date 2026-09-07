import { PayloadAction } from "@reduxjs/toolkit";

import { createSlice } from "@reduxjs/toolkit";

interface CloudSyncSettings {
  enabled: boolean;
  autoSync: boolean;
  syncIntervalSeconds: number;
  pluginId?: string;
}

/**
 * What to do with a post or community marked adult. Defaults to `warn`:
 * omitting them outright makes a feed look broken rather than filtered, and a
 * per-item reveal is a better answer than making someone flip a global switch
 * to see one thing.
 */
export type NsfwDisplay = "hide" | "warn" | "show";

export interface UiState {
  isNavigationMenuOpen: boolean;
  cloudSync: CloudSyncSettings;
  disableAutoUpdatePlugins: boolean;
  nsfwDisplay: NsfwDisplay;
}

export const initialState: UiState = {
  isNavigationMenuOpen: false,
  cloudSync: {
    enabled: false,
    autoSync: true,
    syncIntervalSeconds: 30,
  },
  disableAutoUpdatePlugins: false,
  nsfwDisplay: "warn",
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
    },
    setDisableAutoUpdatePlugins: (state, action: PayloadAction<boolean>) => {
      state.disableAutoUpdatePlugins = action.payload;
    },
    setNsfwDisplay: (state, action: PayloadAction<NsfwDisplay>) => {
      state.nsfwDisplay = action.payload;
    }
  }
})

export const {
  setIsNavigationMenuOpen,
  setCloudSyncEnabled,
  setCloudSyncAutoSync,
  setCloudSyncInterval,
  setCloudSyncPluginProvider,
  disconnectCloudSync,
  setDisableAutoUpdatePlugins,
  setNsfwDisplay
} = uiSlice.actions;
export default uiSlice.reducer;