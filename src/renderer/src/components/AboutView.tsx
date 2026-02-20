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
        <h1
          style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}
        >
          Drift
        </h1>
        {version && (
          <p style={{ fontSize: 14, color: 'var(--color-text-tertiary)', margin: '4px 0 0' }}>
            v{version}
          </p>
        )}
        <a
          href="https://github.com/wwsean08/drift"
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 13,
            color: 'var(--color-accent)',
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
            color: 'var(--color-text-secondary)',
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
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              fontSize: 12,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              color: 'var(--color-text-secondary)',
              overflow: 'auto',
              maxHeight: 300
            }}
          >
            {aboutData.projectLicense}
          </pre>
        )}
      </div>

      <div>
        <h2
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            marginBottom: 8
          }}
        >
          Dependencies
        </h2>
        <div
          style={{
            border: '1px solid var(--color-border)',
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
                backgroundColor: i % 2 === 0 ? 'var(--color-bg)' : 'var(--color-bg-secondary)',
                borderTop: i === 0 ? 'none' : '1px solid var(--color-bg-tertiary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {dep.url ? (
                  <a
                    href={dep.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: 'var(--color-accent)',
                      textDecoration: 'none',
                      fontWeight: 500
                    }}
                  >
                    {dep.name}
                  </a>
                ) : (
                  <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {dep.name}
                  </span>
                )}
                <span style={{ color: 'var(--color-text-muted)' }}>{dep.version}</span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  backgroundColor: 'var(--color-accent-bg)',
                  color: 'var(--color-accent)',
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

      <p
        style={{
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--color-text-muted)',
          marginTop: 32
        }}
      >
        Copyright Sean Smith 2026
      </p>
    </div>
  )
}

export default AboutView
