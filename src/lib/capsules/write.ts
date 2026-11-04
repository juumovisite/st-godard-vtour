/**
 * Écriture des capsules dans Prismic — serveur uniquement, mode développement.
 * Mêmes mécanismes que juumo-espace-client/src/lib/prismic/write.ts :
 * Migration API (création, mise à jour, retrait, publication), Asset API, Custom Types API.
 * Le PUT de la Migration API REMPLACE tout `data` : on écrit toujours la fiche complète.
 * La Migration API ne supprime pas (DELETE = 404) : « supprimer » une capsule = la RETIRER
 * (PUT qui vide `scene`, titre préfixé « (retirée) »), les lecteurs ignorent les fiches sans scène.
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { repositoryName } from "../../prismicio";
import { corpsCapsule, fusionnerLangues } from "./model";
import { LANG_PRISMIC, type CapsuleAudio, type CapsuleDoc, type FicheCapsule } from "./types";

export const REPO = repositoryName;
const API_KEY = "UgjnhNFD0n8aMaFVPPuj04ONVgasHlfa6b7XZXE1"; // clé publique de la Migration API
const TYPE = "capsule";

const MODELE = {
  id: TYPE,
  label: "Capsule (+)",
  repeatable: true,
  status: true,
  json: {
    Main: {
      scene: { type: "Text", config: { label: "Scène KRpano", placeholder: "scene_nef_vue_sud" } },
      ath: { type: "Number", config: { label: "Position horizontale (ath)" } },
      atv: { type: "Number", config: { label: "Position verticale (atv)" } },
      ordre: { type: "Number", config: { label: "Ordre" } },
      contenu_scene: { type: "Boolean", config: { label: "Contenu de la scène", placeholder_true: "Oui", placeholder_false: "Non", default_value: false } },
      titre: { type: "Text", config: { label: "Titre" } },
      texte: { type: "StructuredText", config: { label: "Texte", multi: "paragraph" } },
      audio: { type: "Link", config: { label: "Audio", select: "media" } },
      video: { type: "Text", config: { label: "Vidéo (lien JUUMO Vidéos)" } },
    },
  },
};

let jetonMemo: string | null = null;
function jeton(): string {
  if (jetonMemo) return jetonMemo;
  const env = process.env.PRISMIC_WRITE_TOKEN?.trim();
  if (env) return (jetonMemo = env);
  try {
    const f = readFileSync(`${homedir()}/.config/prismic/${REPO}-write.token`, "utf8").trim();
    if (f) return (jetonMemo = f);
  } catch {
    // pas de fichier
  }
  throw new Error(`Jeton d'écriture absent : déposer ~/.config/prismic/${REPO}-write.token`);
}

export function aJeton(): boolean {
  try { jeton(); return true; } catch { return false; }
}

async function migration(method: "POST" | "PUT", path: string, body?: unknown): Promise<Record<string, unknown>> {
  const envoi = () => fetch(`https://migration.prismic.io${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${jeton()}`, repository: REPO, "x-api-key": API_KEY },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let res = await envoi();
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 1500));
    res = await envoi();
  }
  if (!res.ok) throw new Error(`Prismic ${method} ${path} : ${res.status} ${(await res.text()).slice(0, 200)}`);
  // La Migration API limite à ~1 requête par seconde
  await new Promise((r) => setTimeout(r, 1100));
  try { return (await res.json()) as Record<string, unknown>; } catch { return {}; }
}

let typePret = false;
async function assurerType(): Promise<void> {
  if (typePret) return;
  const headers = { Authorization: `Bearer ${jeton()}`, repository: REPO };
  const res = await fetch(`https://customtypes.prismic.io/customtypes/${TYPE}`, { headers, cache: "no-store" });
  if (res.status === 404) {
    const ins = await fetch("https://customtypes.prismic.io/customtypes/insert", {
      method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(MODELE), cache: "no-store",
    });
    if (!ins.ok) throw new Error(`Création du type capsule refusée : ${ins.status}`);
  } else if (!res.ok) {
    throw new Error(`Lecture du type capsule impossible : ${res.status}`);
  }
  typePret = true;
}

/** Fiches publiées, sans cache (pour l'outil). Lève une erreur si une lecture échoue (jamais de liste vide silencieuse). */
export async function lireFiches(): Promise<FicheCapsule[]> {
  const racine = await fetch(`https://${REPO}.cdn.prismic.io/api/v2`, { cache: "no-store" });
  if (!racine.ok) throw new Error(`Lecture de l'API Prismic impossible : ${racine.status}`);
  const api = (await racine.json()) as { refs: { ref: string; isMasterRef?: boolean }[] };
  const ref = api.refs.find((r) => r.isMasterRef)?.ref ?? api.refs[0].ref;
  const q = encodeURIComponent(`[[at(document.type,"${TYPE}")]]`);
  const lire = async (lang: string) => {
    const r = await fetch(`https://${REPO}.cdn.prismic.io/api/v2/documents/search?ref=${encodeURIComponent(ref)}&q=${q}&lang=${lang}&pageSize=100`, { cache: "no-store" });
    if (!r.ok) throw new Error(`Lecture des capsules (${lang}) impossible : ${r.status}`);
    return ((await r.json()) as { results: CapsuleDoc[] }).results;
  };
  const [fr, en] = await Promise.all([lire(LANG_PRISMIC.fr), lire(LANG_PRISMIC.en)]);
  return fusionnerLangues(fr, en);
}

type DocCapsule = { id: string; type: string; data?: Record<string, unknown>; title?: string };

/** Le document (CDN, ref master) s'il existe et est de type capsule, sinon null. */
async function lireCapsule(id: string): Promise<DocCapsule | null> {
  const racine = await fetch(`https://${REPO}.cdn.prismic.io/api/v2`, { cache: "no-store" });
  if (!racine.ok) throw new Error(`Lecture de l'API Prismic impossible : ${racine.status}`);
  const api = (await racine.json()) as { refs: { ref: string; isMasterRef?: boolean }[] };
  const ref = api.refs.find((r) => r.isMasterRef)?.ref ?? api.refs[0].ref;
  const q = encodeURIComponent(`[[at(document.id,"${id}")]]`);
  const r = await fetch(`https://${REPO}.cdn.prismic.io/api/v2/documents/search?ref=${encodeURIComponent(ref)}&q=${q}&lang=*`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Lecture du document ${id} impossible : ${r.status}`);
  const docs = ((await r.json()) as { results: DocCapsule[] }).results;
  return docs.find((d) => d.id === id && d.type === TYPE) ?? null;
}

/** Données lues sur le CDN, remises au format d'écriture (liens média `{ link_type: "Media", id? }`). */
function donneesEcriture(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === "object" && !Array.isArray(v) && (v as { link_type?: unknown }).link_type === "Media") {
      const id = (v as { id?: unknown }).id;
      out[k] = id ? { link_type: "Media", id } : { link_type: "Media" };
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Retire une capsule : le document reste (archivable dans Prismic) mais sa scène est vidée. */
async function retirer(doc: DocCapsule): Promise<void> {
  const titre = typeof doc.title === "string" && doc.title ? doc.title : doc.id;
  await migration("PUT", `/documents/${doc.id}`, {
    title: `(retirée) ${titre}`,
    data: { ...donneesEcriture(doc.data ?? {}), scene: "" },
  });
}

const titreDoc = (f: FicheCapsule, l: "fr" | "en") => f[l].titre || f.fr.titre || f.scene;

// Les sauvegardes passent l'une après l'autre (limite ~1 req/s, course sur assurerType).
let file: Promise<unknown> = Promise.resolve();

/**
 * Crée / met à jour / retire, puis publie. Une erreur sur une fiche n'arrête pas les autres.
 * Les appels sont sérialisés. `fiches` renvoyé = la liste d'entrée (copiée) avec `id` / `idEn`
 * renseignés dès que chaque création réussit : même après un échec partiel, l'appelant récupère
 * les identifiants déjà créés et évite les doublons au prochain enregistrement.
 */
export function enregistrer(
  fiches: FicheCapsule[],
  supprimees: { id: string; idEn: string | null }[],
): Promise<{ erreurs: { cle: string; message: string }[]; publie: boolean; fiches: FicheCapsule[] }> {
  const run = file.then(() => enregistrerSerie(fiches, supprimees), () => enregistrerSerie(fiches, supprimees));
  file = run.catch(() => undefined);
  return run;
}

async function enregistrerSerie(
  entree: FicheCapsule[],
  supprimees: { id: string; idEn: string | null }[],
): Promise<{ erreurs: { cle: string; message: string }[]; publie: boolean; fiches: FicheCapsule[] }> {
  await assurerType();
  const erreurs: { cle: string; message: string }[] = [];
  const fiches = entree.map((f) => ({ ...f }));
  for (const f of fiches) {
    try {
      if (f.id) {
        await migration("PUT", `/documents/${f.id}`, { title: titreDoc(f, "fr"), data: corpsCapsule(f, "fr") });
      } else {
        const r = await migration("POST", "/documents", { title: titreDoc(f, "fr"), type: TYPE, lang: LANG_PRISMIC.fr, data: corpsCapsule(f, "fr") });
        const nouveau = String(r.id ?? "");
        if (!nouveau) throw new Error("Prismic n'a pas renvoyé d'identifiant");
        f.id = nouveau;
      }
      if (f.idEn) {
        await migration("PUT", `/documents/${f.idEn}`, { title: titreDoc(f, "en"), data: corpsCapsule(f, "en") });
      } else {
        const r = await migration("POST", "/documents", { title: titreDoc(f, "en"), type: TYPE, lang: LANG_PRISMIC.en, alternate_language_id: f.id, data: corpsCapsule(f, "en") });
        const nouveauEn = String(r.id ?? "");
        if (!nouveauEn) throw new Error("Prismic n'a pas renvoyé d'identifiant (EN)");
        f.idEn = nouveauEn;
      }
    } catch (e) {
      erreurs.push({ cle: f.cle, message: e instanceof Error ? e.message : String(e) });
    }
  }
  for (const s of supprimees) {
    let en: DocCapsule | null = null;
    let fr: DocCapsule | null = null;
    try {
      if (s.idEn) {
        en = await lireCapsule(s.idEn);
        if (!en) throw new Error(`Retrait refusé : ${s.idEn} n'est pas une capsule`);
      }
      fr = await lireCapsule(s.id);
      if (!fr) throw new Error(`Retrait refusé : ${s.id} n'est pas une capsule`);
    } catch (e) {
      erreurs.push({ cle: s.id, message: e instanceof Error ? e.message : String(e) });
      continue;
    }
    // EN d'abord : si elle échoue, on garde le FR pour ne pas laisser d'EN orphelin.
    if (en) {
      try { await retirer(en); } catch (e) {
        erreurs.push({ cle: s.id, message: e instanceof Error ? e.message : String(e) });
        continue;
      }
    }
    try { await retirer(fr); } catch (e) {
      erreurs.push({ cle: s.id, message: e instanceof Error ? e.message : String(e) });
    }
  }
  let publie = false;
  try { await migration("POST", "/migration-release/publish", {}); publie = true; } catch (e) {
    erreurs.push({ cle: "publication", message: e instanceof Error ? e.message : String(e) });
  }
  return { erreurs, publie, fiches };
}

type Asset = { id: string; url: string; filename?: string; extension?: string; kind?: string };
const estAudio = (a: Asset) => /^(mp3|m4a|wav|aac|ogg)$/i.test(a.extension ?? a.filename?.split(".").pop() ?? "");

export async function listerAudios(): Promise<CapsuleAudio[]> {
  const res = await fetch("https://asset-api.prismic.io/assets?assetType=all&limit=500", {
    headers: { Authorization: `Bearer ${jeton()}`, repository: REPO }, cache: "no-store",
  });
  if (!res.ok) throw new Error(`Liste des audios impossible : ${res.status}`);
  const json = (await res.json()) as { items?: Asset[] };
  return (json.items ?? []).filter(estAudio).map((a) => ({ id: a.id, url: a.url, nom: a.filename ?? a.id }));
}

export async function envoyerAudio(file: File): Promise<CapsuleAudio> {
  const form = new FormData();
  form.append("file", file, file.name || "audio.mp3");
  const res = await fetch("https://asset-api.prismic.io/assets", {
    method: "POST", headers: { Authorization: `Bearer ${jeton()}`, repository: REPO }, body: form,
  });
  if (!res.ok) throw new Error(`Envoi de l'audio refusé : ${res.status}`);
  const json = (await res.json()) as Asset;
  return { id: json.id, url: json.url, nom: json.filename ?? file.name };
}

const lienJuumo = (id: string) => `https://video.juumo.fr/v/${id}`;

/** Ids des vidéos JUUMO citées dans les documents Prismic de la plateforme (liens privés compris). */
async function idsVideosPrismic(): Promise<Set<string>> {
  const ids = new Set<string>();
  try {
    const racine = await fetch(`https://${REPO}.cdn.prismic.io/api/v2`, { cache: "no-store" });
    if (!racine.ok) return ids;
    const api = (await racine.json()) as { refs: { ref: string; isMasterRef?: boolean }[] };
    const ref = api.refs.find((r) => r.isMasterRef)?.ref ?? api.refs[0]?.ref;
    if (!ref) return ids;
    for (const lang of [LANG_PRISMIC.fr, LANG_PRISMIC.en]) {
      for (let page = 1, total = 1; page <= total; page++) {
        const r = await fetch(`https://${REPO}.cdn.prismic.io/api/v2/documents/search?ref=${encodeURIComponent(ref)}&lang=${lang}&pageSize=100&page=${page}`, { cache: "no-store" });
        if (!r.ok) break;
        const json = (await r.json()) as { total_pages?: number; results?: unknown[] };
        total = json.total_pages ?? 1;
        for (const doc of json.results ?? []) {
          for (const m of JSON.stringify(doc).matchAll(/video\.juumo\.fr\/(?:v|embed)\/([A-Za-z0-9_-]+)/g)) ids.add(m[1]);
        }
      }
    }
  } catch {
    // on garde ce qui a été collecté
  }
  return ids;
}

async function titreVideo(id: string): Promise<string> {
  try {
    const r = await fetch(`https://video.juumo.fr/api/oembed?url=${encodeURIComponent(lienJuumo(id))}`, { cache: "no-store" });
    if (!r.ok) return id;
    const t = ((await r.json()) as { title?: string }).title;
    return t || id;
  } catch {
    return id;
  }
}

/**
 * Vidéos de JUUMO Vidéos : liste publique du serveur média + vidéos privées
 * citées dans les documents Prismic de la plateforme. Ne lève jamais d'erreur.
 */
export async function listerVideos(): Promise<{ url: string; titre: string }[]> {
  const parId = new Map<string, string>();
  try {
    const res = await fetch("https://media.juumo.fr/api/videos", { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as { videos?: { id: string; title?: string }[] };
      for (const v of json.videos ?? []) parId.set(v.id, v.title ?? v.id);
    }
  } catch {
    // liste publique indisponible
  }
  const manquants = [...(await idsVideosPrismic())].filter((id) => !parId.has(id));
  for (let i = 0; i < manquants.length; i += 4) {
    await Promise.all(manquants.slice(i, i + 4).map(async (id) => parId.set(id, await titreVideo(id))));
  }
  return [...parId].map(([id, titre]) => ({ url: lienJuumo(id), titre })).sort((a, b) => a.titre.localeCompare(b.titre, "fr"));
}
