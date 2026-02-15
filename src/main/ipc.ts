import { ipcMain, dialog, BrowserWindow } from 'electron'
import { getSettings, saveSettings, getQueue, AppSettings } from './store'
import { startWatcher } from './watcher'
import { processQueue, handleRemoveItem, handleRetryItem, handleClearCompleted } from './queue'

export function registerIpcHandlers(): void {
  ipcMain.handle('settings:get', () => {
    return getSettings()
  })

  ipcMain.handle('settings:save', (_event, settings: AppSettings) => {
    const oldSettings = getSettings()
    saveSettings(settings)

    if (oldSettings.watchDir !== settings.watchDir || oldSettings.queueExistingFiles !== settings.queueExistingFiles) {
      startWatcher()
    }

    if (oldSettings.maxParallel !== settings.maxParallel) {
      processQueue()
    }

    return true
  })

  ipcMain.handle('dialog:selectDirectory', async () => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return null

    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory', 'createDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('dialog:selectFile', async (_event, filters?: { name: string; extensions: string[] }[]) => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return null

    const result = await dialog.showOpenDialog(window, {
      properties: ['openFile'],
      filters: filters || []
    })

    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('queue:get', () => {
    return getQueue()
  })

  ipcMain.handle('queue:remove', (_event, id: string) => {
    handleRemoveItem(id)
    return true
  })

  ipcMain.handle('queue:retry', (_event, id: string) => {
    handleRetryItem(id)
    return true
  })

  ipcMain.handle('queue:clearCompleted', () => {
    handleClearCompleted()
    return true
  })
}
