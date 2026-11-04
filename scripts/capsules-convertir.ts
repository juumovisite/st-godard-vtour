/**
 * Convertit les « + » placés automatiquement en fiches Prismic `capsule` (contenu de la scène coché),
 * à la position que le site calculait : sous le centre de la vue d'arrivée, à l'écart des hotspots.
 * Une fiche par scène qui n'en a pas encore (relançable sans doublon). Une fiche FR sans traduction EN
 * est renvoyée à `enregistrer` (PUT FR + POST EN) : la traduction se crée au relancement.
 *
 * Usage : npx tsx scripts/capsules-convertir.ts          (dry-run)
 *         npx tsx scripts/capsules-convertir.ts --live   (écrit et publie)
 */
import { readFileSync } from "node:fs";
import { texteVide } from "../src/lib/capsules/model";
import { hotspotsDepuisTour, placeLibre, vuesDepuisTour, type Point } from "../src/lib/capsules/position";
import { enregistrer, lireFiches, REPO } from "../src/lib/capsules/write";
import type { FicheCapsule } from "../src/lib/capsules/types";

type SceneDoc = { data: { nom_scene_krpano?: string; krpano_id?: string; vue_arrivee_ath?: number | null; vue_arrivee_atv?: number | null } };

async function scenes(): Promise<SceneDoc[]> {
  const racine = await fetch(`https://${REPO}.cdn.prismic.io/api/v2`);
  if (!racine.ok) throw new Error(`Lecture de l'API Prismic impossible : ${racine.status}`);
  const api = (await racine.json()) as { refs: { ref: string; isMasterRef?: boolean }[] };
  const ref = api.refs.find((r) => r.isMasterRef)?.ref ?? api.refs[0].ref;
  const q = encodeURIComponent('[[at(document.type,"scene")]]');
  const r = await fetch(`https://${REPO}.cdn.prismic.io/api/v2/documents/search?ref=${encodeURIComponent(ref)}&q=${q}&lang=fr-fr&pageSize=100`);
  if (!r.ok) throw new Error(`Lecture des scènes Prismic impossible : ${r.status}`);
  return ((await r.json()) as { results: SceneDoc[] }).results;
}

/** Vue d'arrivée : Prismic si renseignée, sinon le <view> du tour.xml, sinon 0/0. */
function arrivee(data: SceneDoc["data"], duTour: Point | undefined): Point {
  const { vue_arrivee_ath: ath, vue_arrivee_atv: atv } = data;
  if (typeof ath === "number" && typeof atv === "number") return { ath, atv };
  return duTour ?? { ath: 0, atv: 0 };
}

const attendre = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function main() {
  const live = process.argv.includes("--live");
  const xml = readFileSync("public/vtour/tour.xml", "utf8");
  const hotspots = hotspotsDepuisTour(xml);
  const vuesTour = vuesDepuisTour(xml);
  const existantes = new Map((await lireFiches()).map((f) => [f.scene, f] as const));
  const aEcrire: FicheCapsule[] = [];
  const lignes: string[] = [];
  let aCreer = 0;
  let aCompleter = 0;
  for (const s of await scenes()) {
    const id = s.data.nom_scene_krpano?.trim() || s.data.krpano_id?.trim();
    if (!id) continue;
    const existante = existantes.get(id);
    if (existante) {
      if (existante.idEn !== null) continue;
      aEcrire.push(existante);
      aCompleter++;
      lignes.push(`  ${id.padEnd(34)} (traduction EN à compléter)`);
      continue;
    }
    const vue = arrivee(s.data, vuesTour[id]);
    const p = placeLibre({ ath: vue.ath, atv: vue.atv - 12 }, hotspots[id] ?? []);
    aEcrire.push({ cle: id, id: null, idEn: null, scene: id, ath: p.ath, atv: p.atv, ordre: 0, contenuScene: true, fr: texteVide(), en: texteVide() });
    aCreer++;
    lignes.push(`  ${id.padEnd(34)} ath ${p.ath.toFixed(1)}  atv ${p.atv.toFixed(1)}`);
  }
  for (const l of lignes) console.log(l);
  console.log(`${aCreer} capsule(s) à créer, ${aCompleter} traduction(s) à compléter (FR + EN).`);
  if (!live) { console.log("Dry-run : rien n'a été écrit. --live pour écrire et publier."); return; }
  const { erreurs, publie } = await enregistrer(aEcrire, []);
  for (const e of erreurs) console.log(`  ✗ ${e.cle} : ${e.message}`);
  let visible = false;
  if (publie) {
    console.log("Publié.");
    const enErreur = new Set(erreurs.map((e) => e.cle));
    const scenesEcrites = aEcrire.filter((f) => !enErreur.has(f.cle)).map((f) => f.scene);
    for (let essai = 0; essai < 12 && !visible; essai++) {
      await attendre(10_000);
      try {
        const en = new Map((await lireFiches()).map((f) => [f.scene, f] as const));
        visible = scenesEcrites.every((sc) => en.get(sc)?.idEn);
      } catch {
        // CDN pas prêt : on réessaie
      }
    }
    console.log(visible ? "Visible en ligne." : "Pas encore visible : attendre avant toute relance.");
  } else {
    console.log("Pas publié : publier la release dans Prismic AVANT toute relance (sinon doublons).");
  }
  if (erreurs.length > 0 || !publie || !visible) process.exitCode = 1;
}

main().catch((e) => {
  console.error(`Échec : ${e instanceof Error ? e.message : e}`);
  process.exitCode = 1;
});
