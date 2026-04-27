'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ToastContext';
import Navbar from '@/components/Navbar';

const PROJECT_TYPES = [
  { id: 'dashboard', label: 'Dashboard',   desc: 'Metrics, charts, and data overview for internal teams.', icon: '▢' },
  { id: 'crm',       label: 'CRM',         desc: 'Contacts, pipeline, and activity tracking.',             icon: '◈' },
  { id: 'analytics', label: 'Analytics',   desc: 'Reports, funnels, and business intelligence.',           icon: '◇' },
  { id: 'admin',     label: 'Admin Panel', desc: 'Users, permissions, settings, and operations.',          icon: '◆' },
];

const PROMPT_SUGGESTIONS = [
  'A sales CRM with a kanban pipeline and contact table',
  'An analytics dashboard with KPIs, funnel charts, and date filters',
  'An admin panel for user management with role-based permissions',
  'A support ticket inbox with filters, assignments, and a detail pane',
];

const StepProjectType = ({ value, onChange }) => (
  <>
    <div className="mb-6">
      <h2 className="serif" style={{ fontSize: 36, letterSpacing: '-0.02em', marginBottom: 8 }}>
        What kind of B2B product are you imagining?
      </h2>
      <p className="text-muted">This shapes the product brief Claude will generate.</p>
    </div>
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      {PROJECT_TYPES.map((t) => (
        <div
          key={t.id}
          className={`card card-interactive ${value === t.id ? 'card-selected' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <div
            style={{
              fontSize: 24,
              color: value === t.id ? 'var(--accent)' : 'var(--text-tertiary)',
              marginBottom: 12,
            }}
          >
            {t.icon}
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>{t.label}</h3>
          <p className="text-sm text-muted">{t.desc}</p>
        </div>
      ))}
    </div>
  </>
);

const StepPrompt = ({ value, onChange, projectName, onNameChange }) => (
  <>
    <div className="mb-6">
      <h2 className="serif" style={{ fontSize: 36, letterSpacing: '-0.02em', marginBottom: 8 }}>
        Describe your B2B product idea
      </h2>
      <p className="text-muted">
        Be specific. Claude will generate a full concept brief — name, audience, features, value
        prop, KPIs — from this prompt.
      </p>
    </div>

    <div className="field">
      <label>Project name</label>
      <input
        type="text"
        value={projectName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="e.g. SalesFlow"
      />
      <span className="field-helper">
        Used as a label in your dashboard. The product name itself comes from Claude.
      </span>
    </div>

    <div className="field">
      <label>Your idea</label>
      <textarea
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. An AI-powered customer support inbox for SaaS teams that auto-triages incoming tickets, suggests responses based on past tickets, and tracks SLA breaches."
        style={{ resize: 'vertical', minHeight: 140, fontFamily: 'var(--font-sans)' }}
      />
      <span className="field-helper">
        {value.length} characters · aim for at least 40 for best results
      </span>
    </div>

    <div className="mt-4">
      <div
        className="text-xs mono mb-2"
        style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}
      >
        OR TRY ONE OF THESE
      </div>
      <div className="flex" style={{ flexWrap: 'wrap', gap: 8 }}>
        {PROMPT_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onChange(s)}
            style={{ textAlign: 'left' }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  </>
);

const WizardProgress = ({ step, total }) => (
  <div className="flex gap-2 mb-8">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        style={{
          flex: 1,
          height: 3,
          background: i < step ? 'var(--accent)' : 'var(--bg-surface)',
          borderRadius: 999,
          transition: 'background 300ms var(--ease)',
        }}
      />
    ))}
  </div>
);

export default function WizardPage() {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState({ projectType: null, name: '', prompt: '' });

  const update = (patch) => setState((prev) => ({ ...prev, ...patch }));
  const totalSteps = 2;

  const canAdvance = () => {
    switch (step) {
      case 1: return !!state.projectType;
      case 2: return state.name.trim().length > 0 && state.prompt.trim().length >= 10;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!canAdvance()) return;
    setSubmitting(true);
    try {
      const { project } = await api.createProject({
        name: state.name,
        projectType: state.projectType,
        prompt: state.prompt,
        startMode: 'scratch',
      });
      await api.generateProject(project.id);
      router.push(`/generate/${project.id}`);
    } catch (err) {
      toast.show(err.message || 'Failed to create project', 'error');
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container-narrow" style={{ padding: '48px 24px' }}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs mono" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
            STEP {step} OF {totalSteps}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard')}>
            Cancel
          </button>
        </div>

        <WizardProgress step={step} total={totalSteps} />

        <div style={{ minHeight: 420 }}>
          {step === 1 && (
            <StepProjectType
              value={state.projectType}
              onChange={(projectType) => update({ projectType })}
            />
          )}
          {step === 2 && (
            <StepPrompt
              value={state.prompt}
              projectName={state.name}
              onChange={(prompt) => update({ prompt })}
              onNameChange={(name) => update({ name })}
            />
          )}
        </div>

        <div
          className="flex justify-between mt-8"
          style={{ paddingTop: 24, borderTop: '1px solid var(--border)' }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            style={step === 1 ? { visibility: 'hidden' } : undefined}
          >
            ← Back
          </button>
          {step < totalSteps ? (
            <button
              className="btn btn-primary btn-lg"
              onClick={() => canAdvance() && setStep(step + 1)}
              disabled={!canAdvance()}
            >
              Continue →
            </button>
          ) : (
            <button
              className="btn btn-accent btn-lg"
              onClick={handleSubmit}
              disabled={!canAdvance() || submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner" /> Starting…
                </>
              ) : (
                <>Generate concept →</>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
