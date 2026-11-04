import { horsOutil } from "@/lib/capsules/dev";
import { aJeton, enregistrer, lireFiches } from "@/lib/capsules/write";
import type { FicheCapsule } from "@/lib/capsules/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const refus = horsOutil(req);
  if (refus) return refus;
  try {
    return Response.json({ fiches: await lireFiches(), jeton: aJeton() });
  } catch (e) {
    return Response.json({ erreur: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const refus = horsOutil(req);
  if (refus) return refus;
  try {
    let corps: unknown;
    try { corps = await req.json(); } catch { corps = null; }
    if (!corps || typeof corps !== "object" || Array.isArray(corps)) {
      return Response.json({ erreurs: [{ cle: "général", message: "Corps de requête invalide" }], publie: false, fiches: null }, { status: 400 });
    }
    const { fiches, supprimees } = corps as { fiches?: FicheCapsule[]; supprimees?: { id: string; idEn: string | null }[] };
    // Fiches renvoyées par l'enregistrement (identifiants créés compris) : pas de relecture CDN, en retard après publication
    return Response.json(await enregistrer(fiches ?? [], supprimees ?? []));
  } catch (e) {
    return Response.json({ erreurs: [{ cle: "général", message: e instanceof Error ? e.message : String(e) }], publie: false, fiches: null }, { status: 500 });
  }
}
