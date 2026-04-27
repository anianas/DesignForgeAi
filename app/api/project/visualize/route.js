import { v4 as uuidv4 } from 'uuid';
import { projects, generationJobs } from '@/lib/store';
import { requireUser, jsonResponse } from '@/lib/auth';
import { runVisualization, VISUALIZE_STEPS } from '@/lib/generationService';

const newJobId = () => `job_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

export async function POST(req) {
  const { user, response } = requireUser(req);
  if (response) return response;

  const { projectId, designSystem } = await req.json().catch(() => ({}));
  if (!projectId) return jsonResponse({ error: 'projectId is required' }, 400);
  if (!designSystem) return jsonResponse({ error: 'designSystem is required' }, 400);

  const project = await projects.get(projectId);
  if (!project) return jsonResponse({ error: 'Project not found' }, 404);
  if (project.userId !== user.userId) return jsonResponse({ error: 'Access denied' }, 403);
  if (!project.concept) return jsonResponse({ error: 'Generate the concept brief first' }, 400);

  project.status = 'generating-ui';
  project.designSystem = designSystem;
  project.updatedAt = new Date().toISOString();
  await projects.set(projectId, project);

  const jobId = newJobId();
  generationJobs.set(jobId, {
    status: 'running',
    stage: 'visualize',
    steps: [],
    projectId,
    totalSteps: VISUALIZE_STEPS.length,
  });

  runVisualization(
    jobId,
    { projectType: project.projectType, prompt: project.prompt, designSystem },
    project.concept,
    (step) => {
      const job = generationJobs.get(jobId);
      job.steps.push({ ...step, completedAt: new Date().toISOString() });
      job.currentStep = step.label;
      job.progress = Math.round((job.steps.length / VISUALIZE_STEPS.length) * 100);
      generationJobs.set(jobId, job);
    },
  )
    .then(async (result) => {
      const fresh = await projects.get(projectId);
      if (!fresh) return;
      fresh.generation = result;
      fresh.status = result.status === 'complete' ? 'complete' : 'failed';
      if (result.error) fresh.lastError = result.error;
      fresh.updatedAt = new Date().toISOString();
      await projects.set(projectId, fresh);

      const job = generationJobs.get(jobId);
      if (job) {
        job.status = result.status;
        job.progress = 100;
        if (result.error) job.error = result.error;
        generationJobs.set(jobId, job);
      }
    })
    .catch(async (err) => {
      console.error('[visualize] runVisualization threw:', err);
      const fresh = await projects.get(projectId);
      if (fresh) {
        fresh.status = 'failed';
        fresh.lastError = err.message;
        await projects.set(projectId, fresh);
      }
      const job = generationJobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = err.message;
      }
    });

  return jsonResponse({ jobId, projectId, stage: 'visualize' }, 202);
}
