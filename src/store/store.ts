import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import type { PersistConfig } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./reducers/authSlice";
import uiReducer, { type UiState } from "./reducers/uiSlice";

const uiPersistConfig: PersistConfig<UiState> = {
  key: "ui",
  storage,
  whitelist: ["cloudSync", "disableAutoUpdatePlugins"],
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
