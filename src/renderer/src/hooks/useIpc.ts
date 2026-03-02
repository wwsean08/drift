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

  const updateProgress = useCallback(
    ({ id, progress, eta }: { id: string; progress: number; eta: string }) => {
      setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, progress, eta } : item)))
    },
    []
  )

  useEffect(() => {
    globalThis.api.getQueue().then((q) => {
      setQueue(q)
      setLoading(false)
    })
    globalThis.api.getPaused().then(setPaused)

    const cleanupUpdated = globalThis.api.onQueueUpdated((updatedQueue) => {
      setQueue(updatedQueue)
    })

    const cleanupProgress = globalThis.api.onQueueProgress(updateProgress)

    const cleanupPaused = globalThis.api.onPausedUpdated((newPaused) => {
      setPaused(newPaused)
    })

    return () => {
      cleanupUpdated()
      cleanupProgress()
      cleanupPaused()
    }
  }, [updateProgress])

  const removeItem = useCallback(async (id: string) => {
    await globalThis.api.removeItem(id)
  }, [])

  const retryItem = useCallback(async (id: string) => {
    await globalThis.api.retryItem(id)
  }, [])

  const cancelItem = useCallback(async (id: string) => {
    await globalThis.api.cancelItem(id)
  }, [])

  const clearCompleted = useCallback(async () => {
    await globalThis.api.clearCompleted()
  }, [])

  const togglePause = useCallback(async () => {
    const newPaused = await globalThis.api.setPaused(!paused)
    setPaused(newPaused)
  }, [paused])

  const reorderQueue = useCallback(async (ids: string[]) => {
    await globalThis.api.reorderQueue(ids)
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
