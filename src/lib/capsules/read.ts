import { client } from "@/prismicio";
import { fusionnerLangues } from "./model";
import type { CapsuleDoc, FicheCapsule } from "./types";

/** Fiches `capsule` FR + EN pour la visite (cache Prismic habituel). Type absent du dépôt : aucune capsule. */
export async function getCapsules(): Promise<FicheCapsule[]> {
  try {
    const [fr, en] = await Promise.all([
      client.getAllByType("capsule" as never, { lang: "fr-fr" }),
      client.getAllByType("capsule" as never, { lang: "en-us" }).catch(() => []),
    ]);
    return fusionnerLangues(fr as unknown as CapsuleDoc[], en as unknown as CapsuleDoc[]);
  } catch {
    return [];
  }
}
