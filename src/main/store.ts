import Store from 'electron-store'

export interface AppSettings {
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
}

export type QueueItemStatus = 'pending' | 'encoding' | 'complete' | 'failed'

export interface QueueItem {
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

export interface StoreSchema {
  settings: AppSettings
  queue: QueueItem[]
}

const defaults: StoreSchema = {
  settings: {
    watchDir: '',
    outputDir: '',
    preset: 'Fast 1080p30',
    maxParallel: 1,
    videoExtensions: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.ts'],
    queueExistingFiles: false,
    handbrakeCliPath: '',
    paused: false,
    customPresetPaths: [],
    outputFormat: 'm4v'
  },
  queue: []
}

export const store = new Store<StoreSchema>({ defaults })

export function getSettings(): AppSettings {
  return { ...defaults.settings, ...store.get('settings') }
}

export function saveSettings(settings: AppSettings): void {
  store.set('settings', settings)
}

export function getQueue(): QueueItem[] {
  return store.get('queue')
}

export function updateQueueItem(id: string, updates: Partial<QueueItem>): void {
  const queue = getQueue()
  const index = queue.findIndex((item) => item.id === id)
  if (index !== -1) {
    queue[index] = { ...queue[index], ...updates }
    store.set('queue', queue)
  }
}

export function addQueueItem(item: QueueItem): void {
  const queue = getQueue()
  queue.push(item)
  store.set('queue', queue)
}

export function removeQueueItem(id: string): void {
  const queue = getQueue().filter((item) => item.id !== id)
  store.set('queue', queue)
}

export function clearCompletedItems(): void {
  const queue = getQueue().filter((item) => item.status !== 'complete')
  store.set('queue', queue)
}
