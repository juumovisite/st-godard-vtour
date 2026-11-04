import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { horsOutil } from "@/lib/capsules/dev";
import { prealignsDuTour, scenesDuTour, tourAvecPrealign, validerPrealign, type Prealign } from "@/lib/capsules/prealign";

export const dynamic = "force-dynamic";

/** tour.xml servi à la visite, et la source qui le régénère si le projet en a une. */
const TOUR = () => path.join(process.cwd(), "public/vtour/tour.xml");
const SOURCES = () => [path.join(process.cwd(), "scripts/tour_source.xml")];

/** Écriture atomique : jamais de tour.xml à moitié écrit servi à la visite. */
function ecrire(fichier: string, contenu: string) {
  const tmp = `${fichier}.tmp-${process.pid}`;
  writeFileSync(tmp, contenu, "utf8");
  renameSync(tmp, fichier);
}

export async function GET(req: Request) {
  const refus = horsOutil(req);
  if (refus) return refus;
  try {
    return Response.json({ prealign: prealignsDuTour(readFileSync(TOUR(), "utf8")) });
  } catch (e) {
    return Response.json({ erreur: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

/** Corps : { prealign: { scene_x: { tilt, pan, roll } } }. Seul l'attribut prealign du <image> de ces scènes change. */
export async function POST(req: Request) {
  const refus = horsOutil(req);
  if (refus) return refus;
  let demandes: [string, Prealign][];
  let xml: string;
  try {
    xml = readFileSync(TOUR(), "utf8");
    const corps = (await req.json()) as { prealign?: unknown };
    if (!corps?.prealign || typeof corps.prealign !== "object" || Array.isArray(corps.prealign)) throw new Error("Corps de requête invalide");
    const connues = new Set(scenesDuTour(xml));
    demandes = Object.entries(corps.prealign as Record<string, unknown>).map(([s, v]) => {
      if (!connues.has(s)) throw new Error(`Scène inconnue : ${s}`);
      return [s, validerPrealign(v)];
    });
  } catch (e) {
    return Response.json({ erreur: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
  try {
    // Sources d'abord : si l'une échoue, tour.xml n'est pas modifié
    for (const src of SOURCES().filter((f) => existsSync(f))) {
      let s = readFileSync(src, "utf8");
      const presentes = new Set(scenesDuTour(s));
      for (const [scene, p] of demandes) if (presentes.has(scene)) s = tourAvecPrealign(s, scene, p);
      ecrire(src, s);
    }
    for (const [scene, p] of demandes) xml = tourAvecPrealign(xml, scene, p);
    ecrire(TOUR(), xml);
    return Response.json({ prealign: prealignsDuTour(xml) });
  } catch (e) {
    return Response.json({ erreur: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
