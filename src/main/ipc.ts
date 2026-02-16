import { ipcMain, dialog, BrowserWindow } from 'electron'
import { execFile } from 'child_process'
import { readFileSync } from 'fs'
import { getSettings, saveSettings, getQueue, AppSettings } from './store'
import { startWatcher } from './watcher'
import {
  processQueue,
  setPaused,
  handleRemoveItem,
  handleRetryItem,
  handleClearCompleted
} from './queue'

interface PresetEntry {
  category: string
  name: string
}

function parseCustomPresetFile(filePath: string): PresetEntry[] {
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'))
    const presetList = data?.PresetList
    if (!Array.isArray(presetList)) return []
    return presetList
      .filter((p: Record<string, unknown>) => typeof p.PresetName === 'string')
      .map((p: Record<string, unknown>) => ({ category: 'Custom', name: p.PresetName as string }))
  } catch {
    return []
  }
}

function getCustomPresets(): PresetEntry[] {
  const settings = getSettings()
  const presets: PresetEntry[] = []
  for (const filePath of settings.customPresetPaths || []) {
    presets.push(...parseCustomPresetFile(filePath))
  }
  return presets
}

function parsePresetList(output: string): PresetEntry[] {
  const presets: PresetEntry[] = []
  let currentCategory = ''

  for (const line of output.split('\n')) {
    // Category lines: no leading whitespace, end with /
    if (/^\S/.test(line) && line.trim().endsWith('/')) {
      currentCategory = line.trim().replace(/\/$/, '')
    } else if (/^ {4}\S/.test(line) && currentCategory) {
      presets.push({ category: currentCategory, name: line.trim() })
    }
  }

  return presets
}

export function registerIpcHandlers(): void {
  ipcMain.handle('settings:get', () => {
    return getSettings()
  })

  ipcMain.handle('settings:save', (_event, settings: AppSettings) => {
    const oldSettings = getSettings()
    saveSettings(settings)

    if (
      oldSettings.watchDir !== settings.watchDir ||
      oldSettings.queueExistingFiles !== settings.queueExistingFiles
    ) {
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

  ipcMain.handle(
    'dialog:selectFile',
    async (_event, filters?: { name: string; extensions: string[] }[]) => {
      const window = BrowserWindow.getFocusedWindow()
      if (!window) return null

      const result = await dialog.showOpenDialog(window, {
        properties: ['openFile'],
        filters: filters || []
      })

      if (result.canceled || result.filePaths.length === 0) return null
      return result.filePaths[0]
    }
  )

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

  ipcMain.handle('queue:getPaused', () => {
    return getSettings().paused
  })

  ipcMain.handle('queue:setPaused', (_event, paused: boolean) => {
    setPaused(paused)
    return paused
  })

  ipcMain.handle('queue:clearCompleted', () => {
    handleClearCompleted()
    return true
  })

  ipcMain.handle('presets:get', async (): Promise<PresetEntry[]> => {
    const settings = getSettings()
    const cliPath = settings.handbrakeCliPath || 'HandBrakeCLI'

    const custom = getCustomPresets()

    const builtIn: PresetEntry[] = await new Promise((resolve) => {
      execFile(cliPath, ['--preset-list'], { timeout: 10000 }, (error, _stdout, stderr) => {
        if (error && !stderr) {
          resolve([])
          return
        }
        resolve(parsePresetList(stderr))
      })
    })

    return [...custom, ...builtIn]
  })

  ipcMain.handle('presets:importCustom', async (): Promise<PresetEntry[]> => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return []

    const result = await dialog.showOpenDialog(window, {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'HandBrake Preset', extensions: ['json'] }]
    })

    if (result.canceled || result.filePaths.length === 0) return []

    const settings = getSettings()
    const paths = new Set(settings.customPresetPaths || [])
    for (const p of result.filePaths) {
      paths.add(p)
    }
    saveSettings({ ...settings, customPresetPaths: [...paths] })

    return getCustomPresets()
  })

  ipcMain.handle(
    'presets:removeCustom',
    (_event, filePath: string): PresetEntry[] => {
      const settings = getSettings()
      saveSettings({
        ...settings,
        customPresetPaths: (settings.customPresetPaths || []).filter((p) => p !== filePath)
      })
      return getCustomPresets()
    }
  )
}
