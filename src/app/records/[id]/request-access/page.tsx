import RequestAccessClient from "./RequestAccessClient";

interface RequestAccessPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RequestAccessPage({
  params,
}: RequestAccessPageProps) {
  const resolvedParams = await params;
  return <RequestAccessClient studentId={resolvedParams.id} />;
}
