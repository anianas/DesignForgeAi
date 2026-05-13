'use client';

import { useRouter } from 'next/navigation';
import { CONCEPT_STEPS } from '@/lib/generationSteps';
import { useGenerationPolling } from './useGenerationPolling';

// Derive step labels from the authoritative list in generationService.
const GENERATION_STEP_LABELS = CONCEPT_STEPS.map((step) => step.label + '…');

const CENTERED_FULL_PAGE = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const GenerationErrorCard = ({ message, onBack }) => (
  <div style={CENTERED_FULL_PAGE}>
    <div className="card" style={{ maxWidth: 480, textAlign: 'center' }}>
      <div
        style={{
          width: 56,
          height: 56,
          margin: '0 auto 20px',
          borderRadius: '50%',
          background: 'var(--error-bg)',
          color: 'var(--error)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
        }}
      >
        !
      </div>
      <h2 className="serif mb-2" style={{ fontSize: 28 }}>
        Something went wrong
      </h2>
      <p className="text-muted mb-6">{message}</p>
      <div className="flex gap-2" style={{ justifyContent: 'center' }}>
        <button className="btn btn-ghost" onClick={onBack}>
          Back to dashboard
        </button>
      </div>
    </div>
  </div>
);

const PulsingOrb = () => (
  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
    <div
      style={{
        width: 96,
        height: 96,
        borderRadius: '50%',
        background:
          'radial-gradient(circle at 30% 30%, var(--accent-strong), var(--accent) 50%, #8B6840 100%)',
        position: 'relative',
        animation: 'pulse 2.4s ease-in-out infinite',
        boxShadow: '0 0 60px rgba(212, 165, 116, 0.3)',
      }}
    />
  </div>
);

const GenerationHeader = ({ projectName }) => (
  <div className="text-center mb-8">
    <div
      className="text-xs mono mb-2"
      style={{ color: 'var(--accent)', letterSpacing: '0.15em' }}
    >
      DRAFTING CONCEPT
    </div>
    <h1 className="serif" style={{ fontSize: 40, letterSpacing: '-0.02em', marginBottom: 12 }}>
      {projectName || 'Your project'}
    </h1>
    <p className="text-muted">
      Claude is writing your product brief — usually under 30 seconds.
    </p>
  </div>
);

const ProgressBar = ({ progress, currentStep }) => (
  <div className="mb-6">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm" style={{ fontWeight: 500 }}>{currentStep}</span>
      <span className="text-sm mono text-muted">{progress}%</span>
    </div>
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${progress}%` }} />
    </div>
  </div>
);

const GenerationStepList = ({ stepLabels, completedSteps }) => (
  <div>
    {stepLabels.map((label, i) => {
      const isComplete = completedSteps.length > i;
      const isActive = completedSteps.length === i;
      return (
        <div
          key={label}
          className={`step-item ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
        >
          <span className="step-dot" />
          <span className="text-sm">{label}</span>
          {isComplete && (
            <span
              style={{ marginLeft: 'auto', color: 'var(--success)', fontSize: 14 }}
              aria-label="complete"
            >
              ✓
            </span>
          )}
        </div>
      );
    })}
  </div>
);

// ---------------------------------------------------------------------------
// Page content
// ---------------------------------------------------------------------------

export default function GeneratingContent({ projectId }) {
  const router = useRouter();
  const { project, progress, currentStep, completedSteps, error } =
    useGenerationPolling(projectId);

  if (error) {
    return (
      <GenerationErrorCard
        message={error}
        onBack={() => router.push('/dashboard')}
      />
    );
  }

  return (
    <div style={CENTERED_FULL_PAGE}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <PulsingOrb />
        <GenerationHeader projectName={project?.name} />
        <div className="card">
          <ProgressBar progress={progress} currentStep={currentStep} />
          <GenerationStepList
            stepLabels={GENERATION_STEP_LABELS}
            completedSteps={completedSteps}
          />
        </div>
      </div>
    </div>
  );
}
