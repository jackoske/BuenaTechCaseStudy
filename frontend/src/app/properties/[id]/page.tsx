import { PropertyDetail } from "@/components/PropertyDetail/PropertyDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  return <PropertyDetail id={parseInt(id)} />;
}
