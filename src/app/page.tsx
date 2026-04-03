import VirtualTourPage from "@/components/VirtualTourPage";
import { client } from "@/prismicio";

async function getPageData() {
  try {
    const page = await client.getSingle("virtual_tour");
    return page;
  } catch {
    return null;
  }
}

export default async function Home() {
  const page = await getPageData();

  return (
    <VirtualTourPage
      title={(page?.data?.title as string) ?? undefined}
      description={(page?.data?.description as string) ?? undefined}
      startScene={(page?.data?.start_scene as string) ?? undefined}
    />
  );
}
