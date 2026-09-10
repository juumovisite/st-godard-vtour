import { client } from "@/lib/prismic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function str(v: any): string | null {
  return typeof v === "string" ? v : null;
}

// Construit un map krpano_id → tableau de docs informations (1 par vitrail, hotspot, etc.)
// On utilise TOUJOURS les scènes FR comme référence pour les UIDs
// (les scènes EN peuvent ne pas avoir krpano_id renseigné)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildInfoMap(refScenes: any[], infos: any[]): Record<string, any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map: Record<string, any[]> = {};
  for (const info of infos) {
    if (!info.uid) continue;
    const matched = refScenes.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => s.data.krpano_id && info.uid.startsWith(s.data.krpano_id)
    );
    if (matched) {
      const key = matched.data.krpano_id;
      if (!map[key]) map[key] = [];
      map[key].push(info);
    }
  }
  return map;
}

// Mappe les scènes Prismic → format TourViewer
// textInfoMap    : informations dans la langue cible (descriptions)
// mediaInfoMap   : informations FR (URLs audio/vidéo — identiques quelle que soit la langue)
// titleOverrides : krpano_id → titre traduit (pour EN quand on utilise FR comme base structurelle)
function mapScenes(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scenes: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  textInfoMap: Record<string, any[]>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mediaInfoMap?: Record<string, any[]>,
  titleOverrides?: Record<string, string>
): unknown[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return scenes.map((s: any, index: number) => {
    const krpanoId    = str(s.data.krpano_id);
    const title       = (krpanoId && titleOverrides?.[krpanoId]) ?? str(s.data.name);
    const textInfos   = textInfoMap[krpanoId ?? ""] ?? [];
    const mediaInfos  = (mediaInfoMap ?? textInfoMap)[krpanoId ?? ""] ?? [];
    // Premier élément pour backward compat (audio_file, video_url)
    const firstMedia  = mediaInfos[0];
    const firstText   = textInfos[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isGenericItem = (info: any) => {
      const labelRaw = info?.data?.audio_name;
      const label: string = Array.isArray(labelRaw) && labelRaw[0]?.text ? labelRaw[0].text : "";
      return label.toLowerCase().startsWith("bienvenu");
    };

    // Lookup textInfo par UID (FR/EN partagent le même UID dans Prismic)
    // → garantit que le texte/label traduit correspond au bon média, peu importe l'ordre
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textByUid: Record<string, any> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const ti of textInfos) if (ti?.uid) textByUid[ti.uid] = ti;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const informations_list = mediaInfos.filter((info: any) => !isGenericItem(info)).map((mediaInfo: any, i: number) => {
      const textInfo = (mediaInfo?.uid && textByUid[mediaInfo.uid]) ?? textInfos[i] ?? firstText;
      // Label : audio_name traduit (textInfo) en priorité, sinon FR (mediaInfo)
      const labelRaw = textInfo?.data?.audio_name ?? mediaInfo?.data?.audio_name;
      const label = Array.isArray(labelRaw) && labelRaw[0]?.text ? labelRaw[0].text as string : null;
      // Description traduite
      const txt = textInfo?.data?.txt;
      const description =
        Array.isArray(txt) && txt.length > 0
          ? (txt as { text?: string }[])
              .map((b) => ({ text: typeof b.text === "string" ? b.text : "" }))
              .filter((b) => b.text.trim().length > 0)
          : null;
      return {
        label,
        description,
        audio_file: mediaInfo?.data?.audio?.url
          ? { url: mediaInfo.data.audio.url as string }
          : null,
        video_url: str(mediaInfo?.data?.video?.embed_url) ?? null,
        video_ratio:
          mediaInfo?.data?.video?.width && mediaInfo?.data?.video?.height
            ? (mediaInfo.data.video.width as number) / (mediaInfo.data.video.height as number)
            : null,
      };
    })
    // On exclut tout hotspot sans titre (audio_name vide) → plus de "Élément N" affiché
    .filter((item) => item.label != null && item.label.trim().length > 0);

    return {
      id: s.id,
      data: {
        nom_scene_krpano: krpanoId,
        title,
        categorie: str(s.data.category?.uid),
        ordre:     typeof s.data.ordre === "number" ? s.data.ordre : index,

        // Liste complète des informations (une par vitrail, hotspot, etc.)
        informations_list,

        // Backward compat — premier élément
        description:
          firstText?.data?.txt && Array.isArray(firstText.data.txt) && firstText.data.txt.length > 0
            ? (firstText.data.txt as { text?: string }[])
                .map((b) => ({ text: typeof b.text === "string" ? b.text : "" }))
                .filter((b) => b.text.trim().length > 0)
            : null,
        audio_file: firstMedia?.data?.audio?.url
          ? { url: firstMedia.data.audio.url as string }
          : null,
        // Vidéo : informations en priorité, sinon champ scène
        video_url:
          str(firstMedia?.data?.video?.embed_url) ??
          str(s.data.video?.embed_url),
        video_ratio:
          firstMedia?.data?.video?.width && firstMedia?.data?.video?.height
            ? (firstMedia.data.video.width as number) / (firstMedia.data.video.height as number)
            : s.data.video?.width && s.data.video?.height
              ? (s.data.video.width as number) / (s.data.video.height as number)
              : null,
      },
    };
  });
}

/** Assemble les scenes bilingues (logique identique a la home). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildScenesByLang(): Promise<{ fr: any[]; en: any[] }> {
  let scenesFr: unknown[] = [];
  let scenesEn: unknown[] = [];
  try {
    const [rawScenesFr, rawScenesEn, rawInfosFr, rawInfosEn] = await Promise.all([
      client.getAllByType("scene", { lang: "fr-fr" }),
      client.getAllByType("scene", { lang: "en-us" }).catch(() => []),
      client.getAllByType("informations", { lang: "fr-fr" }).catch(() => []),
      client.getAllByType("informations", { lang: "en-us" }).catch(() => []),
    ]);

    // FR : map normal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const infoMapFr = buildInfoMap(rawScenesFr as any[], rawInfosFr as any[]);

    // EN : on matche les infos EN avec les scènes FR (référence pour krpano_id)
    // → textes ET médias (audio/vidéo EN) proviennent des docs EN
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const infoMapEn = buildInfoMap(rawScenesFr as any[], rawInfosEn as any[]);

    scenesFr = mapScenes(rawScenesFr as any[], infoMapFr);

    // EN : toujours rawScenesFr comme base structurelle (les scènes EN n'ont pas krpano_id renseigné)
    // On récupère les titres EN depuis rawScenesEn en matchant par UID (même UID entre langues Prismic)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enTitleMap: Record<string, string> = {};
    for (const enScene of rawScenesEn as any[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const frScene = (rawScenesFr as any[]).find((s: any) => s.uid === enScene.uid);
      if (frScene?.data?.krpano_id && enScene.data.name) {
        enTitleMap[frScene.data.krpano_id] = enScene.data.name;
      }
    }
    // Médias = infoMapEn (audio/vidéo EN), titres = enTitleMap, structure = scènes FR
    scenesEn = mapScenes(rawScenesFr as any[], infoMapEn, infoMapEn, enTitleMap);

  } catch {
    // Prismic non configuré — fallback sur DEFAULT_SCENES dans TourViewer
  }

  return { fr: scenesFr, en: scenesEn };
}
