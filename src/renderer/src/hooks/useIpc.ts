import { useState, useEffect, useCallback } from 'react'

export function useQueue(): {
  queue: QueueItem[]
  loading: boolean
  paused: boolean
  removeItem: (id: string) => Promise<void>
  retryItem: (id: string) => Promise<void>
  cancelItem: (id: string) => Promise<void>
  clearCompleted: () => Promise<void>
  togglePause: () => Promise<void>
  reorderQueue: (ids: string[]) => Promise<void>
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

    const cleanupPaused = window.api.onPausedUpdated((newPaused) => {
      setPaused(newPaused)
    })

    return () => {
      cleanupUpdated()
      cleanupProgress()
      cleanupPaused()
    }
  }, [])

  const removeItem = useCallback(async (id: string) => {
    await window.api.removeItem(id)
  }, [])

  const retryItem = useCallback(async (id: string) => {
    await window.api.retryItem(id)
  }, [])

  const cancelItem = useCallback(async (id: string) => {
    await window.api.cancelItem(id)
  }, [])

  const clearCompleted = useCallback(async () => {
    await window.api.clearCompleted()
  }, [])

  const togglePause = useCallback(async () => {
    const newPaused = await window.api.setPaused(!paused)
    setPaused(newPaused)
  }, [paused])

  const reorderQueue = useCallback(async (ids: string[]) => {
    await window.api.reorderQueue(ids)
  }, [])

  return {
    queue,
    loading,
    paused,
    removeItem,
    retryItem,
    cancelItem,
    clearCompleted,
    togglePause,
    reorderQueue
  }
}
