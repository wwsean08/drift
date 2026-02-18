import { ElectronAPI } from '@electron-toolkit/preload'

interface AppSettings {
  watchDir: string
  outputDir: string
  preset: string
  maxParallel: number
  videoExtensions: string[]
  queueExistingFiles: boolean
  handbrakeCliPath: string
  customPresetPaths: string[]
}

type QueueItemStatus = 'pending' | 'encoding' | 'complete' | 'failed'

interface QueueItem {
  id: string
  filePath: string
  fileName: string
  status: QueueItemStatus
  progress: number
  eta: string
  error?: string
  addedAt: number
  completedAt?: number
}

interface DriftAPI {
  getAppVersion: () => Promise<string>
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: AppSettings) => Promise<boolean>
  selectDirectory: () => Promise<string | null>
  selectFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>
  getQueue: () => Promise<QueueItem[]>
  removeItem: (id: string) => Promise<boolean>
  retryItem: (id: string) => Promise<boolean>
  clearCompleted: () => Promise<boolean>
  getPaused: () => Promise<boolean>
  setPaused: (paused: boolean) => Promise<boolean>
  getPresets: () => Promise<Array<{ category: string; name: string }>>
  importCustomPreset: () => Promise<Array<{ category: string; name: string }>>
  removeCustomPreset: (filePath: string) => Promise<Array<{ category: string; name: string }>>
  onPausedUpdated: (callback: (paused: boolean) => void) => () => void
  onQueueUpdated: (callback: (queue: QueueItem[]) => void) => () => void
  onQueueProgress: (
    callback: (data: { id: string; progress: number; eta: string }) => void
  ) => () => void
  onAppError: (callback: (message: string) => void) => () => void
  onHandbrakeValid: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: DriftAPI
  }
}
