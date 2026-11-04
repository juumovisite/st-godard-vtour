/**
 * Noms des scènes (outil local) — serveur uniquement, mode développement.
 *
 * Le nom affiché par la visite est le champ `title` du document `scene`
 * (src/lib/scenes-data.ts : FR = doc fr-fr, EN = doc en-us de même uid).
 * Renommer = changer cette donnée, jamais une table de renommage dans le code.
 *
 * Le PUT de la Migration API REMPLACE tout `data` : on relit le document complet
 * (CDN, ref master), on ne change que `data.title`, et on renvoie tout le reste
 * (autres champs, uid, tags). Les liens de langue ne font pas partie du corps
 * d'un PUT (ils sont fixés à la création par `alternate_language_id`) :
 * le @prismicio/client officiel n'envoie lui aussi que title / uid / tags / data.
 */
import { donneesEcriture, enSerie, migration, publier, REPO } from "./write";
import { LANG_PRISMIC, type Langue } from "./types";

export type DocScene = {
  id: string;
  uid?: string | null;
  type: string;
  lang: string;
  tags?: string[];
  alternate_languages?: { id: string; lang: string; uid?: string }[];
  data?: Record<string, unknown>;
};

/** Une scène de la visite : ses docs FR et EN (null si absent) avec le nom stocké. */
export type NomScene = {
  krpano: string;
  fr: { id: string; titre: string } | null;
  en: { id: string; titre: string } | null;
};

export type Renommage = { krpano: string; fr?: string; en?: string };

const str = (v: unknown) => (typeof v === "string" ? v : "");
const krpanoDe = (d: DocScene) => str(d.data?.nom_scene_krpano) || str(d.data?.krpano_id);

async function refMaster(): Promise<string> {
  const racine = await fetch(`https://${REPO}.cdn.prismic.io/api/v2`, { cache: "no-store" });
  if (!racine.ok) throw new Error(`Lecture de l'API Prismic impossible : ${racine.status}`);
  const api = (await racine.json()) as { refs: { ref: string; isMasterRef?: boolean }[] };
  return api.refs.find((r) => r.isMasterRef)?.ref ?? api.refs[0].ref;
}

/** Tous les documents `scene` publiés, toutes langues, sans cache. Lève une erreur si une page échoue. */
async function lireDocsScenes(): Promise<DocScene[]> {
  const ref = await refMaster();
  const q = encodeURIComponent(`[[at(document.type,"scene")]]`);
  const docs: DocScene[] = [];
  for (let page = 1, total = 1; page <= total; page++) {
    const r = await fetch(`https://${REPO}.cdn.prismic.io/api/v2/documents/search?ref=${encodeURIComponent(ref)}&q=${q}&lang=*&pageSize=100&page=${page}`, { cache: "no-store" });
    if (!r.ok) throw new Error(`Lecture des scènes impossible : ${r.status}`);
    const j = (await r.json()) as { total_pages?: number; results: DocScene[] };
    total = j.total_pages ?? 1;
    docs.push(...j.results);
  }
  return docs;
}

/** Associe FR et EN comme la visite : même uid (à défaut, lien de langue du doc FR). */
export function associerScenes(docs: DocScene[]): NomScene[] {
  const fr = docs.filter((d) => d.type === "scene" && d.lang === LANG_PRISMIC.fr && krpanoDe(d));
  const en = docs.filter((d) => d.type === "scene" && d.lang === LANG_PRISMIC.en);
  const enParUid = new Map(en.filter((d) => d.uid).map((d) => [d.uid as string, d]));
  const enParId = new Map(en.map((d) => [d.id, d]));
  return fr.map((d) => {
    const lien = d.alternate_languages?.find((a) => a.lang === LANG_PRISMIC.en);
    const e = (d.uid ? enParUid.get(d.uid) : undefined) ?? (lien ? enParId.get(lien.id) : undefined) ?? null;
    return {
      krpano: krpanoDe(d),
      fr: { id: d.id, titre: str(d.data?.title) },
      en: e ? { id: e.id, titre: str(e.data?.title) } : null,
    };
  });
}

export async function lireNomsScenes(): Promise<NomScene[]> {
  return associerScenes(await lireDocsScenes());
}

/**
 * Corps du PUT de renommage : le document complet, seul `data.title` change.
 * Pur (testé à sec) : uid, tags et tous les autres champs sont repris tels quels,
 * les liens média remis au format d'écriture de la Migration API.
 */
export function corpsRenommage(doc: DocScene, titre: string): { title: string; uid?: string; tags: string[]; data: Record<string, unknown> } {
  return {
    title: titre,
    ...(doc.uid ? { uid: doc.uid } : {}),
    tags: Array.isArray(doc.tags) ? [...doc.tags] : [],
    data: { ...donneesEcriture(doc.data ?? {}), title: titre },
  };
}

/** Renommages validés : nom non vide, sans retour à la ligne, 200 caractères au plus. */
export function validerRenommages(entree: unknown): Renommage[] {
  if (!Array.isArray(entree)) throw new Error("Liste de scènes attendue");
  const ok = (v: unknown) => v === undefined || (typeof v === "string" && v.trim().length > 0 && v.length <= 200 && !/[\r\n]/.test(v));
  return entree.map((r) => {
    const x = r as Renommage;
    if (!x || typeof x.krpano !== "string" || !/^[A-Za-z0-9_-]+$/.test(x.krpano)) throw new Error("Scène invalide");
    if (!ok(x.fr) || !ok(x.en)) throw new Error(`Nom invalide pour ${x.krpano} (vide ou trop long)`);
    return { krpano: x.krpano, ...(x.fr !== undefined ? { fr: x.fr.trim() } : {}), ...(x.en !== undefined ? { en: x.en.trim() } : {}) };
  });
}

/**
 * Renomme les scènes demandées (FR et / ou EN), puis publie si au moins un PUT est passé.
 * Chaque document est relu juste avant l'écriture et doit être une `scene` de la bonne
 * scène KRpano et de la bonne langue, sinon rien n'est écrit pour lui.
 */
export function renommerScenes(renommages: Renommage[]): Promise<{ erreurs: { cle: string; message: string }[]; publie: boolean; scenes: NomScene[] }> {
  return enSerie(async () => {
    const erreurs: { cle: string; message: string }[] = [];
    const docs = await lireDocsScenes();
    const actuelles = associerScenes(docs);
    const parId = new Map(docs.map((d) => [d.id, d]));
    let ecrits = 0;
    for (const r of renommages) {
      const s = actuelles.find((x) => x.krpano === r.krpano);
      for (const l of ["fr", "en"] as Langue[]) {
        const titre = r[l];
        if (titre === undefined) continue;
        const cle = `${r.krpano} (${l.toUpperCase()})`;
        const ref = s?.[l];
        const doc = ref ? parId.get(ref.id) : undefined;
        if (!s || !ref || !doc) { erreurs.push({ cle, message: l === "en" ? "Pas de document EN pour cette scène" : "Scène absente de Prismic" }); continue; }
        if (doc.type !== "scene" || doc.lang !== LANG_PRISMIC[l] || krpanoDe(doc) !== r.krpano) { erreurs.push({ cle, message: "Document inattendu : rien n'est écrit" }); continue; }
        if (str(doc.data?.title) === titre) continue;
        try {
          await migration("PUT", `/documents/${doc.id}`, corpsRenommage(doc, titre));
          ref.titre = titre;
          ecrits++;
        } catch (e) {
          erreurs.push({ cle, message: e instanceof Error ? e.message : String(e) });
        }
      }
    }
    let publie = ecrits === 0;
    if (ecrits > 0) {
      try { await publier(); publie = true; } catch (e) {
        erreurs.push({ cle: "publication", message: e instanceof Error ? e.message : String(e) });
      }
    }
    return { erreurs, publie, scenes: actuelles };
  });
}
