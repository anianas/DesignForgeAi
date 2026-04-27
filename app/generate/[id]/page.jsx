'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ToastContext';

const DYNAMIC_MESSAGES = [
  'Analyzing your idea…',
  'Identifying target audience…',
  'Mapping product features…',
  'Drafting value proposition…',
  'Selecting success metrics…',
];

export default function GeneratingPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing…');
  const [completedSteps, setCompletedSteps] = useState([]);
  const [error, setError] = useState(null);

  const pollRef = useRef(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const { project, jobProgress } = await api.getProject(id);
        setProject(project);
        if (jobProgress) {
          setProgress(jobProgress.progress);
          setCurrentStep(jobProgress.currentStep);
          setCompletedSteps(jobProgress.steps || []);
        }
        if (project.status === 'concept-ready' || project.status === 'complete') {
          clearInterval(pollRef.current);
          setProgress(100);
          setTimeout(() => router.push(`/project/${id}`), 600);
        } else if (project.status === 'failed') {
          clearInterval(pollRef.current);
          setError('Generation failed. Error code: GEN_500');
          toast.show('Generation failed. Please try again.', 'error');
        }
      } catch (err) {
        clearInterval(pollRef.current);
        setError(err.message);
      }
    };
    poll();
    pollRef.current = setInterval(poll, 1500);
    return () => clearInterval(pollRef.current);
  }, [id, router, toast]);

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
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
          <p className="text-muted mb-6">{error}</p>
          <div className="flex gap-2" style={{ justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={() => router.push('/dashboard')}>
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 560 }}>
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

        <div className="text-center mb-8">
          <div className="text-xs mono mb-2" style={{ color: 'var(--accent)', letterSpacing: '0.15em' }}>
            DRAFTING CONCEPT
          </div>
          <h1 className="serif" style={{ fontSize: 40, letterSpacing: '-0.02em', marginBottom: 12 }}>
            {project?.name || 'Your project'}
          </h1>
          <p className="text-muted">Claude is writing your product brief — usually under 30 seconds.</p>
        </div>

        <div className="card">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm" style={{ fontWeight: 500 }}>{currentStep}</span>
              <span className="text-sm mono text-muted">{progress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div>
            {DYNAMIC_MESSAGES.map((msg, i) => {
              const done = completedSteps.length > i;
              const active = completedSteps.length === i;
              return (
                <div
                  key={msg}
                  className={`step-item ${active ? 'active' : ''} ${done ? 'complete' : ''}`}
                >
                  <span className="step-dot" />
                  <span className="text-sm">{msg}</span>
                  {done && (
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
        </div>
      </div>
    </div>
  );
}
