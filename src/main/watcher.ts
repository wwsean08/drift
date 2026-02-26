import { watch, FSWatcher } from 'chokidar'
import path from 'path'
import { getSettings, getQueue, addQueueItem, QueueItem } from './store'

let watcher: FSWatcher | null = null
let onFileAdded: ((item: QueueItem) => void) | null = null
let onWatcherError: ((message: string) => void) | null = null

export function setOnFileAdded(callback: (item: QueueItem) => void): void {
  onFileAdded = callback
}

export function setOnWatcherError(callback: (message: string) => void): void {
  onWatcherError = callback
}

export function startWatcher(): void {
  stopWatcher()

  const settings = getSettings()
  if (!settings.watchDir) return

  const extensions = settings.videoExtensions.map((ext) => (ext.startsWith('.') ? ext : `.${ext}`))

  watcher = watch(settings.watchDir, {
    ignoreInitial: !settings.queueExistingFiles,
    depth: 0,
    awaitWriteFinish: {
      stabilityThreshold: 2000
    }
  })

  watcher.on('add', (filePath: string) => {
    const ext = path.extname(filePath).toLowerCase()
    if (!extensions.includes(ext)) return

    const queue = getQueue()
    if (queue.some((item) => item.filePath === filePath)) return

    const item: QueueItem = {
      id: crypto.randomUUID(),
      filePath,
      fileName: path.basename(filePath),
      status: 'pending',
      progress: 0,
      eta: '',
      addedAt: Date.now()
    }

    addQueueItem(item)

    if (onFileAdded) {
      onFileAdded(item)
    }
  })

  watcher.on('error', (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    onWatcherError?.(
      `Watch directory error: ${message}. Check that "${settings.watchDir}" exists and is accessible.`
    )
  })
}

export function stopWatcher(): void {
  if (watcher) {
    watcher.close()
    watcher = null
  }
}
