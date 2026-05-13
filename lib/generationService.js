import { v4 as uuidv4 } from 'uuid';
import { generateComponentCode, generateConcept } from './aiService';
import { generationJobs, projects } from './store';

export const DESIGN_SYSTEM_COVERAGE = {
  material: { name: 'Material UI (v9)', coverage: 91, color: '#1565C0' },
  ant:      { name: 'Ant Design (6.x)', coverage: 88, color: '#1677FF' },
  carbon:   { name: 'IBM Carbon (11)',  coverage: 82, color: '#0F62FE' },
  mantine:  { name: 'Mantine (v7)',     coverage: 81, color: '#228be6' },
  chakra:   { name: 'Chakra UI (v2)',   coverage: 76, color: '#319795' },
};

export const CONCEPT_STEPS = [
  { id: 1, label: 'Analyzing your idea',           duration: 600 },
  { id: 2, label: 'Identifying target audience',   duration: 800 },
  { id: 3, label: 'Mapping product features',      duration: 800 },
  { id: 4, label: 'Drafting value proposition',    duration: 600 },
  { id: 5, label: 'Selecting success metrics',     duration: 500 },
];

export const VISUALIZE_STEPS = [
  { id: 1, label: 'Mapping concept to UI sections', duration: 600 },
  { id: 2, label: 'Selecting components',           duration: 700 },
  { id: 3, label: 'Generating React component tree', duration: 1500 },
  { id: 4, label: 'Applying design tokens',         duration: 600 },
  { id: 5, label: 'Validating output',              duration: 400 },
];

/** Fires each step callback with a capped delay, then resolves the already-running AI promise. */
const runAnimatedSteps = async (steps, aiPromise, onStep) => {
  for (const step of steps) {
    await new Promise((r) => setTimeout(r, Math.min(step.duration, 600)));
    if (onStep) onStep(step);
  }
  return aiPromise;
};

export const runConceptGeneration = async (jobId, projectData, onStep) => {
  let errorMessage = null;
  const aiPromise = generateConcept(projectData.prompt, projectData.projectType).catch((err) => {
    errorMessage = err.message || String(err);
    console.error('[AI] Concept generation failed:', err);
    return null;
  });
  const concept = await runAnimatedSteps(CONCEPT_STEPS, aiPromise, onStep);
  return {
    jobId,
    status: concept ? 'complete' : 'failed',
    stage: 'concept',
    concept,
    error: errorMessage,
    generatedAt: new Date().toISOString(),
  };
};

export const runVisualization = async (jobId, projectData, concept, onStep) => {
  const dsInfo = DESIGN_SYSTEM_COVERAGE[projectData.designSystem] || DESIGN_SYSTEM_COVERAGE.material;
  let errorMessage = null;
  const aiPromise = generateComponentCode(
    projectData.projectType,
    projectData.prompt,
    projectData.designSystem,
    concept,
  ).catch((err) => {
    errorMessage = err.message || String(err);
    console.error('[AI] Code generation failed:', err);
    return null;
  });
  const generatedCode = await runAnimatedSteps(VISUALIZE_STEPS, aiPromise, onStep);
  return {
    jobId,
    status: generatedCode ? 'complete' : 'failed',
    stage: 'visualize',
    designSystem: dsInfo,
    generatedCode,
    error: errorMessage,
    generatedAt: new Date().toISOString(),
    downloadUrl: `/api/download/${jobId}`,
  };
};

// ---------------------------------------------------------------------------
// Job management helpers — used by the generate and visualize route handlers.
// ---------------------------------------------------------------------------

export const generateJobId = () => `job_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

export const createJob = (jobId, projectId, stage, totalSteps) => {
  generationJobs.set(jobId, { status: 'running', stage, steps: [], projectId, totalSteps });
};

/** Returns a step-progress callback that updates the in-memory job record. */
export const createStepCallback = (jobId, totalSteps) => (step) => {
  const job = generationJobs.get(jobId);
  if (!job) return;
  job.steps.push({ ...step, completedAt: new Date().toISOString() });
  job.currentStep = step.label;
  job.progress = Math.round((job.steps.length / totalSteps) * 100);
  generationJobs.set(jobId, job);
};

const updateJobResult = (jobId, result) => {
  const job = generationJobs.get(jobId);
  if (!job) return;
  job.status = result.status;
  job.progress = 100;
  if (result.error) job.error = result.error;
  generationJobs.set(jobId, job);
};

const markJobFailed = (jobId, errorMessage) => {
  const job = generationJobs.get(jobId);
  if (!job) return;
  job.status = 'failed';
  job.error = errorMessage;
  generationJobs.set(jobId, job);
};

/** Persists concept generation results to the project document and finalizes the job. */
export const finalizeConceptJob = async (jobId, projectId, result) => {
  const project = await projects.get(projectId);
  if (project) {
    project.concept = result.concept;
    project.status = result.status === 'complete' ? 'concept-ready' : 'failed';
    if (result.error) project.lastError = result.error;
    project.updatedAt = new Date().toISOString();
    await projects.set(projectId, project);
  }
  updateJobResult(jobId, result);
};

/** Persists visualization results to the project document and finalizes the job. */
export const finalizeVisualizationJob = async (jobId, projectId, result) => {
  const project = await projects.get(projectId);
  if (project) {
    project.generation = result;
    project.status = result.status === 'complete' ? 'complete' : 'failed';
    if (result.error) project.lastError = result.error;
    project.updatedAt = new Date().toISOString();
    await projects.set(projectId, project);
  }
  updateJobResult(jobId, result);
};

/** Handles an unexpected throw from a generation run — marks both project and job as failed. */
export const handleJobError = async (jobId, projectId, err, logPrefix) => {
  console.error(`[${logPrefix}] threw:`, err);
  const project = await projects.get(projectId);
  if (project) {
    project.status = 'failed';
    project.lastError = err.message;
    await projects.set(projectId, project);
  }
  markJobFailed(jobId, err.message);
};
