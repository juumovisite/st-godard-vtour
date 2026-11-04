import { describe, expect, it } from "vitest";
import { corpsCapsule, fusionnerLangues, richTextDepuisTexte, texteAffiche, texteDepuisRichText, texteVide } from "./model";
import type { CapsuleDoc, FicheCapsule } from "./types";

const docFr: CapsuleDoc = {
  id: "FR1",
  lang: "fr-fr",
  alternate_languages: [{ id: "EN1", lang: "en-us" }],
  data: {
    scene: "scene_nef_vue_sud", ath: 12.5, atv: -8, ordre: 2, contenu_scene: false,
    titre: "Les vitraux", texte: [{ type: "paragraph", text: "Un." }, { type: "paragraph", text: "Deux." }],
    audio: { link_type: "Media", id: "A1", url: "https://x/a.mp3", name: "a.mp3" },
    video: "https://video.juumo.fr/v/tWDMlsEgdv1i",
  },
};
const docEn: CapsuleDoc = {
  id: "EN1", lang: "en-us", alternate_languages: [{ id: "FR1", lang: "fr-fr" }],
  data: { scene: "scene_nef_vue_sud", ath: 12.5, atv: -8, ordre: 2, titre: "Stained glass", texte: [], audio: null, video: "" },
};

describe("fusionnerLangues", () => {
  it("réunit la fiche FR et sa traduction EN", () => {
    const [f] = fusionnerLangues([docFr], [docEn]);
    expect(f).toMatchObject({ cle: "FR1", id: "FR1", idEn: "EN1", scene: "scene_nef_vue_sud", ath: 12.5, atv: -8, ordre: 2, contenuScene: false });
    expect(f.fr).toEqual({ titre: "Les vitraux", texte: "Un.\n\nDeux.", audio: { id: "A1", url: "https://x/a.mp3", nom: "a.mp3" }, video: "https://video.juumo.fr/v/tWDMlsEgdv1i" });
    expect(f.en.titre).toBe("Stained glass");
  });
  it("laisse l'EN vide sans traduction et ignore les fiches sans scène", () => {
    const sansScene: CapsuleDoc = { id: "X", lang: "fr-fr", data: {} };
    const fiches = fusionnerLangues([{ ...docFr, alternate_languages: [] }, sansScene], []);
    expect(fiches).toHaveLength(1);
    expect(fiches[0].idEn).toBeNull();
    expect(fiches[0].en).toEqual(texteVide());
  });
});

describe("texte ↔ Rich Text", () => {
  it("fait l'aller-retour en paragraphes", () => {
    const rt = richTextDepuisTexte("Un.\n\n\nDeux.\n");
    expect(rt).toEqual([{ type: "paragraph", text: "Un.", spans: [] }, { type: "paragraph", text: "Deux.", spans: [] }]);
    expect(texteDepuisRichText(rt)).toBe("Un.\n\nDeux.");
    expect(texteDepuisRichText(null)).toBe("");
  });
});

describe("texteAffiche", () => {
  it("complète l'EN avec le FR champ par champ", () => {
    const [f] = fusionnerLangues([docFr], [docEn]);
    const t = texteAffiche(f, "en");
    expect(t.titre).toBe("Stained glass");
    expect(t.texte).toBe("Un.\n\nDeux.");
    expect(t.audio?.id).toBe("A1");
    expect(t.video).toBe("https://video.juumo.fr/v/tWDMlsEgdv1i");
  });
});

describe("corpsCapsule", () => {
  const f: FicheCapsule = {
    cle: "c", id: null, idEn: null, scene: "scene_voute", ath: 1, atv: 2, ordre: 0, contenuScene: true,
    fr: { titre: "T", texte: "A\n\nB", audio: { id: "A9", url: "u", nom: "n" }, video: "v" },
    en: texteVide(),
  };
  it("écrit tous les champs au format Migration API", () => {
    expect(corpsCapsule(f, "fr")).toEqual({
      scene: "scene_voute", ath: 1, atv: 2, ordre: 0, contenu_scene: true, titre: "T",
      texte: [{ type: "paragraph", text: "A", spans: [] }, { type: "paragraph", text: "B", spans: [] }],
      audio: { link_type: "Media", id: "A9" }, video: "v",
    });
  });
  it("vide le lien audio quand il n'y en a pas", () => {
    expect(corpsCapsule(f, "en").audio).toEqual({ link_type: "Media" });
  });
});
