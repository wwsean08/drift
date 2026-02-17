import { useState, useEffect } from 'react'
import QueueView from './components/QueueView'
import SettingsView from './components/SettingsView'
import AboutView from './components/AboutView'

type Tab = 'queue' | 'settings' | 'about'

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('queue')
  const [appError, setAppError] = useState<string | null>(null)

  useEffect(() => {
    const cleanup = window.api.onAppError((message) => {
      setAppError(message)
    })
    return cleanup
  }, [])

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
            backgroundColor: '#fef2f2',
            borderBottom: '1px solid #fecaca',
            color: '#991b1b',
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
              color: '#991b1b',
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
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}
      >
        <TabButton
          label="Queue"
          active={activeTab === 'queue'}
          onClick={() => setActiveTab('queue')}
        />
        <TabButton
          label="Settings"
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />
        <TabButton
          label="About"
          active={activeTab === 'about'}
          onClick={() => setActiveTab('about')}
        />
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'queue' && <QueueView />}
        {activeTab === 'settings' && <SettingsView />}
        {activeTab === 'about' && <AboutView />}
      </div>
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
        borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
        backgroundColor: 'transparent',
        color: active ? '#3b82f6' : '#6b7280',
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
