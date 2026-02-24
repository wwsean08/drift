import { useState } from 'react'
import { Copy, Trash2, RotateCcw, ChevronRight, ChevronDown } from 'lucide-react'

interface MediaInfo {
  width: number
  height: number
  duration: string
  videoCodec: string
  audioTracks: string[]
  subtitleCount: number
  fileSize: number
}

interface QueueItemData {
  id: string
  fileName: string
  status: 'pending' | 'encoding' | 'complete' | 'failed'
  progress: number
  eta: string
  error?: string
  outputFilePath?: string
  mediaInfo?: MediaInfo | null
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

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`
  if (bytes >= 1_000_000) return `${Math.round(bytes / 1_000_000)} MB`
  return `${Math.round(bytes / 1_000)} KB`
}

function QueueItem({ item, index, onRemove, onRetry }: QueueItemProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)

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
            <button title="Retry" onClick={() => onRetry(item.id)} style={buttonStyle}>
              <RotateCcw size={14} />
            </button>
          )}
          {item.status === 'complete' && item.outputFilePath && (
            <button
              title="Copy output path"
              onClick={() => window.api.copyToClipboard(item.outputFilePath!)}
              style={buttonStyle}
            >
              <Copy size={14} />
            </button>
          )}
          <button
            title="Remove"
            onClick={() => onRemove(item.id)}
            style={{ ...buttonStyle, color: 'var(--color-error)' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {item.mediaInfo === undefined &&
        (item.status === 'pending' || item.status === 'encoding') && (
          <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Scanning…</span>
        )}

      {item.mediaInfo != null && (
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setExpanded(!expanded)}
        >
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {item.mediaInfo.width}×{item.mediaInfo.height} · {item.mediaInfo.duration}
            {item.mediaInfo.videoCodec ? ` · ${item.mediaInfo.videoCodec}` : ''}
          </span>
          {expanded ? (
            <ChevronDown
              size={14}
              style={{ marginLeft: '4px', color: 'var(--color-text-tertiary)', flexShrink: 0 }}
            />
          ) : (
            <ChevronRight
              size={14}
              style={{ marginLeft: '4px', color: 'var(--color-text-tertiary)', flexShrink: 0 }}
            />
          )}
        </div>
      )}

      {expanded && item.mediaInfo != null && (
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {'Audio: '}
          {item.mediaInfo.audioTracks.length > 0 ? item.mediaInfo.audioTracks.join(' · ') : '—'}
          {'   Subtitles: '}
          {item.mediaInfo.subtitleCount}
          {'   Size: '}
          {formatFileSize(item.mediaInfo.fileSize)}
        </span>
      )}

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
  padding: '4px',
  cursor: 'pointer',
  color: 'var(--color-text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 0
}

export default QueueItem
