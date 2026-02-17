import { useState, useEffect } from 'react'
import aboutData from '../generated/about-data.json'

function AboutView(): React.JSX.Element {
  const [version, setVersion] = useState('')
  const [licenseOpen, setLicenseOpen] = useState(false)

  useEffect(() => {
    window.api.getAppVersion().then(setVersion)
  }, [])

  return (
    <div style={{ padding: '24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>Drift</h1>
        {version && <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>v{version}</p>}
        <a
          href="https://github.com/wwsean08/drift"
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 13,
            color: '#3b82f6',
            textDecoration: 'none',
            marginTop: 4,
            display: 'inline-block'
          }}
        >
          github.com/wwsean08/drift
        </a>
      </div>

      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => setLicenseOpen(!licenseOpen)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontSize: 15,
            fontWeight: 600,
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span
            style={{
              display: 'inline-block',
              transform: licenseOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 150ms',
              fontSize: 12
            }}
          >
            &#9654;
          </span>
          License
        </button>
        {licenseOpen && (
          <pre
            style={{
              marginTop: 8,
              padding: 16,
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              fontSize: 12,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              color: '#374151',
              overflow: 'auto',
              maxHeight: 300
            }}
          >
            {aboutData.projectLicense}
          </pre>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
          Dependencies
        </h2>
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            overflow: 'hidden'
          }}
        >
          {aboutData.dependencies.map((dep, i) => (
            <div
              key={dep.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                fontSize: 13,
                backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb',
                borderTop: i === 0 ? 'none' : '1px solid #f3f4f6'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {dep.url ? (
                  <a
                    href={dep.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
                  >
                    {dep.name}
                  </a>
                ) : (
                  <span style={{ fontWeight: 500, color: '#111827' }}>{dep.name}</span>
                )}
                <span style={{ color: '#9ca3af' }}>{dep.version}</span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  backgroundColor: '#eff6ff',
                  color: '#3b82f6',
                  borderRadius: 9999,
                  fontWeight: 500
                }}
              >
                {dep.license}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 32 }}>
        Copyright Sean Smith 2026
      </p>
    </div>
  )
}

export default AboutView
