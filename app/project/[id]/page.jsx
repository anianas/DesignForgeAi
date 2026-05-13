import ProjectContent from './ProjectContent';

export default async function ProjectPage({ params }) {
  const { id } = await params;
  return <ProjectContent projectId={id} />;
}
