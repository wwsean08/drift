import { ElectronAPI } from '@electron-toolkit/preload'

interface AppSettings {
  watchDir: string
  outputDir: string
  preset: string
  maxParallel: number
  videoExtensions: string[]
  queueExistingFiles: boolean
  handbrakeCliPath: string
  paused: boolean
  customPresetPaths: string[]
  outputFormat: 'm4v' | 'mp4' | 'mkv' | 'webm'
  theme: 'system' | 'light' | 'dark'
}

type QueueItemStatus = 'pending' | 'encoding' | 'complete' | 'failed' | 'cancelled'

interface MediaInfo {
  width: number
  height: number
  duration: string
  videoCodec: string
  audioTracks: string[]
  subtitleCount: number
  fileSize: number
}

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
  outputFilePath?: string
  mediaInfo?: MediaInfo | null
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
  cancelItem: (id: string) => Promise<boolean>
  clearCompleted: () => Promise<boolean>
  reorderQueue: (ids: string[]) => Promise<boolean>
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
  setThemePreview: (theme: 'system' | 'light' | 'dark') => Promise<void>
  copyToClipboard: (text: string) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: DriftAPI
  }
}
