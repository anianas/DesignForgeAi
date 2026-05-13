import { projects, generationJobs } from '@/lib/store';
import { requireUser, jsonResponse, fetchOwnedProject } from '@/lib/auth';

export async function GET(req, { params }) {
  const { user, response } = requireUser(req);
  if (response) return response;

  const { id } = await params;
  const { project, error } = await fetchOwnedProject(id, user.userId);
  if (error) return error;

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
  const { project, error } = await fetchOwnedProject(id, user.userId);
  if (error) return error;

  project.status = 'deleted';
  project.deletedAt = new Date().toISOString();
  await projects.set(id, project);

  return jsonResponse({ message: 'Project deleted successfully' });
}
