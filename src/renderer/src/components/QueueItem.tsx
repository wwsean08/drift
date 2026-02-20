interface QueueItemData {
  id: string
  fileName: string
  status: 'pending' | 'encoding' | 'complete' | 'failed'
  progress: number
  eta: string
  error?: string
}

interface QueueItemProps {
  item: QueueItemData
  index: number
  onRemove: (id: string) => void
  onRetry: (id: string) => void
}

const statusColors: Record<string, string> = {
  pending: 'var(--color-text-tertiary)',
  encoding: 'var(--color-accent)',
  complete: 'var(--color-success)',
  failed: 'var(--color-error)'
}

function QueueItem({ item, index, onRemove, onRetry }: QueueItemProps): React.JSX.Element {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        backgroundColor: index % 2 === 0 ? 'var(--color-bg)' : 'var(--color-bg-secondary)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontWeight: 500,
            fontSize: '14px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1
          }}
        >
          {item.fileName}
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '12px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '9999px',
              color: '#fff',
              backgroundColor: statusColors[item.status]
            }}
          >
            {item.status}
          </span>
          {item.status === 'failed' && (
            <button onClick={() => onRetry(item.id)} style={buttonStyle}>
              Retry
            </button>
          )}
          <button
            onClick={() => onRemove(item.id)}
            style={{ ...buttonStyle, color: 'var(--color-error)' }}
          >
            Remove
          </button>
        </div>
      </div>

      {item.status === 'encoding' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              flex: 1,
              height: '6px',
              backgroundColor: 'var(--color-border)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${item.progress}%`,
                height: '100%',
                backgroundColor: 'var(--color-accent)',
                borderRadius: '3px',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              minWidth: '80px',
              textAlign: 'right'
            }}
          >
            {Math.round(item.progress)}%{item.eta ? ` - ${item.eta}` : ''}
          </span>
        </div>
      )}

      {item.status === 'failed' && item.error && (
        <span style={{ fontSize: '12px', color: 'var(--color-error)' }}>{item.error}</span>
      )}
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--color-border-input)',
  borderRadius: '4px',
  padding: '2px 8px',
  fontSize: '12px',
  cursor: 'pointer',
  color: 'var(--color-text-secondary)'
}

export default QueueItem
