import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerIpcHandlers, checkHandBrakeCLI } from './ipc'
import { recoverFromCrash, processQueue, setMainWindow } from './queue'
import { createTray, getIsQuitting } from './tray'
import { startWatcher, setOnFileAdded } from './watcher'
import { getSettings, getQueue } from './store'

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('close', (event) => {
    if (!getIsQuitting()) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.drift.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  recoverFromCrash()

  const mainWindow = createWindow()
  registerIpcHandlers(mainWindow)
  setMainWindow(mainWindow)

  createTray(mainWindow)

  setOnFileAdded(() => {
    mainWindow.webContents.send('queue:updated', getQueue())
    processQueue()
  })

  const settings = getSettings()
  if (settings.watchDir) {
    startWatcher()
  }

  processQueue()

  const hasHandBrake = await checkHandBrakeCLI(settings.handbrakeCliPath || undefined)
  if (!hasHandBrake) {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.send(
        'app:error',
        'HandBrakeCLI not found. Please install HandBrake and ensure HandBrakeCLI is in your PATH, or set a custom path in Settings.'
      )
    })
  }

  app.on('activate', () => {
    mainWindow.show()
    mainWindow.focus()
  })
})

app.on('window-all-closed', () => {
  // Do nothing - keep app alive in tray
})
