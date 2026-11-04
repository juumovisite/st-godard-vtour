/**
 * Redressage des scènes penchées : attribut `prealign="tilt|pan|roll"` du `<image>`
 * de chaque scène KRpano (2e composante = pan, vérifié). Fonctions pures, partagées
 * par l'outil (contenu des scènes en mémoire dans KRpano) et la route qui écrit tour.xml.
 * Seul l'attribut prealign de la balise ouvrante `<image>` change ; zéro = attribut retiré.
 */

export type Prealign = { tilt: number; pan: number; roll: number };

export const ZERO: Prealign = { tilt: 0, pan: 0, roll: 0 };
export const BORNES = { tilt: [-15, 15], pan: [-180, 180], roll: [-15, 15] } as const;

const nombre = (n: number) => String(Math.round(n * 1000) / 1000);

export const formatPrealign = (p: Prealign) => `${nombre(p.tilt)}|${nombre(p.pan)}|${nombre(p.roll)}`;
export const estZero = (p: Prealign) => p.tilt === 0 && p.pan === 0 && p.roll === 0;
export const memePrealign = (a: Prealign, b: Prealign) => formatPrealign(a) === formatPrealign(b);

/** "tilt|pan|roll" → valeurs (composantes manquantes = 0), null si illisible. */
export function lirePrealign(v: string | null | undefined): Prealign | null {
  if (v == null || !v.trim()) return null;
  const [t, p, r] = v.split("|").map((x) => (x.trim() === "" ? 0 : Number(x)));
  const out = { tilt: t ?? 0, pan: p ?? 0, roll: r ?? 0 };
  return [out.tilt, out.pan, out.roll].every(Number.isFinite) ? out : null;
}

/** Valeur reçue par la route : nombres finis dans les bornes des curseurs. */
export function validerPrealign(v: unknown): Prealign {
  const x = v as Prealign;
  if (!x || typeof x !== "object") throw new Error("Prealign invalide");
  for (const k of ["tilt", "pan", "roll"] as const) {
    const n = x[k];
    if (typeof n !== "number" || !Number.isFinite(n) || n < BORNES[k][0] || n > BORNES[k][1]) throw new Error(`Prealign invalide (${k})`);
  }
  return { tilt: x.tilt, pan: x.pan, roll: x.roll };
}

const IMAGE = /<image(?=[\s>/])[^>]*>/;
const ATTR = /\s+prealign\s*=\s*("[^"]*"|'[^']*')/;

/** Valeur prealign de la première balise `<image>` d'un fragment (null = absente). */
export function prealignDuFragment(fragment: string): string | null {
  const tag = IMAGE.exec(fragment)?.[0];
  const a = tag ? ATTR.exec(tag) : null;
  return a ? a[1].slice(1, -1) : null;
}

/**
 * Pose (ou retire si zéro) le prealign sur la première balise `<image>` du fragment.
 * Rien d'autre n'est touché ; lève une erreur s'il n'y a pas de `<image>`.
 */
export function avecPrealign(fragment: string, p: Prealign): string {
  const m = IMAGE.exec(fragment);
  if (!m) throw new Error("Balise <image> introuvable");
  const tag = m[0];
  let neuf: string;
  if (estZero(p)) {
    neuf = tag.replace(ATTR, "");
  } else if (ATTR.test(tag)) {
    neuf = tag.replace(ATTR, (tout) => tout.replace(/("[^"]*"|'[^']*')$/, `"${formatPrealign(p)}"`));
  } else {
    neuf = `<image prealign="${formatPrealign(p)}"${tag.slice("<image".length)}`;
  }
  return fragment.slice(0, m.index) + neuf + fragment.slice(m.index + tag.length);
}

const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const blocScene = (nom: string) => new RegExp(`<scene\\s[^>]*\\bname="${echapper(nom)}"[^>]*>[\\s\\S]*?</scene>`);

/** prealign de chaque scène d'un tour.xml (absent = pas de clé). */
export function prealignsDuTour(xml: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of xml.matchAll(/<scene\s[^>]*\bname="([^"]+)"[^>]*>[\s\S]*?<\/scene>/g)) {
    const v = prealignDuFragment(m[0]);
    if (v !== null) out[m[1]] = v;
  }
  return out;
}

export const scenesDuTour = (xml: string) => [...xml.matchAll(/<scene\s[^>]*\bname="([^"]+)"/g)].map((m) => m[1]);

/** tour.xml avec le prealign d'une scène changé (seulement la balise <image> de ce bloc). */
export function tourAvecPrealign(xml: string, scene: string, p: Prealign): string {
  const m = blocScene(scene).exec(xml);
  if (!m) throw new Error(`Scène ${scene} absente du tour.xml`);
  return xml.slice(0, m.index) + avecPrealign(m[0], p) + xml.slice(m.index + m[0].length);
}
