const { app, BrowserWindow, dialog, shell } = require("electron");
const { autoUpdater } = require("electron-updater");

let mainWindow;
let updateDialogOpen = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Кадр — архив сотрудников",
    autoHideMenuBar: true,
    webPreferences: {
      partition: "persist:kadr-employee-archive",
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.loadFile(require("path").join(__dirname, "renderer", "desktop", "index.html"));
}

async function offerUpdate(info) {
  if (!mainWindow || updateDialogOpen) return;
  updateDialogOpen = true;
  const answer = await dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "Доступно обновление",
    message: `Доступна новая версия ${info.version}`,
    detail: "Скачать обновление сейчас?",
    buttons: ["Скачать", "Позже"],
    defaultId: 0,
    cancelId: 1,
    noLink: true
  });
  updateDialogOpen = false;
  if (answer.response === 0) autoUpdater.downloadUpdate();
}

function configureUpdates() {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("update-available", offerUpdate);
  autoUpdater.on("update-downloaded", async (info) => {
    const answer = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Обновление загружено",
      message: `Версия ${info.version} готова к установке`,
      buttons: ["Установить сейчас", "При следующем запуске"],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    });
    if (answer.response === 0) autoUpdater.quitAndInstall(false, true);
  });
  autoUpdater.on("error", console.error);
  const check = () => autoUpdater.checkForUpdates().catch(console.error);
  setTimeout(check, 5000);
  setInterval(check, 30 * 60 * 1000);
}

app.whenReady().then(() => {
  createWindow();
  configureUpdates();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
