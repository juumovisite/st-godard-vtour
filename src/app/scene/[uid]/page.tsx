import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { client } from "@/lib/prismic";
import TourViewer from "@/components/TourViewer";

export const revalidate = 3600;
export const dynamicParams = true;

const BASE_URL = "https://st-godard-vtour.vercel.app";

type SceneDoc = {
  uid: string;
  data: {
    title?: string;
    nom_scene_krpano?: string;
    description?: { text: string }[];
    categorie?: string;
    image_apercu?: { url?: string };
  };
};

const plain = (rt?: { text: string }[]) =>
  (rt ?? []).map(b => b.text).join(" ").trim();

async function getScenes(): Promise<SceneDoc[]> {
  try {
    return (await client.getAllByType("scene")) as unknown as SceneDoc[];
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  const scenes = await getScenes();
  return scenes.filter(s => s.uid).map(s => ({ uid: s.uid }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ uid: string }>;
}): Promise<Metadata> {
  const { uid } = await params;
  const scene = (await getScenes()).find(s => s.uid === uid);
  if (!scene) return {};
  const name = scene.data.title ?? uid;
  const title = `${name} — Visite virtuelle 360°`;
  const description =
    plain(scene.data.description) ||
    `Découvrez ${name} en visite virtuelle 360° JUUMO.`;
  const image = scene.data.image_apercu?.url;
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/scene/${uid}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/scene/${uid}`,
      type: "website",
      ...(image ? { images: [{ url: image }] } : {})
    }
  };
}

export default async function ScenePage({
  params
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const scenes = await getScenes();
  const scene = scenes.find(s => s.uid === uid);
  if (!scene) notFound();
  const name = scene.data.title ?? uid;
  const description = plain(scene.data.description);
  return (
    <>
      <div className="sr-only">
        <h1>{name}</h1>
        {scene.data.categorie ? <p>Catégorie : {scene.data.categorie}</p> : null}
        {description ? <p>{description}</p> : null}
      </div>
      <TourViewer scenes={scenes as never[]} initialScene={scene.data.nom_scene_krpano} />
    </>
  );
}
