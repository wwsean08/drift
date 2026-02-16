import { BrowserWindow } from 'electron'
import {
  getSettings,
  saveSettings,
  getQueue,
  updateQueueItem,
  removeQueueItem,
  clearCompletedItems
} from './store'
import { startEncode, cancelEncode, getActiveJobCount } from './encoder'

let mainWindow: BrowserWindow | null = null

export function setMainWindow(win: BrowserWindow): void {
  mainWindow = win
}

function sendToRenderer(channel: string, data: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data)
  }
}

export function setPaused(paused: boolean): void {
  const settings = getSettings()
  saveSettings({ ...settings, paused })
  if (!paused) processQueue()
}

export function processQueue(): void {
  const settings = getSettings()
  if (settings.paused) return

  const queue = getQueue()
  const activeCount = getActiveJobCount()
  const available = settings.maxParallel - activeCount

  if (available <= 0) return

  const pending = queue.filter((item) => item.status === 'pending')
  const toStart = pending.slice(0, available)

  for (const item of toStart) {
    updateQueueItem(item.id, { status: 'encoding', progress: 0, eta: '' })
    sendToRenderer('queue:updated', getQueue())

    startEncode(
      item.id,
      item.filePath,
      settings.outputDir,
      settings.preset,
      {
        onProgress: (id, percent, eta) => {
          sendToRenderer('queue:progress', { id, progress: percent, eta })
        },
        onComplete: (id) => {
          updateQueueItem(id, {
            status: 'complete',
            progress: 100,
            eta: '',
            completedAt: Date.now()
          })
          sendToRenderer('queue:updated', getQueue())
          processQueue()
        },
        onError: (id, message) => {
          updateQueueItem(id, {
            status: 'failed',
            progress: 0,
            eta: '',
            error: message
          })
          sendToRenderer('queue:updated', getQueue())
          processQueue()
        }
      },
      settings.handbrakeCliPath || undefined
    )
  }
}

export function recoverFromCrash(): void {
  const queue = getQueue()
  for (const item of queue) {
    if (item.status === 'encoding') {
      updateQueueItem(item.id, { status: 'pending', progress: 0, eta: '' })
    }
  }
}

export function handleRemoveItem(id: string): void {
  cancelEncode(id)
  removeQueueItem(id)
  sendToRenderer('queue:updated', getQueue())
  processQueue()
}

export function handleRetryItem(id: string): void {
  updateQueueItem(id, { status: 'pending', progress: 0, eta: '', error: undefined })
  sendToRenderer('queue:updated', getQueue())
  processQueue()
}

export function handleClearCompleted(): void {
  clearCompletedItems()
  sendToRenderer('queue:updated', getQueue())
}
