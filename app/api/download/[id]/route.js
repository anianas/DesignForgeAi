import { requireUser, jsonResponse, fetchOwnedProject } from '@/lib/auth';
import { buildProjectZipResponse } from '@/lib/zip';

export async function GET(req, { params }) {
  const { user, response } = requireUser(req);
  if (response) {
    // Override with a more descriptive message for the download context.
    return jsonResponse(
      { error: 'Please sign in to download your generated project.', code: 'AUTH_REQUIRED' },
      401,
    );
  }

  const { id } = await params;
  const { project, error } = await fetchOwnedProject(id, user.userId);
  if (error) return error;

  if (project.status !== 'complete') {
    return jsonResponse({ error: 'Project generation is not yet complete' }, 400);
  }

  return buildProjectZipResponse(project);
}
