import { useState, useEffect } from 'react'

interface AppSettings {
  watchDir: string
  outputDir: string
  preset: string
  maxParallel: number
  videoExtensions: string[]
  queueExistingFiles: boolean
  handbrakeCliPath: string
}

function SettingsView(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.getSettings().then(setSettings)
  }, [])

  const handleBrowse = async (field: 'watchDir' | 'outputDir'): Promise<void> => {
    const dir = await window.api.selectDirectory()
    if (dir && settings) {
      setSettings({ ...settings, [field]: dir })
    }
  }

  const handleSave = async (): Promise<void> => {
    if (!settings) return
    setSaving(true)
    await window.api.saveSettings(settings)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!settings) {
    return <div style={{ padding: '24px', color: '#6b7280' }}>Loading settings...</div>
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
      <FieldGroup label="Watch Directory">
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={settings.watchDir}
            onChange={(e) => setSettings({ ...settings, watchDir: e.target.value })}
            placeholder="Select a directory to watch..."
            style={inputStyle}
          />
          <button onClick={() => handleBrowse('watchDir')} style={browseButtonStyle}>
            Browse
          </button>
        </div>
      </FieldGroup>

      <FieldGroup label="Output Directory">
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={settings.outputDir}
            onChange={(e) => setSettings({ ...settings, outputDir: e.target.value })}
            placeholder="Select output directory..."
            style={inputStyle}
          />
          <button onClick={() => handleBrowse('outputDir')} style={browseButtonStyle}>
            Browse
          </button>
        </div>
      </FieldGroup>

      <FieldGroup label="HandBrakeCLI Path">
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={settings.handbrakeCliPath}
            onChange={(e) => setSettings({ ...settings, handbrakeCliPath: e.target.value })}
            placeholder="Leave empty to use system PATH"
            style={inputStyle}
          />
          <button onClick={async () => {
            const file = await window.api.selectFile()
            if (file && settings) {
              setSettings({ ...settings, handbrakeCliPath: file })
            }
          }} style={browseButtonStyle}>
            Browse
          </button>
        </div>
        <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
          Path to HandBrakeCLI binary. Leave empty if it's already in your PATH.
        </span>
      </FieldGroup>

      <FieldGroup label="HandBrake Preset">
        <input
          type="text"
          value={settings.preset}
          onChange={(e) => setSettings({ ...settings, preset: e.target.value })}
          style={inputStyle}
        />
      </FieldGroup>

      <FieldGroup label="Max Parallel Encodes">
        <input
          type="number"
          min={1}
          max={8}
          value={settings.maxParallel}
          onChange={(e) => setSettings({ ...settings, maxParallel: Math.max(1, Math.min(8, parseInt(e.target.value) || 1)) })}
          style={{ ...inputStyle, width: '80px' }}
        />
      </FieldGroup>

      <FieldGroup label="Video Extensions">
        <input
          type="text"
          value={settings.videoExtensions.join(', ')}
          onChange={(e) => setSettings({
            ...settings,
            videoExtensions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
          })}
          style={inputStyle}
        />
        <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
          Comma-separated (e.g. .mp4, .mkv, .avi)
        </span>
      </FieldGroup>

      <FieldGroup label="Queue Existing Files">
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.queueExistingFiles}
            onChange={(e) => setSettings({ ...settings, queueExistingFiles: e.target.checked })}
          />
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            Queue files already in watch directory on startup
          </span>
        </label>
      </FieldGroup>

      <div style={{ marginTop: '8px' }}>
        <button onClick={handleSave} disabled={saving} style={{
          padding: '8px 24px',
          backgroundColor: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1
        }}>
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 10px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#fff'
}

const browseButtonStyle: React.CSSProperties = {
  padding: '6px 16px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '13px',
  cursor: 'pointer',
  backgroundColor: '#f9fafb',
  whiteSpace: 'nowrap'
}

export default SettingsView
