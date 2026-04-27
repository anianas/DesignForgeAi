import { v4 as uuidv4 } from 'uuid';
import { projects } from '@/lib/store';
import { requireUser, jsonResponse } from '@/lib/auth';

export async function GET(req) {
  const { user, response } = requireUser(req);
  if (response) return response;

  const all = await projects.values({ userId: user.userId });
  all.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return jsonResponse({ projects: all });
}

// POST /api/project — create. (Original Express had POST /project/create, but we
// can keep both — we expose /create for compat below.)
export async function POST(req) {
  return createHandler(req);
}

const createHandler = async (req) => {
  const { user, response } = requireUser(req);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { name, projectType, prompt, startMode, figmaFileUrl } = body;

  if (!name || !projectType) {
    return jsonResponse({ error: 'Project name and type are required' }, 400);
  }
  if (!prompt || prompt.trim().length < 10) {
    return jsonResponse({ error: 'Please describe your idea (min 10 characters)' }, 400);
  }

  const project = {
    id: `proj_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
    userId: user.userId,
    name,
    projectType,
    prompt,
    startMode: startMode || 'scratch',
    figmaFileUrl: figmaFileUrl || null,
    designSystem: null,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    thumbnail: null,
    concept: null,
    generation: null,
  };
  await projects.set(project.id, project);
  return jsonResponse({ project }, 201);
};

export { createHandler };
