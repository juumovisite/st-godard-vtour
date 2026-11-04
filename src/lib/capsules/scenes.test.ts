import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DocScene } from "./scenes";

type Appel = { url: string; method: string; body?: string };
let appels: Appel[];
let docs: DocScene[];
let refusPut = false;

/** Document tel que le CDN le renvoie (image et média complets, groupe, tags). */
const docFr = (): DocScene => ({
  id: "FR1", uid: "nef", type: "scene", lang: "fr-fr", tags: ["nef", "intérieur"],
  alternate_languages: [{ id: "EN1", lang: "en-us", uid: "nef" }],
  data: {
    title: "La nef", nom_scene_krpano: "scene_nef", categorie: "Intérieur", ordre: 3,
    description: [{ type: "paragraph", text: "Texte", spans: [] }],
    image_apercu: { dimensions: { width: 10, height: 5 }, alt: "a", copyright: null, url: "https://x/i.jpg", id: "IMG1" },
    audio_file: { link_type: "Media", id: "AUD1", kind: "file", url: "https://x/a.mp3", name: "a.mp3", size: "12" },
    vue_arrivee_ath: 12.5, vue_arrivee_atv: -3, vue_arrivee_fov: null, video_url: null, badge: null,
  },
});
const docEn = (): DocScene => ({
  id: "EN1", uid: "nef", type: "scene", lang: "en-us", tags: [],
  alternate_languages: [{ id: "FR1", lang: "fr-fr", uid: "nef" }],
  data: { title: "The Nave", nom_scene_krpano: "scene_nef", description: [], audio_file: { link_type: "Media" } },
});

beforeEach(() => {
  process.env.PRISMIC_WRITE_TOKEN = "test-token";
  vi.useFakeTimers();
  appels = [];
  refusPut = false;
  docs = [docFr(), docEn(), { id: "FR2", uid: "crypte", type: "scene", lang: "fr-fr", tags: [], data: { title: "La crypte", nom_scene_krpano: "scene_crypte" } }];
  vi.stubGlobal("fetch", async (input: string | URL, init?: RequestInit) => {
    const a: Appel = { url: String(input), method: init?.method ?? "GET", body: typeof init?.body === "string" ? init.body : undefined };
    appels.push(a);
    let body: unknown = {};
    let status = 200;
    if (a.url.endsWith("/api/v2")) body = { refs: [{ ref: "R1", isMasterRef: true }] };
    else if (a.url.includes("/documents/search")) body = { total_pages: 1, results: docs };
    else if (a.method === "PUT" && refusPut) status = 400;
    return new Response(JSON.stringify(body), { status });
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function charger() {
  vi.resetModules();
  return await import("./scenes");
}
async function avecTimers<T>(p: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return p;
}
const puts = () => appels.filter((a) => a.method === "PUT");

describe("corpsRenommage (à sec)", () => {
  it("ne change que le titre : autres champs, uid et tags repris, média au format écriture", async () => {
    const { corpsRenommage } = await charger();
    const d = docFr();
    const c = corpsRenommage(d, "La grande nef");
    expect(Object.keys(c).sort()).toEqual(["data", "tags", "title", "uid"]);
    expect(c.title).toBe("La grande nef");
    expect(c.uid).toBe("nef");
    expect(c.tags).toEqual(["nef", "intérieur"]);
    expect(Object.keys(c.data).sort()).toEqual(Object.keys(d.data ?? {}).sort());
    const sans = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== "title" && k !== "audio_file"));
    expect(c.data.title).toBe("La grande nef");
    expect(sans(c.data)).toEqual(sans(d.data ?? {}));
    expect(c.data.audio_file).toEqual({ link_type: "Media", id: "AUD1" });
    expect(d.data?.title).toBe("La nef"); // l'entrée n'est pas modifiée
  });
});

describe("associerScenes", () => {
  it("apparie FR et EN par uid et signale l'EN manquant", async () => {
    const { associerScenes } = await charger();
    expect(associerScenes(docs)).toEqual([
      { krpano: "scene_nef", fr: { id: "FR1", titre: "La nef" }, en: { id: "EN1", titre: "The Nave" } },
      { krpano: "scene_crypte", fr: { id: "FR2", titre: "La crypte" }, en: null },
    ]);
  });
});

describe("renommerScenes", () => {
  it("PUT des seuls docs changés, corps complet, puis publication", async () => {
    const { renommerScenes } = await charger();
    const r = await avecTimers(renommerScenes([{ krpano: "scene_nef", fr: "La nef", en: "The Great Nave" }]));
    expect(r.erreurs).toEqual([]);
    expect(r.publie).toBe(true);
    expect(puts().map((a) => a.url)).toEqual(["https://migration.prismic.io/documents/EN1"]);
    const corps = JSON.parse(puts()[0].body ?? "{}");
    expect(corps).toEqual({ title: "The Great Nave", uid: "nef", tags: [], data: { ...docEn().data, title: "The Great Nave" } });
    expect(appels.some((a) => a.url.endsWith("/migration-release/publish"))).toBe(true);
    expect(r.scenes.find((s) => s.krpano === "scene_nef")?.en?.titre).toBe("The Great Nave");
  });

  it("signale l'absence de doc EN sans rien inventer ni publier", async () => {
    const { renommerScenes } = await charger();
    const r = await avecTimers(renommerScenes([{ krpano: "scene_crypte", en: "The Crypt" }]));
    expect(puts()).toHaveLength(0);
    expect(appels.some((a) => a.url.includes("migration.prismic.io"))).toBe(false);
    expect(r.erreurs).toEqual([{ cle: "scene_crypte (EN)", message: "Pas de document EN pour cette scène" }]);
  });

  it("ne publie pas et remonte l'erreur quand le PUT est refusé", async () => {
    refusPut = true;
    const { renommerScenes } = await charger();
    const r = await avecTimers(renommerScenes([{ krpano: "scene_nef", fr: "Nef" }]));
    expect(r.erreurs).toHaveLength(1);
    expect(appels.some((a) => a.url.endsWith("/migration-release/publish"))).toBe(false);
  });

  it("refuse un document dont la scène KRpano ne correspond pas", async () => {
    docs[0] = { ...docFr(), type: "capsule" };
    const { renommerScenes } = await charger();
    const r = await avecTimers(renommerScenes([{ krpano: "scene_nef", en: "X" }]));
    // FR1 n'est plus une scène : scene_nef n'a plus de doc FR, rien n'est écrit
    expect(puts()).toHaveLength(0);
    expect(r.erreurs[0].cle).toBe("scene_nef (EN)");
  });
});

describe("validerRenommages", () => {
  it("refuse un nom vide ou une scène mal formée", async () => {
    const { validerRenommages } = await charger();
    expect(() => validerRenommages([{ krpano: "scene_nef", fr: "  " }])).toThrow();
    expect(() => validerRenommages([{ krpano: "a b", fr: "x" }])).toThrow();
    expect(validerRenommages([{ krpano: "scene_nef", fr: " Nef " }])).toEqual([{ krpano: "scene_nef", fr: "Nef" }]);
  });
});
