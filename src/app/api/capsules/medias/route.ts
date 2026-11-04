import { horsOutil } from "@/lib/capsules/dev";
import { listerAudios, listerVideos } from "@/lib/capsules/write";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const refus = horsOutil(req);
  if (refus) return refus;
  const [audios, videos] = await Promise.all([listerAudios().catch(() => []), listerVideos().catch(() => [])]);
  return Response.json({ audios, videos });
}
