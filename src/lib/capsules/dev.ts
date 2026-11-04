/** Routes de l'outil des capsules : uniquement en `next dev`, appelées depuis localhost. */
export function horsOutil(req: Request): Response | null {
  const refus = () => new Response(null, { status: 404 });
  const hote = new URL(req.url).hostname;
  const local = hote === "localhost" || hote === "127.0.0.1";
  if (!(process.env.NODE_ENV === "development" && local)) return refus();
  if (req.method === "GET" || req.method === "HEAD") return null;
  // Écritures : une page d'un autre site pourrait poster vers localhost et utiliser le jeton d'écriture local.
  // On n'accepte que les envois venant de la page locale elle-même.
  const site = req.headers.get("sec-fetch-site");
  if (site !== null && site !== "same-origin") return refus();
  const origine = req.headers.get("origin");
  if (origine !== null) {
    let h = "";
    try { h = new URL(origine).hostname; } catch { /* origine illisible */ }
    if (h !== "localhost" && h !== "127.0.0.1") return refus();
  }
  return null;
}
