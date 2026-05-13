'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/ToastContext';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import LivePreview from '@/components/LivePreview';
import ConceptBrief from '@/components/ConceptBrief';

const DESIGN_SYSTEMS = [
  { id: 'material', name: 'Material UI', version: 'v5',  color: '#1565C0' },
  { id: 'ant',      name: 'Ant Design',  version: '5.x', color: '#1677FF' },
  { id: 'carbon',   name: 'IBM Carbon',  version: 'v11', color: '#0F62FE' },
  { id: 'mantine',  name: 'Mantine',     version: 'v7',  color: '#228be6' },
  { id: 'chakra',   name: 'Chakra UI',   version: 'v2',  color: '#319795' },
];

const VIEWPORT_OPTIONS = [
  { id: 'desktop', label: 'Desktop' },
  { id: 'tablet',  label: 'Tablet' },
  { id: 'mobile',  label: 'Mobile' },
];

const VIEWPORT_WIDTHS = { desktop: '100%', tablet: 768, mobile: 390 };

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const TabButton = ({ active, onClick, children }) => (
  <button
    className="btn btn-sm"
    onClick={onClick}
    style={{
      background: active ? 'var(--bg-surface)' : 'transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    }}
  >
    {children}
  </button>
);

const ProjectLoadingSkeleton = () => (
  <>
    <Navbar />
    <div className="container" style={{ padding: '48px 32px' }}>
      <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 500, borderRadius: 16 }} />
    </div>
  </>
);

const ProjectHeader = ({
  projectName,
  conceptName,
  isAdvancedMode,
  hasGeneratedUi,
  onAdvancedChange,
  onDownload,
  onNavigateToDashboard,
}) => (
  <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: 16 }}>
    <div>
      <div className="text-xs text-dim mb-1">
        <button
          onClick={onNavigateToDashboard}
          style={{ color: 'var(--accent)', textDecoration: 'underline' }}
        >
          Dashboard
        </button>{' '}
        / {projectName}
      </div>
      <h1 className="serif" style={{ fontSize: 32, letterSpacing: '-0.02em' }}>
        {conceptName || projectName}
      </h1>
    </div>
    <div className="flex gap-2 items-center">
      <label
        className="flex items-center gap-2 text-sm"
        style={{ color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}
      >
        <input
          type="checkbox"
          checked={isAdvancedMode}
          onChange={(e) => onAdvancedChange(e.target.checked)}
        />
        Advanced
      </label>
      {isAdvancedMode && hasGeneratedUi && (
        <button className="btn btn-ghost" onClick={onDownload}>
          ↓ Download project
        </button>
      )}
    </div>
  </div>
);

const TabBar = ({ activeTab, hasGeneratedUi, isAdvancedMode, onTabChange }) => (
  <div
    className="flex gap-1 mb-4"
    style={{
      background: 'var(--bg-elevated)',
      padding: 4,
      borderRadius: 10,
      border: '1px solid var(--border)',
      width: 'fit-content',
    }}
  >
    <TabButton active={activeTab === 'brief'} onClick={() => onTabChange('brief')}>
      Concept brief
    </TabButton>
    {hasGeneratedUi && (
      <TabButton active={activeTab === 'ui'} onClick={() => onTabChange('ui')}>
        UI mock
      </TabButton>
    )}
    {isAdvancedMode && hasGeneratedUi && (
      <TabButton active={activeTab === 'code'} onClick={() => onTabChange('code')}>
        Code
      </TabButton>
    )}
  </div>
);

const VisualizeCta = ({ hasGeneratedUi, isVisualizing, visualizeProgress, onOpenPicker }) => (
  <div
    className="card mt-6"
    style={{
      padding: '32px 28px',
      background: 'linear-gradient(135deg, var(--bg-elevated) 0%, rgba(212,165,116,0.04) 100%)',
      textAlign: 'center',
    }}
  >
    {!hasGeneratedUi && !isVisualizing && (
      <>
        <div className="text-xs mono mb-2" style={{ color: 'var(--accent)', letterSpacing: '0.12em' }}>
          OPTIONAL NEXT STEP
        </div>
        <h2 className="serif mb-3" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>
          See this concept as a UI
        </h2>
        <p className="text-muted mb-6" style={{ maxWidth: 460, margin: '0 auto 24px' }}>
          Pick a design system. We'll generate an interactive React mock built around your
          concept's features and KPIs.
        </p>
        <button className="btn btn-accent btn-lg" onClick={onOpenPicker}>
          Visualize as UI →
        </button>
      </>
    )}

    {isVisualizing && (
      <>
        <div className="text-xs mono mb-3" style={{ color: 'var(--accent)', letterSpacing: '0.12em' }}>
          BUILDING UI MOCK…
        </div>
        <p style={{ fontSize: 15, marginBottom: 16 }}>
          {visualizeProgress?.currentStep || 'Starting…'}
        </p>
        <div className="progress-track" style={{ maxWidth: 320, margin: '0 auto' }}>
          <div
            className="progress-fill"
            style={{ width: `${visualizeProgress?.progress || 0}%` }}
          />
        </div>
      </>
    )}

    {hasGeneratedUi && (
      <>
        <p className="text-muted mb-4">
          UI mock is ready in the <strong>UI mock</strong> tab.
        </p>
        <button className="btn btn-ghost" onClick={onOpenPicker}>
          ↻ Try a different design system
        </button>
      </>
    )}
  </div>
);

const ViewportToolbar = ({ viewport, onViewportChange, onOpenPicker }) => (
  <div
    className="flex gap-1 mb-3"
    style={{
      background: 'var(--bg-elevated)',
      padding: 4,
      borderRadius: 10,
      border: '1px solid var(--border)',
      width: 'fit-content',
    }}
  >
    {VIEWPORT_OPTIONS.map((option) => (
      <TabButton
        key={option.id}
        active={viewport === option.id}
        onClick={() => onViewportChange(option.id)}
      >
        {option.label}
      </TabButton>
    ))}
    <div style={{ width: 1, background: 'var(--border)', margin: '4px 4px' }} />
    <button
      className="btn btn-sm btn-ghost"
      onClick={onOpenPicker}
      title="Try a different design system"
    >
      ↻ Re-skin
    </button>
  </div>
);

const PreviewPanel = ({ dsKey, generatedCode, viewportWidth, designSystemName }) => (
  <>
    <div className="card" style={{ padding: 16, minHeight: 560, display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          width: viewportWidth,
          maxWidth: '100%',
          height: 520,
          background: '#FAFAFA',
          borderRadius: 12,
          border: '1px solid var(--border)',
          overflow: 'hidden',
          transition: 'width 300ms var(--ease)',
        }}
      >
        <LivePreview dsKey={dsKey} code={generatedCode} />
      </div>
    </div>
    <div className="text-xs text-dim mt-2 text-center">Built with {designSystemName}</div>
  </>
);

const CodePanel = ({ generatedCode, designSystemName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="card" style={{ padding: 0, minHeight: 560, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
        }}
      >
        <span className="mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
          GeneratedApp.jsx — {designSystemName}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div style={{ height: 520, overflow: 'auto', background: '#0d1117' }}>
        <pre
          style={{
            margin: 0,
            padding: '20px 24px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            lineHeight: 1.7,
            color: '#e6edf3',
            whiteSpace: 'pre',
            tabSize: 2,
          }}
        >
          {generatedCode}
        </pre>
      </div>
    </div>
  );
};

const DesignSystemOption = ({ ds, isSelected, onSelect }) => (
  <div
    className={`card card-interactive ${isSelected ? 'card-selected' : ''}`}
    onClick={() => onSelect(ds.id)}
    style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}
  >
    <div
      style={{ width: 32, height: 32, borderRadius: 8, background: ds.color, flexShrink: 0 }}
    />
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 500, fontSize: 14 }}>{ds.name}</div>
      <div className="text-xs text-dim">{ds.version}</div>
    </div>
  </div>
);

const DesignSystemPickerModal = ({ open, selectedDs, onSelect, onClose, onConfirm }) => (
  <Modal open={open} onClose={onClose}>
    <h2 className="serif mb-2" style={{ fontSize: 24 }}>
      Pick a design system
    </h2>
    <p className="text-muted mb-6">Claude will style the UI mock using this library.</p>
    <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: '1fr' }}>
      {DESIGN_SYSTEMS.map((ds) => (
        <DesignSystemOption
          key={ds.id}
          ds={ds}
          isSelected={selectedDs === ds.id}
          onSelect={onSelect}
        />
      ))}
    </div>
    <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
      <button className="btn btn-ghost" onClick={onClose}>
        Cancel
      </button>
      <button className="btn btn-accent" onClick={onConfirm} disabled={!selectedDs}>
        Generate UI →
      </button>
    </div>
  </Modal>
);

const AuthGateModal = ({ open, onClose, onSignUp }) => (
  <Modal open={open} onClose={onClose}>
    <h2 className="serif mb-2" style={{ fontSize: 28 }}>
      Sign in to download
    </h2>
    <p className="text-muted mb-6">Create a free account to download your generated project.</p>
    <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
      <button className="btn btn-ghost" onClick={onClose}>
        Cancel
      </button>
      <button className="btn btn-primary" onClick={onSignUp}>
        Create free account →
      </button>
    </div>
  </Modal>
);

// ---------------------------------------------------------------------------
// Page content
// ---------------------------------------------------------------------------

export default function ProjectContent({ projectId }) {
  const router = useRouter();
  const toast = useToast();
  const { isAuthenticated } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('brief');
  const [viewport, setViewport] = useState('desktop');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isAuthGateOpen, setIsAuthGateOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedDs, setSelectedDs] = useState(null);
  const [visualizeProgress, setVisualizeProgress] = useState(null);

  // ── Initial load ─────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    api
      .getProject(projectId)
      .then(({ project }) => {
        if (mounted) setProject(project);
      })
      .catch((err) => toast.show(err.message || 'Failed to load project', 'error'))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [projectId, toast]);

  // ── Poll while UI is generating ──────────────────────────────────
  // Depend ONLY on the boolean derived from status, never on the whole project
  // object — otherwise every poll's setProject re-runs the effect and fires
  // another poll immediately, blowing past the rate limit.
  const isGeneratingUi = project?.status === 'generating-ui';
  useEffect(() => {
    if (!isGeneratingUi) return;
    let cancelled = false;
    const pollStatus = async () => {
      if (cancelled) return;
      try {
        const { project: fresh, jobProgress } = await api.getProject(projectId);
        if (cancelled) return;
        setProject(fresh);
        if (jobProgress) {
          setVisualizeProgress({
            progress: jobProgress.progress,
            currentStep: jobProgress.currentStep,
          });
        }
        if (fresh.status === 'complete') {
          setVisualizeProgress(null);
          setActiveTab('ui');
          toast.show('UI mock ready', 'success');
        } else if (fresh.status === 'failed') {
          setVisualizeProgress(null);
          toast.show('Visualization failed', 'error');
        }
      } catch (err) {
        // Most likely 429 — stop polling rather than hammering further.
        cancelled = true;
        clearInterval(interval);
      }
    };
    pollStatus();
    const interval = setInterval(pollStatus, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isGeneratingUi, projectId, toast]);

  // ── Actions ──────────────────────────────────────────────────────
  const handleOpenPicker = () => {
    setIsPickerOpen(true);
    setSelectedDs(project?.designSystem || 'material');
  };

  const handleConfirmVisualize = async () => {
    if (!selectedDs) return;
    setIsPickerOpen(false);
    try {
      await api.visualizeProject(projectId, selectedDs);
      const { project: fresh } = await api.getProject(projectId);
      setProject(fresh);
    } catch (err) {
      toast.show(err.message || 'Failed to start visualization', 'error');
    }
  };

  const handleDownload = async () => {
    if (!isAuthenticated) {
      setIsAuthGateOpen(true);
      return;
    }
    try {
      const blob = await api.download(projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '-')}-designforge.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.show('Download started', 'success');
    } catch (err) {
      if (err.code === 'AUTH_REQUIRED') setIsAuthGateOpen(true);
      else toast.show(err.message || 'Download failed', 'error');
    }
  };

  // ── Render ───────────────────────────────────────────────────────
  if (loading) return <ProjectLoadingSkeleton />;
  if (!project) return null;

  const concept = project.concept;
  const generation = project.generation;
  const hasGeneratedUi = !!generation?.generatedCode;
  const isVisualizing = project.status === 'generating-ui';
  const viewportWidth = VIEWPORT_WIDTHS[viewport];

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '24px 32px 48px' }}>
        <ProjectHeader
          projectName={project.name}
          conceptName={concept?.name}
          isAdvancedMode={isAdvancedMode}
          hasGeneratedUi={hasGeneratedUi}
          onAdvancedChange={setIsAdvancedMode}
          onDownload={handleDownload}
          onNavigateToDashboard={() => router.push('/dashboard')}
        />

        <TabBar
          activeTab={activeTab}
          hasGeneratedUi={hasGeneratedUi}
          isAdvancedMode={isAdvancedMode}
          onTabChange={setActiveTab}
        />

        {activeTab === 'brief' && (
          <>
            <ConceptBrief concept={concept} />
            <VisualizeCta
              hasGeneratedUi={hasGeneratedUi}
              isVisualizing={isVisualizing}
              visualizeProgress={visualizeProgress}
              onOpenPicker={handleOpenPicker}
            />
          </>
        )}

        {activeTab === 'ui' && hasGeneratedUi && (
          <>
            <ViewportToolbar
              viewport={viewport}
              onViewportChange={setViewport}
              onOpenPicker={handleOpenPicker}
            />
            <PreviewPanel
              dsKey={project.designSystem}
              generatedCode={generation.generatedCode}
              viewportWidth={viewportWidth}
              designSystemName={generation.designSystem?.name}
            />
          </>
        )}

        {activeTab === 'code' && isAdvancedMode && hasGeneratedUi && (
          <CodePanel
            generatedCode={generation.generatedCode}
            designSystemName={generation.designSystem?.name}
          />
        )}
      </div>

      <DesignSystemPickerModal
        open={isPickerOpen}
        selectedDs={selectedDs}
        onSelect={setSelectedDs}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={handleConfirmVisualize}
      />

      <AuthGateModal
        open={isAuthGateOpen}
        onClose={() => setIsAuthGateOpen(false)}
        onSignUp={() => router.push('/auth?mode=signup')}
      />
    </>
  );
}
