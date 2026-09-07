import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import type { PersistConfig } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./reducers/authSlice";
import uiReducer, { type UiState } from "./reducers/uiSlice";

/**
 * Every ui preference that should survive a reload. A key missing from here
 * doesn't fail loudly — it silently resets to its default on every load, which
 * looks like the setting working right up until the page is refreshed.
 * Exported so a test can hold it against UiState.
 */
export const uiPersistWhitelist = [
  "cloudSync",
  "disableAutoUpdatePlugins",
  "nsfwDisplay",
] as const;

const uiPersistConfig: PersistConfig<UiState> = {
  key: "ui",
  storage,
  whitelist: [...uiPersistWhitelist],
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: persistReducer(uiPersistConfig, uiReducer) as unknown as typeof uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
