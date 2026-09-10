import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { client } from "@/lib/prismic";
import { buildScenesByLang } from "@/lib/scenes-data";
import TourViewer from "@/components/TourViewer";
import { SCENES_SEO } from "@/config/seo-scenes";

const BASE_URL = "https://saintejeannedarc.juumo.fr";
const SITE = "Église Sainte-Jeanne-d'Arc de Rouen";

type SceneDoc = {
  uid: string;
  data: {
    title?: string;
    name?: string;
    krpano_id?: string;
    nom_scene_krpano?: string;
  };
};

async function getScenes(): Promise<SceneDoc[]> {
  try {
    return (await client.getAllByType("scene", {
      lang: "fr-fr",
    })) as unknown as SceneDoc[];
  } catch {
    return [];
  }
}

const krpanoOf = (s: SceneDoc) => s.data.krpano_id || s.data.nom_scene_krpano;
const titleOf = (s: SceneDoc) => s.data.title || s.data.name || s.uid;

export async function generateStaticParams() {
  const scenes = await getScenes();
  return scenes.filter(s => s.uid && krpanoOf(s)).map(s => ({ uid: s.uid }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uid: string }>;
}): Promise<Metadata> {
  const { uid } = await params;
  const scene = (await getScenes()).find(s => s.uid === uid);
  if (!scene) return {};
  const name = titleOf(scene);
  // Title + description uniques par scène (src/config/seo-scenes.ts), fallback générique sinon.
  const seo = SCENES_SEO[uid];
  const title = seo?.title ?? `${name} — ${SITE} en visite virtuelle 360°`;
  const description =
    seo?.description ??
    `Découvrez ${name} en visite virtuelle 360° — ${SITE}, chef-d'œuvre d'architecture moderne sur la place du Vieux-Marché, vitraux Renaissance classés.`;
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/scene/${uid}` },
    openGraph: { title, description, url: `${BASE_URL}/scene/${uid}`, type: "website" },
  };
}

export default async function ScenePage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const scenes = await getScenes();
  const scene = scenes.find(s => s.uid === uid);
  if (!scene || !krpanoOf(scene)) notFound();
  const name = titleOf(scene);
  const scenesByLang = await buildScenesByLang();
  // Contenu SEO/AEO unique par scène + maillage interne (src/config/seo-scenes.ts).
  const seo = SCENES_SEO[uid];
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: `Visite virtuelle 360° — ${SITE}`,
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: seo?.title ?? name,
        item: `${BASE_URL}/scene/${uid}`,
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        // Données statiques (seo-scenes.ts + uid Prismic) : aucun risque XSS
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <div className="sr-only">
        <h1>{seo?.title ?? `${name} — ${SITE}`}</h1>
        {seo ? (
          <>
            {seo.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            <h2>À voir aussi dans la visite</h2>
            <ul>
              {seo.related.map(r => (
                <li key={r.uid}>
                  <Link prefetch={false} href={`/scene/${r.uid}`}>{r.label}</Link>
                </li>
              ))}
            </ul>
            <p>
              <Link prefetch={false} href="/">
                Retour à la visite virtuelle complète de l&apos;église
                Sainte-Jeanne-d&apos;Arc de Rouen
              </Link>{" "}
              — <a href="https://eglises-rouen.juumo.fr">toutes les églises de
              Rouen en 360°</a>.
            </p>
          </>
        ) : (
          <p>
            Visite virtuelle 360° de l&apos;église Sainte-Jeanne-d&apos;Arc,
            place du Vieux-Marché à Rouen : architecture de Louis Arretche,
            vitraux Renaissance de Saint-Vincent.
          </p>
        )}
      </div>
      <TourViewer
        scenesByLang={{ fr: scenesByLang.fr as never[], en: scenesByLang.en as never[] }}
        initialScene={krpanoOf(scene)}
      />
    </>
  );
}
