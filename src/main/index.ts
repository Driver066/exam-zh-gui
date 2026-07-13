import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';

import { registerAppHandlers } from './ipc/app-handlers';
import { registerDocumentHandlers } from './ipc/document-handlers';
import { registerMathPreviewHandlers } from './ipc/math-preview-handlers';

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 840,
    minHeight: 640,
    title: 'exam-zh GUI',
    backgroundColor: '#f6f3ee',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

registerAppHandlers();
registerDocumentHandlers();
registerMathPreviewHandlers();

void app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
