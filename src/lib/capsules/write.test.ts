import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FicheCapsule } from "./types";

type Appel = { url: string; method: string; body?: string };
type Reponse = { status: number; body?: unknown };

let appels: Appel[];
let routeur: (a: Appel) => Reponse;

function installerFetch() {
  appels = [];
  vi.stubGlobal("fetch", async (input: string | URL, init?: RequestInit) => {
    const a: Appel = { url: String(input), method: init?.method ?? "GET", body: typeof init?.body === "string" ? init.body : undefined };
    appels.push(a);
    const r = routeur(a);
    return new Response(r.body === undefined ? "{}" : JSON.stringify(r.body), { status: r.status });
  });
}

const fiche = (): FicheCapsule => ({
  cle: "k1", id: null, idEn: null, scene: "scene_nef", ath: 1, atv: 2, ordre: 0, contenuScene: false,
  fr: { titre: "Titre", texte: "Texte", audio: null, video: "" },
  en: { titre: "Title", texte: "Text", audio: null, video: "" },
});

async function charger() {
  vi.resetModules();
  return await import("./write");
}

/** Lance l'appel puis fait avancer les temporisations internes (1,1 s / 1,5 s). */
async function avecTimers<T>(p: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return p;
}

beforeEach(() => {
  process.env.PRISMIC_WRITE_TOKEN = "test-token";
  vi.useFakeTimers();
  installerFetch();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const base = (a: Appel): Reponse | null => {
  if (a.url === "https://customtypes.prismic.io/customtypes/capsule") return { status: 200 };
  if (a.url.endsWith("/migration-release/publish")) return { status: 200 };
  return null;
};

/** CDN : tout identifiant demandé est une capsule, sauf « AUTRE ». */
const cdn = (a: Appel): Reponse | null => {
  if (a.url.endsWith("/api/v2")) return { status: 200, body: { refs: [{ ref: "R1", isMasterRef: true }] } };
  if (a.url.includes("/documents/search") && a.url.includes("document.id")) {
    if (!a.url.includes("lang=*")) return { status: 200, body: { results: [] } };
    const id = /document\.id%2C%22([^%]+)%22/.exec(a.url)?.[1] ?? "";
    return { status: 200, body: { results: [{ id, type: id === "AUTRE" ? "scene" : "capsule", title: `T-${id}`, data: { scene: "scene_x", titre: "Tt", audio: { link_type: "Media", id: `A-${id}`, kind: "audio", url: "https://x/a.mp3", name: "a.mp3" } } }] } };
  }
  return null;
};

describe("enregistrer", () => {
  it("n'envoie que title et data dans un PUT", async () => {
    routeur = (a) => base(a) ?? { status: 200 };
    const { enregistrer } = await charger();
    await avecTimers(enregistrer([{ ...fiche(), id: "FR1", idEn: "EN1" }], []));
    const puts = appels.filter((a) => a.method === "PUT");
    expect(puts).toHaveLength(2);
    for (const p of puts) expect(Object.keys(JSON.parse(p.body ?? "{}")).sort()).toEqual(["data", "title"]);
  });

  it("refuse de retirer un document qui n'est pas une capsule", async () => {
    routeur = (a) => base(a) ?? cdn(a) ?? { status: 200 };
    const { enregistrer } = await charger();
    const r = await avecTimers(enregistrer([], [{ id: "AUTRE", idEn: null }]));
    expect(appels.some((a) => a.method === "DELETE" || a.method === "PUT")).toBe(false);
    expect(r.erreurs.some((e) => e.cle === "AUTRE")).toBe(true);
  });

  it("renvoie l'id FR déjà créé quand le POST EN échoue", async () => {
    let n = 0;
    routeur = (a) => {
      const b = base(a); if (b) return b;
      if (a.method === "POST" && a.url.endsWith("/documents")) return ++n === 1 ? { status: 200, body: { id: "FR1" } } : { status: 500 };
      return { status: 200 };
    };
    const { enregistrer } = await charger();
    const r = await avecTimers(enregistrer([fiche()], []));
    expect(r.fiches[0].id).toBe("FR1");
    expect(r.fiches[0].idEn).toBeNull();
    expect(r.erreurs).toHaveLength(1);
    expect(r.erreurs[0].cle).toBe("k1");
  });

  it("renvoie les ids FR et EN et lie l'EN au FR", async () => {
    let n = 0;
    routeur = (a) => {
      const b = base(a); if (b) return b;
      if (a.method === "POST" && a.url.endsWith("/documents")) return { status: 200, body: { id: ++n === 1 ? "FR1" : "EN1" } };
      return { status: 200 };
    };
    const { enregistrer } = await charger();
    const r = await avecTimers(enregistrer([fiche()], []));
    expect(r.erreurs).toEqual([]);
    expect(r.fiches[0].id).toBe("FR1");
    expect(r.fiches[0].idEn).toBe("EN1");
    const posts = appels.filter((a) => a.method === "POST" && a.url.endsWith("/documents"));
    const corpsEn = JSON.parse(posts[1].body ?? "{}");
    expect(corpsEn.alternate_language_id).toBe("FR1");
    expect(corpsEn.lang).toBe("en-us");
  });

  it("traite un POST EN sans id comme une erreur", async () => {
    let n = 0;
    routeur = (a) => {
      const b = base(a); if (b) return b;
      if (a.method === "POST" && a.url.endsWith("/documents")) return ++n === 1 ? { status: 200, body: { id: "FR1" } } : { status: 200, body: {} };
      return { status: 200 };
    };
    const { enregistrer } = await charger();
    const r = await avecTimers(enregistrer([fiche()], []));
    expect(r.fiches[0].id).toBe("FR1");
    expect(r.fiches[0].idEn).toBeNull();
    expect(r.erreurs).toEqual([{ cle: "k1", message: "Prismic n'a pas renvoyé d'identifiant (EN)" }]);
  });

  it("retire EN puis FR par PUT (scène vidée, audio au format écriture)", async () => {
    routeur = (a) => base(a) ?? cdn(a) ?? { status: 200 };
    const { enregistrer } = await charger();
    const r = await avecTimers(enregistrer([], [{ id: "FR9", idEn: "EN9" }]));
    expect(r.erreurs).toEqual([]);
    expect(appels.some((a) => a.method === "DELETE")).toBe(false);
    const puts = appels.filter((a) => a.method === "PUT");
    expect(puts.map((a) => a.url)).toEqual(["https://migration.prismic.io/documents/EN9", "https://migration.prismic.io/documents/FR9"]);
    const corps = JSON.parse(puts[0].body ?? "{}");
    expect(corps.title).toBe("(retirée) T-EN9");
    expect(corps.data.scene).toBe("");
    expect(corps.data.titre).toBe("Tt");
    expect(corps.data.audio).toEqual({ link_type: "Media", id: "A-EN9" });
  });

  it("ne touche pas le FR quand le retrait EN échoue", async () => {
    routeur = (a) => {
      const b = base(a); if (b) return b;
      const c = cdn(a); if (c) return c;
      if (a.method === "PUT" && a.url.endsWith("/documents/EN9")) return { status: 500 };
      return { status: 200 };
    };
    const { enregistrer } = await charger();
    const r = await avecTimers(enregistrer([], [{ id: "FR9", idEn: "EN9" }]));
    const puts = appels.filter((a) => a.method === "PUT");
    expect(puts.map((a) => a.url)).toEqual(["https://migration.prismic.io/documents/EN9"]);
    expect(r.erreurs.some((e) => e.cle === "FR9")).toBe(true);
  });
});

describe("lireFiches", () => {
  it("lève une erreur si la recherche EN répond 500", async () => {
    routeur = (a) => {
      if (a.url.endsWith("/api/v2")) return { status: 200, body: { refs: [{ ref: "R1", isMasterRef: true }] } };
      if (a.url.includes("lang=en-us")) return { status: 500 };
      return { status: 200, body: { results: [] } };
    };
    const { lireFiches } = await charger();
    await expect(lireFiches()).rejects.toThrow(/impossible/);
  });
});

describe("listerVideos", () => {
  it("fusionne publiques et privées (Prismic), dédoublonne, titre oEmbed, URLs /v/", async () => {
    routeur = (a) => {
      if (a.url === "https://media.juumo.fr/api/videos") return { status: 200, body: { videos: [{ id: "PUB1", title: "Publique" }, { id: "BOTH", title: "Commune" }] } };
      if (a.url.endsWith("/api/v2")) return { status: 200, body: { refs: [{ ref: "R1", isMasterRef: true }] } };
      if (a.url.includes("/documents/search")) {
        return { status: 200, body: { total_pages: 1, results: lang(a.url) === "fr-fr"
          ? [{ data: { video: "https://video.juumo.fr/v/PRIV1", autre: "https://video.juumo.fr/embed/BOTH" } }] : [] } };
      }
      if (a.url.includes("/api/oembed")) return { status: 200, body: { title: "Privée A" } };
      return { status: 404 };
    };
    const { listerVideos } = await charger();
    const v = await listerVideos();
    expect(v).toEqual([
      { url: "https://video.juumo.fr/v/BOTH", titre: "Commune" },
      { url: "https://video.juumo.fr/v/PRIV1", titre: "Privée A" },
      { url: "https://video.juumo.fr/v/PUB1", titre: "Publique" },
    ]);
    expect(appels.filter((a) => a.url.includes("/api/oembed")).length).toBe(1);
  });
});

const lang = (u: string) => new URL(u).searchParams.get("lang");
