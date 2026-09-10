import TourViewer from "@/components/TourViewer";
import { SeoContent } from "@/components/SeoContent";
import { buildScenesByLang } from "@/lib/scenes-data";

// Prismic : revalidation 60 s + tag `prismic` (webhook /api/revalidate)
export const revalidate = 60;

export default async function Home() {
  const scenesByLang = await buildScenesByLang();
  return (
    <>
      {/* Contenu SSR sr-only : SEO/AEO + maillage vers les pages /scene/… */}
      <SeoContent />
      <TourViewer
        scenesByLang={{ fr: scenesByLang.fr as never[], en: scenesByLang.en as never[] }}
      />
    </>
  );
}
