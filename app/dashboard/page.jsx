'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/ToastContext';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';

const StatusBadge = ({ status }) => {
  const map = {
    complete: { label: 'UI ready', variant: 'success' },
    'concept-ready': { label: 'Brief ready', variant: 'success' },
    'generating-concept': { label: 'Drafting brief', variant: 'warning' },
    'generating-ui': { label: 'Building UI', variant: 'warning' },
    draft: { label: 'Draft', variant: 'info' },
    failed: { label: 'Failed', variant: 'error' },
    deleted: { label: 'Deleted', variant: 'error' },
  };
  const { label, variant } = map[status] || { label: status, variant: 'info' };
  return <span className={`badge badge-${variant}`}>{label}</span>;
};

const ProjectCard = ({ project, onDelete, onOpen }) => {
  const created = new Date(project.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return (
    <div
      className="card card-interactive"
      onClick={onOpen}
      style={{ position: 'relative', padding: 0, overflow: 'hidden' }}
    >
      <div
        style={{
          height: 140,
          background: 'linear-gradient(135deg, #22222C 0%, #1A1A22 100%)',
          position: 'relative',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 16,
            borderRadius: 8,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            padding: 8,
            gap: 4,
          }}
        >
          <div style={{ height: 6, width: '60%', background: 'var(--bg-hover)', borderRadius: 2 }} />
          <div style={{ height: 6, width: '40%', background: 'var(--bg-hover)', borderRadius: 2 }} />
          <div style={{ flex: 1, marginTop: 4, background: 'var(--bg-hover)', borderRadius: 4 }} />
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <StatusBadge status={project.status} />
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 500,
                marginBottom: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {project.name}
            </h3>
            <p className="text-xs text-dim">
              {project.projectType}
              {project.designSystem ? ` · ${project.designSystem}` : ''} · {created}
            </p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete project"
            aria-label="Delete project"
            style={{ padding: '4px 8px', minWidth: 0 }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchProjects = async () => {
    try {
      const { projects } = await api.listProjects();
      setProjects(projects.filter((p) => p.status !== 'deleted'));
    } catch (err) {
      toast.show(err.message || 'Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpen = (project) => {
    if (project.status === 'generating-concept') return router.push(`/generate/${project.id}`);
    return router.push(`/project/${project.id}`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteProject(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.show('Project deleted. Recoverable for 30 days.', 'info');
    } catch (err) {
      toast.show(err.message || 'Delete failed', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '48px 32px' }}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="serif" style={{ fontSize: 40, letterSpacing: '-0.02em', marginBottom: 4 }}>
              Your projects
            </h1>
            <p className="text-muted">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}. Pick up where you left off.
            </p>
          </div>
          <Link href="/new" className="btn btn-primary btn-lg">
            <span>+</span> New project
          </Link>
        </div>

        {loading ? (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ padding: 0 }}>
                <div className="skeleton" style={{ height: 140, borderRadius: '16px 16px 0 0' }} />
                <div style={{ padding: 20 }}>
                  <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 11, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="card text-center" style={{ padding: '80px 24px', borderStyle: 'dashed' }}>
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 20px',
                borderRadius: 16,
                background: 'var(--accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
              }}
            >
              ✨
            </div>
            <h2 className="serif mb-2" style={{ fontSize: 28 }}>
              Let&apos;s build your first project
            </h2>
            <p className="text-muted mb-6" style={{ maxWidth: 400, margin: '0 auto 24px' }}>
              Describe a B2B idea — DesignForge will generate a concept brief and an interactive UI mock.
            </p>
            <Link href="/new" className="btn btn-primary btn-lg">
              Create new project →
            </Link>
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={() => handleOpen(p)}
                onDelete={() => setDeleteTarget(p)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <h2 className="serif mb-2" style={{ fontSize: 24 }}>
          Delete this project?
        </h2>
        <p className="text-muted mb-6">
          &ldquo;{deleteTarget?.name}&rdquo; will be soft-deleted. You can recover it for the next 30 days
          from your account settings.
        </p>
        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </button>
          <button
            className="btn"
            style={{ background: 'var(--error)', color: 'white' }}
            onClick={confirmDelete}
          >
            Delete project
          </button>
        </div>
      </Modal>
    </>
  );
}
