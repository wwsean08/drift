import { useQueue } from '../hooks/useIpc'
import QueueItem from './QueueItem'

function QueueView(): React.JSX.Element {
  const { queue, loading, paused, removeItem, retryItem, clearCompleted, togglePause } = useQueue()

  const hasCompleted = queue.some((item) => item.status === 'complete')

  if (loading) {
    return <div style={{ padding: '24px', color: '#6b7280' }}>Loading queue...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '14px' }}>
          Queue ({queue.length} item{queue.length !== 1 ? 's' : ''})
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={togglePause}
            style={{
              background: 'none',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              padding: '4px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              color: '#374151'
            }}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          {hasCompleted && (
            <button
              onClick={clearCompleted}
              style={{
                background: 'none',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                color: '#374151'
              }}
            >
              Clear Completed
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {queue.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: '14px' }}>No items in queue</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>
              Configure a watch directory in Settings and drop video files in it
            </p>
          </div>
        ) : (
          queue.map((item) => (
            <QueueItem key={item.id} item={item} onRemove={removeItem} onRetry={retryItem} />
          ))
        )}
      </div>
    </div>
  )
}

export default QueueView
