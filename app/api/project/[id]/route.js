import { projects, generationJobs } from '@/lib/store';
import { requireUser, jsonResponse } from '@/lib/auth';

export async function GET(req, { params }) {
  const { user, response } = requireUser(req);
  if (response) return response;
  const { id } = await params;

  const project = await projects.get(id);
  if (!project) return jsonResponse({ error: 'Project not found' }, 404);
  if (project.userId !== user.userId) return jsonResponse({ error: 'Access denied' }, 403);

  let jobProgress = null;
  const isInProgress =
    project.status === 'generating-concept' || project.status === 'generating-ui';
  if (isInProgress) {
    for (const [, job] of generationJobs) {
      if (job.projectId === id && job.status === 'running') {
        jobProgress = {
          stage: job.stage,
          progress: job.progress || 0,
          currentStep: job.currentStep || 'Initializing…',
          totalSteps: job.totalSteps || 0,
          steps: job.steps || [],
        };
        break;
      }
    }
  }
  return jsonResponse({ project, jobProgress });
}

export async function DELETE(req, { params }) {
  const { user, response } = requireUser(req);
  if (response) return response;
  const { id } = await params;

  const project = await projects.get(id);
  if (!project) return jsonResponse({ error: 'Project not found' }, 404);
  if (project.userId !== user.userId) return jsonResponse({ error: 'Access denied' }, 403);

  project.status = 'deleted';
  project.deletedAt = new Date().toISOString();
  await projects.set(id, project);

  return jsonResponse({ message: 'Project deleted successfully' });
}
