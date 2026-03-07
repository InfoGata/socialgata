import { app, shell, BrowserWindow } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";

function UpsertKeyValue(
  obj: Record<string, string | string[]> | undefined,
  keyToChange: string,
  value: string[]
): void {
  const keyToChangeLower = keyToChange.toLowerCase();
  if (obj) {
    for (const key of Object.keys(obj)) {
      if (key.toLowerCase() === keyToChangeLower) {
        // Reassign header if it already exists
        obj[key] = value;
        return;
      }
    }
  }
  // Insert header if it doesn't exist
  if (obj) {
    obj[keyToChange] = value;
  }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    // Allow about:blank popups (used for OAuth login flow)
    if (details.url === "about:blank") {
      return { action: "allow" };
    }
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // CORS header injection
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      const { requestHeaders } = details;
      UpsertKeyValue(requestHeaders, "Access-Control-Allow-Origin", ["*"]);
      callback({ requestHeaders });
    }
  );

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      const { responseHeaders } = details;
      UpsertKeyValue(responseHeaders, "Access-Control-Allow-Origin", ["*"]);
      UpsertKeyValue(responseHeaders, "Access-Control-Allow-Headers", ["*"]);
      callback({
        responseHeaders,
      });
    }
  );

  // HMR
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
