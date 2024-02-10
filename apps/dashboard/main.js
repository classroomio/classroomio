// import isElectron from 'is-electron';
// import { app, BrowserWindow } from 'electron';
import electron from 'electron';
const { app, BrowserWindow } = electron;

// let fs, path;
// if (isElectron()) {
//   import('fs').then((module) => (fs = module));
//   import('path').then((module) => (path = module));
// }
app.disableHardwareAcceleration();
const isDev = () => !app.isPackaged;

function createWindow() {
  let mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // Recommended for security if your app loads remote content
    },
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const serverUrl = isDev() ? 'http://localhost:3000/' : 'http://localhost:3000/'; // replace with your production server URL
  mainWindow.loadURL(serverUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
