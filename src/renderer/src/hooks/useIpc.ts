import { useState, useEffect, useCallback } from 'react'

interface QueueItem {
  id: string
  filePath: string
  fileName: string
  status: 'pending' | 'encoding' | 'complete' | 'failed'
  progress: number
  eta: string
  error?: string
  addedAt: number
  completedAt?: number
}

export function useQueue(): {
  queue: QueueItem[]
  loading: boolean
  paused: boolean
  removeItem: (id: string) => Promise<void>
  retryItem: (id: string) => Promise<void>
  clearCompleted: () => Promise<void>
  togglePause: () => Promise<void>
} {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    window.api.getQueue().then((q) => {
      setQueue(q)
      setLoading(false)
    })
    window.api.getPaused().then(setPaused)

    const cleanupUpdated = window.api.onQueueUpdated((updatedQueue) => {
      setQueue(updatedQueue)
    })

    const cleanupProgress = window.api.onQueueProgress(({ id, progress, eta }) => {
      setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, progress, eta } : item)))
    })

    return () => {
      cleanupUpdated()
      cleanupProgress()
    }
  }, [])

  const removeItem = useCallback(async (id: string) => {
    await window.api.removeItem(id)
  }, [])

  const retryItem = useCallback(async (id: string) => {
    await window.api.retryItem(id)
  }, [])

  const clearCompleted = useCallback(async () => {
    await window.api.clearCompleted()
  }, [])

  const togglePause = useCallback(async () => {
    const newPaused = await window.api.setPaused(!paused)
    setPaused(newPaused)
  }, [paused])

  return { queue, loading, paused, removeItem, retryItem, clearCompleted, togglePause }
}
