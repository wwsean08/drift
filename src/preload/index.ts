import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: unknown) => ipcRenderer.invoke('settings:save', settings),
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  selectFile: (filters?: { name: string; extensions: string[] }[]) =>
    ipcRenderer.invoke('dialog:selectFile', filters),
  getQueue: () => ipcRenderer.invoke('queue:get'),
  removeItem: (id: string) => ipcRenderer.invoke('queue:remove', id),
  retryItem: (id: string) => ipcRenderer.invoke('queue:retry', id),
  clearCompleted: () => ipcRenderer.invoke('queue:clearCompleted'),
  getPaused: () => ipcRenderer.invoke('queue:getPaused'),
  setPaused: (paused: boolean) => ipcRenderer.invoke('queue:setPaused', paused),
  getPresets: () => ipcRenderer.invoke('presets:get'),
  importCustomPreset: () => ipcRenderer.invoke('presets:importCustom'),
  removeCustomPreset: (filePath: string) => ipcRenderer.invoke('presets:removeCustom', filePath),

  onQueueUpdated: (callback: (queue: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, queue: unknown): void => callback(queue)
    ipcRenderer.on('queue:updated', handler)
    return () => ipcRenderer.removeListener('queue:updated', handler)
  },

  onQueueProgress: (callback: (data: { id: string; progress: number; eta: string }) => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      data: { id: string; progress: number; eta: string }
    ): void => callback(data)
    ipcRenderer.on('queue:progress', handler)
    return () => ipcRenderer.removeListener('queue:progress', handler)
  },

  onPausedUpdated: (callback: (paused: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, paused: boolean): void => callback(paused)
    ipcRenderer.on('paused:updated', handler)
    return () => ipcRenderer.removeListener('paused:updated', handler)
  },

  onAppError: (callback: (message: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, message: string): void => callback(message)
    ipcRenderer.on('app:error', handler)
    return () => ipcRenderer.removeListener('app:error', handler)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
