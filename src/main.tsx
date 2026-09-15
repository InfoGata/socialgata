import { runPendingAppDataReset } from "./lib/reset-app-data";

// The entry does nothing but this, and the app is imported only afterwards.
// A reset has to happen before the store module is evaluated: persistStore
// reads the persisted state out of localStorage as soon as store.ts is
// imported, and writes it straight back after the reset removed it. The
// databases likewise can only be deleted while nothing holds a connection to
// them. Static imports are evaluated before any code in the importing module
// runs -- so awaiting the reset at the top of a module that also imports the
// store is already too late. Hence the dynamic import.
//
// The app loads whatever happens: a reset must never be what stops it booting.
runPendingAppDataReset()
  .catch(() => {})
  .finally(() => import("./app"));
