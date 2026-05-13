import Link from 'next/link';
import Navbar from '@/components/Navbar';

const FEATURES = [
  { num: '1', title: 'Describe',   body: 'Paste a B2B idea or pain point in plain language.' },
  { num: '2', title: 'Concept',    body: 'Claude returns a sharp brief — name, audience, features, KPIs.' },
  { num: '3', title: 'Visualize',  body: 'Pick a design system. We build a live, interactive UI mock.' },
  { num: '4', title: 'Export',     body: 'Download a runnable Vite + React project, or keep iterating.' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const Feature = ({ num, title, body }) => (
  <div>
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--accent)',
        marginBottom: 12,
        letterSpacing: '0.1em',
      }}
    >
      0{num}
    </div>
    <h3 style={{ fontSize: 18, marginBottom: 8, fontWeight: 500 }}>{title}</h3>
    <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>{body}</p>
  </div>
);

const HeroSection = () => (
  <section style={{ padding: '96px 0 80px' }}>
    <div className="container">
      <div style={{ maxWidth: 780 }}>
        <div className="badge badge-accent mb-6">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
          Now in beta — MVP launch Q3 2026
        </div>
        <h1
          style={{
            fontSize: 'clamp(48px, 7vw, 84px)',
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            fontWeight: 500,
            marginBottom: 24,
          }}
        >
          From a B2B idea <br />
          to a working app. <br />
          <span className="serif" style={{ fontSize: '0.95em', color: 'var(--accent)' }}>In minutes.</span>
        </h1>
        <p className="text-muted" style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 580, marginBottom: 40 }}>
          DesignForge generates a sharp B2B product concept brief from your idea, then turns it into an
          interactive UI mock you can browse — built with the design system of your choice.
        </p>
        <div className="flex gap-3">
          <Link href="/auth?mode=signup" className="btn btn-primary btn-lg">
            Start building free
            <span style={{ fontSize: 16 }}>→</span>
          </Link>
          <Link href="/auth" className="btn btn-ghost btn-lg">Sign in</Link>
        </div>
        <p className="text-dim text-xs mt-4">
          Free for 3 projects · No credit card required
        </p>
      </div>
    </div>
  </section>
);

const HowItWorksSection = () => (
  <section style={{ padding: '64px 0', borderTop: '1px solid var(--border)' }}>
    <div className="container">
      <div className="mb-8" style={{ maxWidth: 600 }}>
        <div className="text-xs mono mb-2" style={{ color: 'var(--accent)', letterSpacing: '0.15em' }}>
          HOW IT WORKS
        </div>
        <h2 className="serif" style={{ fontSize: 42, letterSpacing: '-0.02em' }}>
          Four steps. From idea to runnable app.
        </h2>
      </div>
      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: 48 }}
      >
        {FEATURES.map((feature) => (
          <Feature key={feature.num} num={feature.num} title={feature.title} body={feature.body} />
        ))}
      </div>
    </div>
  </section>
);

const CtaSection = () => (
  <section style={{ padding: '120px 0', borderTop: '1px solid var(--border)' }}>
    <div className="container text-center">
      <h2 className="serif" style={{ fontSize: 56, letterSpacing: '-0.02em', marginBottom: 24 }}>
        Your idea, working by end of day.
      </h2>
      <p className="text-muted mb-8" style={{ fontSize: 17, maxWidth: 500, margin: '0 auto 40px' }}>
        Skip the deck. Skip the wireframes. Start with a real concept and a real interface.
      </p>
      <Link href="/auth?mode=signup" className="btn btn-accent btn-lg">
        Start building free →
      </Link>
    </div>
  </section>
);

const PageFooter = () => (
  <footer style={{ padding: '32px 0', borderTop: '1px solid var(--border)' }}>
    <div className="container flex justify-between items-center">
      <div className="text-xs text-dim">© 2026 DesignForge · All rights reserved</div>
      <div className="flex gap-4 text-xs text-dim">
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <a href="#">Docs</a>
      </div>
    </div>
  </footer>
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <CtaSection />
      <PageFooter />
    </>
  );
}
