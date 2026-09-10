import { asText, type RichTextField } from "@prismicio/client";
import { client } from "@/lib/prismic";

/**
 * Contenu de la visite injecté dans le prompt du chatbot Juumi.
 *
 * Règle JUUMO (Max, 2026-09-04) : le guide répond à partir de TOUT le contenu
 * texte de la plateforme (scènes, catégories, descriptions, points
 * d'information) tel qu'il est édité dans l'espace client — jamais depuis une
 * copie figée dans le code. Il connaît aussi l'id de chaque scène pour y
 * emmener le visiteur ([GOTO:id]…[/GOTO], convention de L'Entrepôt).
 *
 * Points d'information = type Prismic `infospot` (norme 09/09/2026), rattachés
 * à leur scène par `nom_scene_krpano` ; les tags masqués sont ignorés.
 *
 * Lecture Prismic à chaque appel, cache mémoire 5 min, best-effort : si
 * Prismic ne répond pas, on renvoie "" et le prompt de base reste intact.
 * Référence : juumo-espace-client/integration-kit/CHATBOT-CONTENU.md
 */

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_FIELD_CHARS = 600;
const MAX_TOTAL_CHARS = 32_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toText(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) {
    try {
      return (asText(v as RichTextField) ?? "").trim();
    } catch {
      return "";
    }
  }
  return "";
}

function clip(s: string, max = MAX_FIELD_CHARS): string {
  const one = s.replace(/\s+/g, " ").trim();
  return one.length > max ? one.slice(0, max - 1).trimEnd() + "…" : one;
}

export interface ChatScene {
  uid: string;
  krpanoId: string;
  name: string;
  category: string;
  description: string;
  infos: { label: string; text: string }[];
}

/** Lit scènes + infospots Prismic (fr-fr) et les structure pour le prompt. */
export async function fetchChatScenes(): Promise<ChatScene[]> {
  const [rawScenes, rawSpots] = await Promise.all([
    client.getAllByType("scene", { lang: "fr-fr" }),
    client.getAllByType("infospot", { lang: "fr-fr" }).catch(() => []),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validScenes = (rawScenes as any[]).filter(
    (s) => s.uid && (s.data?.nom_scene_krpano || s.data?.krpano_id)
  );
  const krpanoIdOf = (s: { data: { krpano_id?: string; nom_scene_krpano?: string } }) =>
    (s.data.nom_scene_krpano || s.data.krpano_id) as string;

  const scenes = validScenes.map((s) => {
    const krpanoId = krpanoIdOf(s);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const infos = (rawSpots as any[])
      .filter((i) => i.data?.nom_scene_krpano === krpanoId && !i.data?.masque)
      .map((i) => ({
        label: clip(toText(i.data?.titre), 120),
        text: clip(toText(i.data?.description)),
      }))
      .filter((i) => i.label);

    return {
      uid: s.uid as string,
      krpanoId,
      name: toText(s.data.title) || toText(s.data.name) || s.uid,
      category: toText(s.data.categorie) || toText(s.data.category?.uid),
      description: clip(
        [toText(s.data.description), toText(s.data.description_longue)]
          .filter(Boolean)
          .join(" ")
      ),
      infos,
    } satisfies ChatScene;
  });

  // Ordre stable : champ ordre si présent, sinon ordre Prismic.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderOf = (uid: string) => (rawScenes as any[]).find((s) => s.uid === uid)?.data?.ordre;
  return scenes.sort((a, b) => {
    const oa = orderOf(a.uid), ob = orderOf(b.uid);
    if (typeof oa === "number" && typeof ob === "number") return oa - ob;
    return 0;
  });
}

/** Bloc markdown injecté dans le prompt système. "" si Prismic indisponible. */
export function renderChatContext(scenes: ChatScene[]): string {
  if (!scenes.length) return "";
  const lines: string[] = [];
  for (const s of scenes) {
    const cat = s.category ? ` (${s.category})` : "";
    lines.push(`- ${s.krpanoId} : **${s.name}**${cat}`);
    if (s.description) lines.push(`  ${s.description}`);
    for (const i of s.infos) {
      lines.push(`  - Point d'information « ${i.label} »${i.text ? ` : ${i.text}` : ""}`);
    }
  }
  let body = lines.join("\n");
  if (body.length > MAX_TOTAL_CHARS) {
    body = body.slice(0, MAX_TOTAL_CHARS) + "\n…(liste tronquée)";
  }
  return `

## Contenu de la visite virtuelle (scènes et points d'information)
Ce contenu est édité par l'établissement dans son espace client : il fait partie de ta base de connaissances et PRIME sur la base ci-dessus en cas de contradiction (noms, descriptions, ce que l'on voit dans chaque scène). Une description absente n'est pas une information : n'invente rien pour la compléter. Chaque scène commence par son id : ce sont les SEULS ids utilisables dans [GOTO:id]…[/GOTO] (règle 10).

${body}`;
}

let scenesCache: { at: number; scenes: ChatScene[] } | null = null;

/** Scènes Prismic avec cache mémoire 5 min (une instance serverless = un cache). */
async function getScenesCached(): Promise<ChatScene[]> {
  const now = Date.now();
  if (scenesCache && now - scenesCache.at < CACHE_TTL_MS) return scenesCache.scenes;
  try {
    const scenes = await fetchChatScenes();
    scenesCache = { at: now, scenes };
    return scenes;
  } catch {
    return scenesCache?.scenes ?? [];
  }
}

/** Contexte prêt à concaténer au prompt système. "" si Prismic indisponible. */
export async function buildPlatformContext(): Promise<string> {
  return renderChatContext(await getScenesCached());
}

/** Bloc « scène actuellement affichée » pour le prompt (ou "" si inconnue). */
export async function describeCurrentScene(krpanoId: string): Promise<string> {
  if (!krpanoId) return "";
  const s = (await getScenesCached()).find((x) => x.krpanoId === krpanoId || x.uid === krpanoId);
  if (!s) return "";
  return `\n\n## Scène actuellement affichée\nLe visiteur regarde en ce moment **${s.name}** (id ${s.krpanoId}). S'il demande à voir cet endroit, dis-lui qu'il y est déjà, sans lien.`;
}
