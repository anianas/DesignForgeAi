import { projects } from '@/lib/store';
import { requireUser, jsonResponse, fetchOwnedProject } from '@/lib/auth';
import {
  runVisualization,
  VISUALIZE_STEPS,
  generateJobId,
  createJob,
  createStepCallback,
  finalizeVisualizationJob,
  handleJobError,
} from '@/lib/generationService';

export async function POST(req) {
  const { user, response } = requireUser(req);
  if (response) return response;

  const { projectId, designSystem } = await req.json().catch(() => ({}));
  if (!projectId) return jsonResponse({ error: 'projectId is required' }, 400);
  if (!designSystem) return jsonResponse({ error: 'designSystem is required' }, 400);

  const { project, error } = await fetchOwnedProject(projectId, user.userId);
  if (error) return error;

  if (!project.concept) return jsonResponse({ error: 'Generate the concept brief first' }, 400);

  project.status = 'generating-ui';
  project.designSystem = designSystem;
  project.updatedAt = new Date().toISOString();
  await projects.set(projectId, project);

  const jobId = generateJobId();
  createJob(jobId, projectId, 'visualize', VISUALIZE_STEPS.length);

  runVisualization(
    jobId,
    { projectType: project.projectType, prompt: project.prompt, designSystem },
    project.concept,
    createStepCallback(jobId, VISUALIZE_STEPS.length),
  )
    .then((result) => finalizeVisualizationJob(jobId, projectId, result))
    .catch((err) => handleJobError(jobId, projectId, err, 'visualize'));

  return jsonResponse({ jobId, projectId, stage: 'visualize' }, 202);
}
