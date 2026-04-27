import { generateComponentCode, generateConcept } from './aiService';

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

const stepsAndAi = async (steps, aiPromise, onStep) => {
  for (const step of steps) {
    await new Promise((r) => setTimeout(r, Math.min(step.duration, 600)));
    if (onStep) onStep(step);
  }
  return aiPromise;
};

export const runConceptGeneration = async (jobId, projectData, onStep) => {
  let captureErr = null;
  const aiPromise = generateConcept(projectData.prompt, projectData.projectType).catch((err) => {
    captureErr = err.message || String(err);
    console.error('[AI] Concept generation failed:', err);
    return null;
  });
  const concept = await stepsAndAi(CONCEPT_STEPS, aiPromise, onStep);
  return {
    jobId,
    status: concept ? 'complete' : 'failed',
    stage: 'concept',
    concept,
    error: captureErr,
    generatedAt: new Date().toISOString(),
  };
};

export const runVisualization = async (jobId, projectData, concept, onStep) => {
  const dsInfo = DESIGN_SYSTEM_COVERAGE[projectData.designSystem] || DESIGN_SYSTEM_COVERAGE.material;
  let captureErr = null;
  const aiPromise = generateComponentCode(
    projectData.projectType,
    projectData.prompt,
    projectData.designSystem,
    concept,
  ).catch((err) => {
    captureErr = err.message || String(err);
    console.error('[AI] Code generation failed:', err);
    return null;
  });
  const generatedCode = await stepsAndAi(VISUALIZE_STEPS, aiPromise, onStep);
  return {
    jobId,
    status: generatedCode ? 'complete' : 'failed',
    stage: 'visualize',
    designSystem: dsInfo,
    generatedCode,
    error: captureErr,
    generatedAt: new Date().toISOString(),
    downloadUrl: `/api/download/${jobId}`,
  };
};
