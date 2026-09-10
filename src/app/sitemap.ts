import type { MetadataRoute } from "next";

import { client } from "@/lib/prismic";

const BASE_URL = "https://saintgodard.juumo.fr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let scenes: { uid: string }[] = [];
  try {
    scenes = (await client.getAllByType("scene", {
      lang: "fr-fr",
    })) as unknown as { uid: string }[];
  } catch {
    scenes = [];
  }
  const now = new Date();
  return [
    { url: BASE_URL, lastModified: now, priority: 1 },
    ...scenes.filter(s => s.uid).map(s => ({
      url: `${BASE_URL}/scene/${s.uid}`,
      lastModified: now,
      priority: 0.8,
    })),
  ];
}
