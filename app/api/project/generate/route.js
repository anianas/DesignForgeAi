import { projects } from '@/lib/store';
import { requireUser, jsonResponse, fetchOwnedProject } from '@/lib/auth';
import {
  runConceptGeneration,
  CONCEPT_STEPS,
  generateJobId,
  createJob,
  createStepCallback,
  finalizeConceptJob,
  handleJobError,
} from '@/lib/generationService';

export async function POST(req) {
  const { user, response } = requireUser(req);
  if (response) return response;

  const { projectId } = await req.json().catch(() => ({}));
  if (!projectId) return jsonResponse({ error: 'projectId is required' }, 400);

  const { project, error } = await fetchOwnedProject(projectId, user.userId);
  if (error) return error;

  project.status = 'generating-concept';
  project.updatedAt = new Date().toISOString();
  await projects.set(projectId, project);

  const jobId = generateJobId();
  createJob(jobId, projectId, 'concept', CONCEPT_STEPS.length);

  // Fire and forget — client polls GET /api/project/[id] for status.
  runConceptGeneration(
    jobId,
    { projectType: project.projectType, prompt: project.prompt },
    createStepCallback(jobId, CONCEPT_STEPS.length),
  )
    .then((result) => finalizeConceptJob(jobId, projectId, result))
    .catch((err) => handleJobError(jobId, projectId, err, 'generate'));

  return jsonResponse({ jobId, projectId, stage: 'concept' }, 202);
}
