import { client } from "@/lib/prismic";

/**
 * Scènes Prismic → format TourViewer, dans les deux langues.
 *
 * Règle contenu JUUMO (Max, 2026-09-04) : tout vient du document `scene`
 * (titre, description courte/longue, catégorie, époque, badge, audio, vidéo,
 * vue d'arrivée) et s'édite depuis l'espace client ou le panneau
 * « Modifier dans la visite ». Aucun contenu en dur ici.
 *
 * Les points d'information (tags) sont du type `infospot`, rendus par le
 * bridge partagé juumo-edit : le site ne les lit pas ici.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function str(v: any): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

// Rich text Prismic → paragraphes non vides (null si rien)
function richTextToParagraphs(v: unknown): { text: string }[] | null {
  if (!Array.isArray(v)) return null;
  const out = (v as { text?: unknown }[])
    .map((b) => ({ text: typeof b?.text === "string" ? b.text : "" }))
    .filter((b) => b.text.trim().length > 0);
  return out.length > 0 ? out : null;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawScene = { id: string; uid: string; data: any };

/**
 * Mappe une scène FR (référence structurelle : ordre, krpano, médias) en
 * appliquant, si fourni, le document de la langue cible pour les textes.
 */
function mapScene(fr: RawScene, index: number, localized?: RawScene) {
  const d = fr.data;
  const l = localized?.data ?? d;
  const krpanoId = str(d.nom_scene_krpano) ?? str(d.krpano_id);
  const videoUrl = str(l.video_url) ?? str(d.video_url) ?? str(d.video_file?.url);
  return {
    id: fr.id,
    data: {
      nom_scene_krpano: krpanoId,
      title: str(l.title) ?? str(l.name) ?? str(d.title) ?? str(d.name),
      // Catégorie : libellé affiché = valeur stockée (pas de table de renommage)
      categorie: str(l.categorie) ?? str(d.categorie),
      ordre: typeof d.ordre === "number" ? d.ordre : index,
      badge: str(l.badge) ?? str(d.badge),
      epoque: str(l.epoque) ?? str(d.epoque),
      style_architectural: str(l.style_architectural) ?? str(d.style_architectural),
      element_remarquable: str(l.element_remarquable) ?? str(d.element_remarquable),

      description: richTextToParagraphs(l.description) ?? richTextToParagraphs(d.description),
      description_longue:
        richTextToParagraphs(l.description_longue) ?? richTextToParagraphs(d.description_longue),

      // Vue d'arrivée définie par le client (espace client / mode modification), lue par bridge.js
      vue_arrivee_ath: num(d.vue_arrivee_ath),
      vue_arrivee_atv: num(d.vue_arrivee_atv),
      vue_arrivee_fov: num(d.vue_arrivee_fov),

      // Médias : audio de la langue cible s'il existe, sinon celui du doc FR
      audio_file: str(l.audio_file?.url)
        ? { url: l.audio_file.url as string }
        : str(d.audio_file?.url)
          ? { url: d.audio_file.url as string }
          : null,
      video_url: videoUrl,
      video_ratio: null,

      // Pas de docs « informations » sur cette plateforme (points d'info = infospot, rendu partagé)
      informations_list: [],
    },
  };
}

/** Assemble les scènes bilingues (structure = docs FR ; textes EN = docs EN, même uid). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildScenesByLang(): Promise<{ fr: any[]; en: any[] }> {
  let fr: unknown[] = [];
  let en: unknown[] = [];
  try {
    const [rawFr, rawEn] = await Promise.all([
      client.getAllByType("scene", { lang: "fr-fr" }) as unknown as Promise<RawScene[]>,
      (client.getAllByType("scene", { lang: "en-us" }) as unknown as Promise<RawScene[]>).catch(
        () => [] as RawScene[]
      ),
    ]);
    const valid = rawFr.filter((s) => str(s.data?.nom_scene_krpano) ?? str(s.data?.krpano_id));
    const enByUid = new Map(rawEn.map((s) => [s.uid, s]));
    fr = valid.map((s, i) => mapScene(s, i));
    en = valid.map((s, i) => mapScene(s, i, enByUid.get(s.uid)));
  } catch {
    // Prismic non configuré — fallback sur DEFAULT_SCENES dans TourViewer
  }
  return { fr, en };
}
