import { horsOutil } from "@/lib/capsules/dev";
import { lireNomsScenes, renommerScenes, validerRenommages } from "@/lib/capsules/scenes";

export const dynamic = "force-dynamic";

/** Noms FR / EN des scènes, tels que stockés dans les docs Prismic `scene` (champ `title`). */
export async function GET(req: Request) {
  const refus = horsOutil(req);
  if (refus) return refus;
  try {
    return Response.json({ scenes: await lireNomsScenes() });
  } catch (e) {
    return Response.json({ erreur: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

/** Renomme les scènes envoyées (seul `data.title` change), puis publie. */
export async function POST(req: Request) {
  const refus = horsOutil(req);
  if (refus) return refus;
  let renommages;
  try {
    renommages = validerRenommages(((await req.json()) as { scenes?: unknown })?.scenes);
  } catch (e) {
    return Response.json({ erreurs: [{ cle: "général", message: e instanceof Error ? e.message : "Corps de requête invalide" }], publie: false, scenes: null }, { status: 400 });
  }
  try {
    return Response.json(await renommerScenes(renommages));
  } catch (e) {
    return Response.json({ erreurs: [{ cle: "général", message: e instanceof Error ? e.message : String(e) }], publie: false, scenes: null }, { status: 500 });
  }
}
