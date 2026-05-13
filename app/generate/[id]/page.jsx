import GeneratingContent from './GeneratingContent';

export default async function GeneratingPage({ params }) {
  const { id } = await params;
  return <GeneratingContent projectId={id} />;
}
