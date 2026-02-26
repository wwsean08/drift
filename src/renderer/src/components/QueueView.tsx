import { useState } from 'react'
import { useQueue } from '../hooks/useIpc'
import QueueItem from './QueueItem'

function QueueView(): React.JSX.Element {
  const {
    queue,
    loading,
    paused,
    removeItem,
    retryItem,
    cancelItem,
    clearCompleted,
    togglePause,
    reorderQueue
  } = useQueue()

  const [isEditingOrder, setIsEditingOrder] = useState(false)
  const [editOrder, setEditOrder] = useState<string[] | null>(null)
  const [prePausedState, setPrePausedState] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'above' | 'below' } | null>(
    null
  )

  const displayQueue =
    isEditingOrder && editOrder !== null
      ? [
          ...(editOrder
            .map((id) => queue.find((item) => item.id === id))
            .filter(Boolean) as typeof queue),
          ...queue.filter((item) => !editOrder.includes(item.id))
        ]
      : queue

  const hasCompleted = queue.some((item) => item.status === 'complete')

  const enterEditMode = (): void => {
    setPrePausedState(paused)
    setEditOrder(queue.map((item) => item.id))
    setIsEditingOrder(true)
    if (!paused) togglePause()
  }

  const saveOrder = async (): Promise<void> => {
    if (editOrder) await reorderQueue(editOrder)
    setIsEditingOrder(false)
    setEditOrder(null)
    setDraggedId(null)
    setDropTarget(null)
    if (!prePausedState) togglePause()
  }

  const cancelEditOrder = (): void => {
    setIsEditingOrder(false)
    setEditOrder(null)
    setDraggedId(null)
    setDropTarget(null)
    if (!prePausedState) togglePause()
  }

  const handleDragStart = (id: string): void => setDraggedId(id)
  const handleDragEnd = (): void => {
    setDraggedId(null)
    setDropTarget(null)
  }

  const handleDragOver = (e: React.DragEvent, id: string): void => {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDropTarget({ id, position: e.clientY < rect.top + rect.height / 2 ? 'above' : 'below' })
  }

  const handleDragLeave = (): void => setDropTarget(null)

  const handleDrop = (e: React.DragEvent, targetId: string): void => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('text/plain')
    setDraggedId(null)
    setDropTarget(null)
    if (!sourceId || sourceId === targetId || !editOrder) return

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const dropAbove = e.clientY < rect.top + rect.height / 2
    const filtered = editOrder.filter((id) => id !== sourceId)
    const targetIndex = filtered.indexOf(targetId)
    filtered.splice(dropAbove ? targetIndex : targetIndex + 1, 0, sourceId)
    setEditOrder(filtered)
  }

  const buttonStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid var(--color-border-input)',
    borderRadius: '4px',
    padding: '4px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    color: 'var(--color-text-secondary)'
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', color: 'var(--color-text-tertiary)' }}>Loading queue...</div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '14px' }}>
          Queue ({queue.length} item{queue.length !== 1 ? 's' : ''})
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isEditingOrder ? (
            <>
              <button onClick={saveOrder} style={buttonStyle}>
                Save Order
              </button>
              <button onClick={cancelEditOrder} style={buttonStyle}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={enterEditMode} style={buttonStyle}>
                Edit Order
              </button>
              <button onClick={togglePause} style={buttonStyle}>
                {paused ? 'Resume' : 'Pause'}
              </button>
              {hasCompleted && (
                <button onClick={clearCompleted} style={buttonStyle}>
                  Clear Completed
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {queue.length === 0 ? (
          <div
            style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}
          >
            <p style={{ fontSize: '14px' }}>No items in queue</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>
              Configure a watch directory in Settings and drop video files in it
            </p>
          </div>
        ) : (
          displayQueue.map((item, i) => (
            <QueueItem
              key={item.id}
              item={item}
              index={i}
              onRemove={removeItem}
              onRetry={retryItem}
              onCancel={cancelItem}
              isEditingOrder={isEditingOrder}
              isDragging={draggedId === item.id}
              dropIndicator={
                dropTarget !== null && dropTarget.id === item.id ? dropTarget.position : null
              }
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default QueueView
