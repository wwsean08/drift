import { useState, useEffect, useRef } from 'react'
import QueueView from './components/QueueView'
import SettingsView from './components/SettingsView'
import AboutView from './components/AboutView'

type Tab = 'queue' | 'settings' | 'about'

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('queue')
  const [appError, setAppError] = useState<string | null>(null)
  const [settingsDirty, setSettingsDirty] = useState(false)
  const [pendingTab, setPendingTab] = useState<Tab | null>(null)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const saveRef = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    const cleanupError = window.api.onAppError((message) => {
      setAppError(message)
    })
    const cleanupHandbrake = window.api.onHandbrakeValid(() => {
      setAppError(null)
    })
    return () => {
      cleanupError()
      cleanupHandbrake()
    }
  }, [])

  const handleTabChange = (tab: Tab): void => {
    if (activeTab === 'settings' && settingsDirty && tab !== 'settings') {
      setPendingTab(tab)
      setShowUnsavedModal(true)
    } else {
      setActiveTab(tab)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {appError && (
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--color-error-bg)',
            borderBottom: '1px solid var(--color-error-border)',
            color: 'var(--color-error-text)',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{appError}</span>
          <button
            onClick={() => setAppError(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-error-text)',
              fontWeight: 'bold'
            }}
          >
            X
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-secondary)'
        }}
      >
        <TabButton
          label="Queue"
          active={activeTab === 'queue'}
          onClick={() => handleTabChange('queue')}
        />
        <TabButton
          label="Settings"
          active={activeTab === 'settings'}
          onClick={() => handleTabChange('settings')}
        />
        <TabButton
          label="About"
          active={activeTab === 'about'}
          onClick={() => handleTabChange('about')}
        />
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'queue' && <QueueView />}
        {activeTab === 'settings' && (
          <SettingsView onDirtyChange={(d) => setSettingsDirty(d)} saveRef={saveRef} />
        )}
        {activeTab === 'about' && <AboutView />}
      </div>

      {showUnsavedModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-bg)',
              borderRadius: '8px',
              padding: '24px',
              width: '360px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '6px'
                }}
              >
                Unsaved Changes
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                You have unsaved changes in Settings. What would you like to do?
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={async () => {
                  await saveRef.current?.()
                  setActiveTab(pendingTab!)
                  setShowUnsavedModal(false)
                  setPendingTab(null)
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setActiveTab(pendingTab!)
                  setShowUnsavedModal(false)
                  setPendingTab(null)
                  window.api.getSettings().then((s) => window.api.setThemePreview(s.theme))
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border-input)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Discard Changes
              </button>
              <button
                onClick={() => {
                  setShowUnsavedModal(false)
                  setPendingTab(null)
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-tertiary)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TabButton({
  label,
  active,
  onClick
}: {
  label: string
  active: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 24px',
        border: 'none',
        borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
        backgroundColor: 'transparent',
        color: active ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
        fontWeight: active ? 600 : 400,
        fontSize: '14px',
        cursor: 'pointer'
      }}
    >
      {label}
    </button>
  )
}

export default App
