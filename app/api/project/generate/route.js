import { v4 as uuidv4 } from 'uuid';
import { projects, generationJobs } from '@/lib/store';
import { requireUser, jsonResponse } from '@/lib/auth';
import { runConceptGeneration, CONCEPT_STEPS } from '@/lib/generationService';

const newJobId = () => `job_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

export async function POST(req) {
  const { user, response } = requireUser(req);
  if (response) return response;

  const { projectId } = await req.json().catch(() => ({}));
  if (!projectId) return jsonResponse({ error: 'projectId is required' }, 400);

  const project = await projects.get(projectId);
  if (!project) return jsonResponse({ error: 'Project not found' }, 404);
  if (project.userId !== user.userId) return jsonResponse({ error: 'Access denied' }, 403);

  project.status = 'generating-concept';
  project.updatedAt = new Date().toISOString();
  await projects.set(projectId, project);

  const jobId = newJobId();
  generationJobs.set(jobId, {
    status: 'running',
    stage: 'concept',
    steps: [],
    projectId,
    totalSteps: CONCEPT_STEPS.length,
  });

  // Fire and forget — client polls GET /api/project/[id] for status.
  runConceptGeneration(
    jobId,
    { projectType: project.projectType, prompt: project.prompt },
    (step) => {
      const job = generationJobs.get(jobId);
      job.steps.push({ ...step, completedAt: new Date().toISOString() });
      job.currentStep = step.label;
      job.progress = Math.round((job.steps.length / CONCEPT_STEPS.length) * 100);
      generationJobs.set(jobId, job);
    },
  )
    .then(async (result) => {
      const fresh = await projects.get(projectId);
      if (!fresh) return;
      fresh.concept = result.concept;
      fresh.status = result.status === 'complete' ? 'concept-ready' : 'failed';
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
      console.error('[generate] runConceptGeneration threw:', err);
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

  return jsonResponse({ jobId, projectId, stage: 'concept' }, 202);
}
