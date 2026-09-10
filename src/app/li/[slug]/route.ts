import { NextRequest, NextResponse } from "next/server";

/**
 * Liens courts trackés des posts réseaux sociaux : /li/<slug> → accueil + paramètres de campagne.
 *
 * Deux formats de slug, le second est l'historique :
 *
 *  1. `<8 hex>-<lettre canal>` (posé par le module Réseaux du cockpit)
 *     → `?utm_source=<canal>&utm_medium=social&utm_campaign=rs-<8 hex>-<canal>`
 *     La campagne `rs-…` est celle que la relève Matomo du cockpit raccroche à la
 *     publication : les clics remontent dans l'onglet Performances, canal par canal.
 *
 *  2. tout autre slug (`p4`, `p5`…) → `?mtm_campaign=linkedin&mtm_kwd=<slug>`
 *     Format des posts rédigés à la main avant le passage par le cockpit.
 *
 * Redirection 307 (temporaire) : un 301 serait mis en cache par le navigateur et les
 * paramètres de campagne ne repartiraient plus au clic suivant.
 */

/** Initiale → canal du module Réseaux. Doit rester alignée sur RESEAUX_CANAUX (cockpit). */
const CANAUX: Record<string, string> = {
  l: "linkedin",
  p: "facebook_perso",
  f: "facebook",
  i: "instagram",
  g: "gbp",
};

const SLUG_COCKPIT = /^([0-9a-f]{8})-([lpfig])$/;

/**
 * Robots d'aperçu des réseaux sociaux. Ils doivent atteindre la page de destination pour y
 * lire les balises Open Graph : un 307 les arrête souvent en chemin et le post s'affiche
 * sans vignette. On leur répond donc 301, vers l'URL nue (les paramètres de campagne ne
 * concernent que les humains, et le cache d'un robot ne casse aucun tracking).
 */
const ROBOTS_APERCU =
  /facebookexternalhit|facebookcatalog|linkedinbot|twitterbot|whatsapp|slackbot|telegrambot|discordbot|pinterest|redditbot|applebot|skypeuripreview|bingpreview|embedly|quora link preview|vkshare|w3c_validator/i;

/**
 * Jamais de cache : la réponse dépend du User-Agent (robot ou humain). Une réponse mise en
 * cache par le CDN serait resservie à tout le monde — un 301 d'aperçu servi à un visiteur
 * lui ferait perdre ses paramètres de campagne, donc le suivi du clic.
 */
export const dynamic = "force-dynamic";

const SANS_CACHE = { "cache-control": "no-store, max-age=0", vary: "user-agent" };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = new URL("/", req.url);

  if (ROBOTS_APERCU.test(req.headers.get("user-agent") ?? "")) {
    return NextResponse.redirect(url, { status: 301, headers: SANS_CACHE });
  }

  const m = SLUG_COCKPIT.exec(slug);
  if (m) {
    const canal = CANAUX[m[2]];
    url.searchParams.set("utm_source", canal);
    url.searchParams.set("utm_medium", "social");
    url.searchParams.set("utm_campaign", `rs-${m[1]}-${canal}`);
  } else {
    url.searchParams.set("mtm_campaign", "linkedin");
    url.searchParams.set("mtm_kwd", slug.slice(0, 60));
  }

  return NextResponse.redirect(url, { status: 307, headers: SANS_CACHE });
}
