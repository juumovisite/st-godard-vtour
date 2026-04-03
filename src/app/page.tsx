import { client } from "@/lib/prismic";
import TourViewer from "@/components/TourViewer";

export default async function Home() {
  let scenes: unknown[] = [];
  try {
    scenes = await client.getAllByType("scene");
  } catch {
    // Prismic not configured yet — fallback to defaults
  }

  return <TourViewer scenes={scenes as never[]} />;
}
