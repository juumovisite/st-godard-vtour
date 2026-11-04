/** Capsules « + » des églises : fiches Prismic `capsule` (une par langue, liées). */
export type Langue = "fr" | "en";
export const LANG_PRISMIC: Record<Langue, string> = { fr: "fr-fr", en: "en-us" };

export type CapsuleAudio = { id: string; url: string; nom: string };

/** Ce qui change d'une langue à l'autre. */
export type CapsuleTexte = { titre: string; texte: string; audio: CapsuleAudio | null; video: string };

/** Une capsule, FR + EN réunies. `cle` reste stable côté navigateur, même avant le premier enregistrement. */
export type FicheCapsule = {
  cle: string;
  id: string | null;
  idEn: string | null;
  scene: string;
  ath: number;
  atv: number;
  ordre: number;
  contenuScene: boolean;
  fr: CapsuleTexte;
  en: CapsuleTexte;
};

export type CapsuleDocData = {
  scene?: string | null;
  ath?: number | null;
  atv?: number | null;
  ordre?: number | null;
  contenu_scene?: boolean | null;
  titre?: string | null;
  texte?: { type?: string; text?: string }[] | null;
  audio?: { link_type?: string; id?: string; url?: string; name?: string } | null;
  video?: string | null;
};

/** Document `capsule` tel que le Document API (CDN) le renvoie. */
export type CapsuleDoc = {
  id: string;
  lang: string;
  alternate_languages?: { id: string; lang: string }[];
  data: CapsuleDocData;
};
