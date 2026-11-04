import type { CapsuleAudio, CapsuleDoc, CapsuleDocData, CapsuleTexte, FicheCapsule, Langue } from "./types";

export const texteVide = (): CapsuleTexte => ({ titre: "", texte: "", audio: null, video: "" });

export function texteDepuisRichText(rt?: { text?: string }[] | null): string {
  return (rt ?? []).map((b) => (b.text ?? "").trim()).filter(Boolean).join("\n\n");
}

export function richTextDepuisTexte(t: string): { type: "paragraph"; text: string; spans: [] }[] {
  return t.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean).map((text) => ({ type: "paragraph", text, spans: [] }));
}

function audioDepuisLien(l: CapsuleDocData["audio"]): CapsuleAudio | null {
  return l?.id && l.url ? { id: l.id, url: l.url, nom: l.name ?? "" } : null;
}

function texteDepuisDoc(d: CapsuleDocData): CapsuleTexte {
  return { titre: d.titre ?? "", texte: texteDepuisRichText(d.texte), audio: audioDepuisLien(d.audio), video: d.video ?? "" };
}

/** Réunit chaque fiche FR et sa traduction EN (lien Prismic alternate language). */
export function fusionnerLangues(fr: CapsuleDoc[], en: CapsuleDoc[]): FicheCapsule[] {
  const enParId = new Map(en.map((d) => [d.id, d]));
  return fr
    .filter((d) => d.data.scene)
    .map((d) => {
      const idEn = d.alternate_languages?.find((a) => a.lang === "en-us")?.id;
      const docEn = idEn ? enParId.get(idEn) : undefined;
      return {
        cle: d.id,
        id: d.id,
        idEn: docEn?.id ?? null,
        scene: d.data.scene as string,
        ath: Number(d.data.ath ?? 0),
        atv: Number(d.data.atv ?? 0),
        ordre: Number(d.data.ordre ?? 0),
        contenuScene: !!d.data.contenu_scene,
        fr: texteDepuisDoc(d.data),
        en: docEn ? texteDepuisDoc(docEn.data) : texteVide(),
      };
    })
    .sort((a, b) => a.scene.localeCompare(b.scene) || a.ordre - b.ordre);
}

/** Texte à afficher dans une langue ; en anglais, chaque champ vide reprend le français. */
export function texteAffiche(f: FicheCapsule, langue: Langue): CapsuleTexte {
  if (langue === "fr") return f.fr;
  return {
    titre: f.en.titre || f.fr.titre,
    texte: f.en.texte || f.fr.texte,
    audio: f.en.audio ?? f.fr.audio,
    video: f.en.video || f.fr.video,
  };
}

/** Champs `data` d'une fiche, au format d'écriture de la Migration API. */
export function corpsCapsule(f: FicheCapsule, langue: Langue): Record<string, unknown> {
  const t = f[langue];
  return {
    scene: f.scene,
    ath: Math.round(f.ath * 100) / 100,
    atv: Math.round(f.atv * 100) / 100,
    ordre: f.ordre,
    contenu_scene: f.contenuScene,
    titre: t.titre,
    texte: richTextDepuisTexte(t.texte),
    audio: t.audio ? { link_type: "Media", id: t.audio.id } : { link_type: "Media" },
    video: t.video,
  };
}
