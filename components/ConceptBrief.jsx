'use client';

// Designer-friendly view of the AI-generated product concept.
// No code, no preview — just a clean structured brief in cards.

const Section = ({ label, children, style }) => (
  <div className="card" style={{ padding: 24, ...style }}>
    <div
      className="text-xs mono mb-3"
      style={{
        color: 'var(--accent)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
    {children}
  </div>
);

const Bullet = ({ children }) => (
  <li
    style={{
      padding: '8px 0',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      gap: 12,
      fontSize: 14,
    }}
  >
    {children}
  </li>
);

const ConceptBrief = ({ concept }) => {
  if (!concept) return null;

  const {
    name,
    tagline,
    description,
    audience = [],
    features = [],
    valueProposition = {},
    kpis = [],
  } = concept;

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: '1fr' }}>
      {/* Hero */}
      <div
        className="card"
        style={{
          padding: '40px 32px',
          background:
            'linear-gradient(135deg, rgba(212,165,116,0.08) 0%, var(--bg-elevated) 100%)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          className="text-xs mono mb-3"
          style={{ color: 'var(--accent)', letterSpacing: '0.12em' }}
        >
          PRODUCT CONCEPT
        </div>
        <h1
          className="serif"
          style={{
            fontSize: 44,
            letterSpacing: '-0.02em',
            marginBottom: 12,
            lineHeight: 1.05,
          }}
        >
          {name}
        </h1>
        {tagline && (
          <p
            style={{
              fontSize: 18,
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              lineHeight: 1.4,
            }}
          >
            {tagline}
          </p>
        )}
      </div>

      {/* Description */}
      {description && (
        <Section label="What it is">
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {description}
          </p>
        </Section>
      )}

      {/* Two-column row: Audience + Value prop */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
      >
        {audience.length > 0 && (
          <Section label="Who it's for">
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {audience.map((a, i) => (
                <Bullet key={i}>
                  <div
                    style={{
                      flex: '0 0 8px',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      marginTop: 7,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{a.role}</div>
                    {a.painPoint && (
                      <div className="text-sm text-muted" style={{ lineHeight: 1.45 }}>
                        {a.painPoint}
                      </div>
                    )}
                  </div>
                </Bullet>
              ))}
            </ul>
          </Section>
        )}

        {valueProposition.headline && (
          <Section label="Value proposition">
            <div
              style={{
                fontSize: 18,
                lineHeight: 1.4,
                fontWeight: 500,
                marginBottom: 16,
                color: 'var(--text-primary)',
              }}
            >
              {valueProposition.headline}
            </div>
            {valueProposition.supports && valueProposition.supports.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {valueProposition.supports.map((s, i) => (
                  <li
                    key={i}
                    style={{
                      padding: '6px 0',
                      borderTop: '1px solid var(--border)',
                      fontSize: 14,
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <span style={{ color: 'var(--accent)' }}>→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}
      </div>

      {/* Features */}
      {features.length > 0 && (
        <Section label="Key features">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {features.map((f, i) => (
              <Bullet key={i}>
                <div
                  style={{
                    flex: '0 0 28px',
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--accent)',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>{f.name}</div>
                  {f.rationale && (
                    <div className="text-sm text-muted" style={{ lineHeight: 1.45 }}>
                      {f.rationale}
                    </div>
                  )}
                </div>
              </Bullet>
            ))}
          </ul>
        </Section>
      )}

      {/* KPIs */}
      {kpis.length > 0 && (
        <Section label="Success metrics">
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
          >
            {kpis.map((k, i) => (
              <div
                key={i}
                style={{
                  padding: 14,
                  background: 'var(--bg-elevated)',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontWeight: 500,
                    marginBottom: 4,
                    fontSize: 14,
                    color: 'var(--accent)',
                  }}
                >
                  {k.metric}
                </div>
                {k.why && (
                  <div className="text-xs text-muted" style={{ lineHeight: 1.45 }}>
                    {k.why}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
};

export default ConceptBrief;
