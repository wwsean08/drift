import { useState, useEffect, useRef } from 'react'

interface PresetEntry {
  category: string
  name: string
}

function SettingsView({
  onDirtyChange,
  saveRef
}: Readonly<{
  onDirtyChange: (dirty: boolean) => void
  saveRef: React.RefObject<(() => Promise<void>) | null>
}>): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [originalSettings, setOriginalSettings] = useState<AppSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [presets, setPresets] = useState<PresetEntry[]>([])
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const presetRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isDirty =
    settings !== null &&
    originalSettings !== null &&
    JSON.stringify(settings) !== JSON.stringify(originalSettings)

  useEffect(() => {
    globalThis.api.getSettings().then((s) => {
      setSettings(s)
      setOriginalSettings(s)
    })
    globalThis.api.getPresets().then(setPresets)
  }, [])

  useEffect(() => {
    onDirtyChange(isDirty)
  }, [isDirty, onDirtyChange])

  async function refreshSettingsAndPresets(): Promise<void> {
    const updated = await globalThis.api.getSettings()
    setSettings(updated)
    setOriginalSettings(updated)
    const allPresets = await globalThis.api.getPresets()
    setPresets(allPresets)
  }

  const handleBrowse = async (field: 'watchDir' | 'outputDir'): Promise<void> => {
    const dir = await globalThis.api.selectDirectory()
    if (dir && settings) {
      setSettings({ ...settings, [field]: dir })
    }
  }

  const handleSave = async (): Promise<void> => {
    if (!settings) return
    setSaving(true)
    await globalThis.api.saveSettings(settings)
    const allPresets = await globalThis.api.getPresets()
    setPresets(allPresets)
    setOriginalSettings(settings)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  useEffect(() => {
    saveRef.current = handleSave
  })

  if (!settings) {
    return (
      <div style={{ padding: '24px', color: 'var(--color-text-tertiary)' }}>
        Loading settings...
      </div>
    )
  }

  let saveLabel: string
  if (saving) saveLabel = 'Saving...'
  else if (saved) saveLabel = 'Saved!'
  else saveLabel = 'Save Settings'

  return (
    <div
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '600px'
      }}
    >
      <FieldGroup label="Theme">
        <select
          value={settings.theme ?? 'system'}
          onChange={(e) => {
            const v = e.target.value as 'system' | 'light' | 'dark'
            setSettings({ ...settings, theme: v })
            globalThis.api.setThemePreview(v)
          }}
          style={{ ...inputStyle, flex: 'none', width: '180px' }}
        >
          <option value="system">System Default</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </FieldGroup>

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
          <button
            onClick={async () => {
              const file = await globalThis.api.selectFile()
              if (file && settings) {
                setSettings({ ...settings, handbrakeCliPath: file })
              }
            }}
            style={browseButtonStyle}
          >
            Browse
          </button>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          Path to HandBrakeCLI binary. Leave empty if it&apos;s already in your PATH.
        </span>
      </FieldGroup>

      <FieldGroup label="HandBrake Preset">
        <PresetCombobox
          value={settings.preset}
          presets={presets}
          onChange={(v) => setSettings({ ...settings, preset: v })}
          open={presetDropdownOpen}
          setOpen={setPresetDropdownOpen}
          highlightedIndex={highlightedIndex}
          setHighlightedIndex={setHighlightedIndex}
          containerRef={presetRef}
          dropdownRef={dropdownRef}
        />
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={async () => {
              const custom = await globalThis.api.importCustomPreset()
              if (custom.length > 0) {
                await refreshSettingsAndPresets()
              }
            }}
            style={browseButtonStyle}
          >
            Import Custom Preset...
          </button>
          {(settings.customPresetPaths || []).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(settings.customPresetPaths || []).map((p) => (
                <div
                  key={p}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: 'var(--color-text-tertiary)'
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}
                    title={p}
                  >
                    {p.split('/').pop()}
                  </span>
                  <button
                    onClick={async () => {
                      await globalThis.api.removeCustomPreset(p)
                      await refreshSettingsAndPresets()
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      fontSize: '14px',
                      padding: '0 2px',
                      lineHeight: 1
                    }}
                    title="Remove custom preset file"
                    data-tooltip="Remove custom preset file"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Export presets from HandBrake GUI (Presets → Export) then import the JSON file here.
          </span>
        </div>
      </FieldGroup>

      <FieldGroup label="Output Format">
        <select
          value={settings.outputFormat}
          onChange={(e) =>
            setSettings({
              ...settings,
              outputFormat: e.target.value as 'm4v' | 'mp4' | 'mkv' | 'webm'
            })
          }
          style={{ ...inputStyle, flex: 'none', width: '120px' }}
        >
          <option value="m4v">m4v</option>
          <option value="mp4">mp4</option>
          <option value="mkv">mkv</option>
          <option value="webm">webm</option>
        </select>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          Output container format. Ensure your preset is compatible with the chosen format.
        </span>
      </FieldGroup>

      <FieldGroup label="Output Filename Template">
        <input
          type="text"
          value={settings.outputFilenameTemplate || '{name}'}
          onChange={(e) => setSettings({ ...settings, outputFilenameTemplate: e.target.value })}
          placeholder="{name}"
          style={inputStyle}
        />
        <details style={{ marginTop: '4px' }}>
          <summary
            style={{
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            Available tokens
          </summary>
          <div
            style={{
              marginTop: '6px',
              padding: '8px 10px',
              backgroundColor: 'var(--color-bg-tertiary)',
              borderRadius: '6px',
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
              lineHeight: '1.7'
            }}
          >
            <div>
              <code>{'{name}'}</code> — original filename without extension
            </div>
            <div>
              <code>{'{creation_date}'}</code> — file creation date as YYYY-MM-DD
            </div>
            <div>
              <code>{'{creation_datetime}'}</code> — file creation date &amp; time as
              YYYY-MM-DD_HH-MM-SS
            </div>
            <div>
              <code>{'{resolution}'}</code> — shorthand e.g. 1080p, 4K (requires metadata scan)
            </div>
            <div>
              <code>{'{width}'}</code> — pixel width (requires metadata scan)
            </div>
            <div>
              <code>{'{height}'}</code> — pixel height (requires metadata scan)
            </div>
            <div>
              <code>{'{duration}'}</code> — duration as HH-MM-SS (requires metadata scan)
            </div>
          </div>
        </details>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          Metadata tokens may be empty for the first file if the scan has not completed before
          encoding starts.
        </span>
      </FieldGroup>

      <FieldGroup label="Max Parallel Encodes">
        <input
          type="number"
          min={1}
          max={8}
          value={settings.maxParallel}
          onChange={(e) =>
            setSettings({
              ...settings,
              maxParallel: Math.max(1, Math.min(8, Number.parseInt(e.target.value) || 1))
            })
          }
          style={{ ...inputStyle, width: '80px' }}
        />
      </FieldGroup>

      <FieldGroup label="Video Extensions">
        <input
          type="text"
          value={settings.videoExtensions.join(', ')}
          onChange={(e) =>
            setSettings({
              ...settings,
              videoExtensions: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            })
          }
          style={inputStyle}
        />
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
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
          <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
            Queue files already in watch directory on startup
          </span>
        </label>
      </FieldGroup>

      <FieldGroup label="Delete Input File on Completion">
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.deleteInputOnComplete ?? false}
            onChange={(e) => setSettings({ ...settings, deleteInputOnComplete: e.target.checked })}
          />
          <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
            Permanently delete the source file after successful encoding
          </span>
        </label>
        <div
          style={{
            marginTop: '6px',
            padding: '10px 12px',
            backgroundColor: 'var(--color-warning-bg)',
            border: '1px solid var(--color-warning-border)',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--color-warning-text)',
            lineHeight: '1.5'
          }}
        >
          <strong>Warning:</strong> When enabled, source video files will be permanently deleted
          from disk after encoding completes successfully. This action cannot be undone. Verify your
          encoded output before enabling this setting.
        </div>
      </FieldGroup>

      <div style={{ marginTop: '8px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '8px 24px',
            backgroundColor: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1
          }}
        >
          {saveLabel}
        </button>
      </div>
    </div>
  )
}

function PresetCombobox({
  value,
  presets,
  onChange,
  open,
  setOpen,
  highlightedIndex,
  setHighlightedIndex,
  containerRef,
  dropdownRef
}: Readonly<{
  value: string
  presets: PresetEntry[]
  onChange: (v: string) => void
  open: boolean
  setOpen: (v: boolean) => void
  highlightedIndex: number
  setHighlightedIndex: (v: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  dropdownRef: React.RefObject<HTMLDivElement | null>
}>): React.JSX.Element {
  const query = value.toLowerCase()
  const filtered = presets.filter((p) => p.name.toLowerCase().includes(query))

  // Build grouped list with category headers interleaved
  const items: Array<{ type: 'category'; label: string } | { type: 'preset'; entry: PresetEntry }> =
    []
  let lastCategory = ''
  for (const entry of filtered) {
    if (entry.category !== lastCategory) {
      items.push({ type: 'category', label: entry.category })
      lastCategory = entry.category
    }
    items.push({ type: 'preset', entry })
  }

  const selectableIndices = items
    .map((item, i) => (item.type === 'preset' ? i : -1))
    .filter((i) => i >= 0)

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      setHighlightedIndex(selectableIndices[0] ?? -1)
      e.preventDefault()
      return
    }

    if (!open) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const currentPos = selectableIndices.indexOf(highlightedIndex)
      const next = selectableIndices[currentPos + 1] ?? selectableIndices[0]
      setHighlightedIndex(next ?? -1)
      scrollToIndex(next, dropdownRef)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const currentPos = selectableIndices.indexOf(highlightedIndex)
      const prev = selectableIndices[currentPos - 1] ?? selectableIndices.at(-1)
      setHighlightedIndex(prev ?? -1)
      scrollToIndex(prev, dropdownRef)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = items[highlightedIndex]
      if (item?.type === 'preset') {
        onChange(item.entry.name)
        setOpen(false)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [containerRef, setOpen])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setHighlightedIndex(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Type to search presets..."
        style={inputStyle}
      />
      {open && items.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: '240px',
            overflowY: 'auto',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border-input)',
            borderRadius: '6px',
            marginTop: '4px',
            zIndex: 50,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {items.map((item, i) =>
            item.type === 'category' ? (
              <div
                key={`cat-${item.label}`}
                style={{
                  padding: '6px 10px 2px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderTop: i > 0 ? '1px solid var(--color-bg-tertiary)' : undefined
                }}
              >
                {item.label}
              </div>
            ) : (
              <button
                type="button"
                key={item.entry.name}
                data-index={i}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(item.entry.name)
                  setOpen(false)
                }}
                onMouseEnter={() => setHighlightedIndex(i)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  padding: '6px 10px 6px 20px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  backgroundColor:
                    i === highlightedIndex ? 'var(--color-accent-bg)' : 'transparent',
                  color: 'var(--color-text-secondary)'
                }}
              >
                {item.entry.name}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

function scrollToIndex(index: number, ref: React.RefObject<HTMLDivElement | null>): void {
  if (!ref.current || index < 0) return
  const el = ref.current.querySelector(`[data-index="${index}"]`) as HTMLElement | null
  if (el) el.scrollIntoView({ block: 'nearest' })
}

function FieldGroup({
  label,
  children
}: Readonly<{
  label: string
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 10px',
  border: '1px solid var(--color-border-input)',
  borderRadius: '6px',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text-primary)'
}

const browseButtonStyle: React.CSSProperties = {
  padding: '6px 16px',
  border: '1px solid var(--color-border-input)',
  borderRadius: '6px',
  fontSize: '13px',
  cursor: 'pointer',
  backgroundColor: 'var(--color-bg-secondary)',
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap'
}

export default SettingsView
