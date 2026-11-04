import { horsOutil } from "@/lib/capsules/dev";
import { envoyerAudio } from "@/lib/capsules/write";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const refus = horsOutil(req);
  if (refus) return refus;
  let file: unknown;
  try {
    file = (await req.formData()).get("file");
  } catch {
    file = null;
  }
  if (!(file instanceof File)) return Response.json({ erreur: "Aucun fichier" }, { status: 400 });
  try {
    return Response.json(await envoyerAudio(file));
  } catch (e) {
    return Response.json({ erreur: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
