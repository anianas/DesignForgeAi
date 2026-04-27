import { projects } from '@/lib/store';
import { requireUser, jsonResponse } from '@/lib/auth';
import { buildProjectZipResponse } from '@/lib/zip';

export async function GET(req, { params }) {
  const { user, response } = requireUser(req);
  if (response) {
    return jsonResponse(
      { error: 'Please sign in to download your generated project.', code: 'AUTH_REQUIRED' },
      401,
    );
  }
  const { id } = await params;

  const project = await projects.get(id);
  if (!project) return jsonResponse({ error: 'Project not found' }, 404);
  if (project.userId !== user.userId) return jsonResponse({ error: 'Access denied' }, 403);
  if (project.status !== 'complete') {
    return jsonResponse({ error: 'Project generation is not yet complete' }, 400);
  }

  return buildProjectZipResponse(project);
}
