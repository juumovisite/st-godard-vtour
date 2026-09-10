import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Liens courts trackés : /li/<slug> est servi par src/app/li/[slug]/route.ts (il traduit
  // le slug en campagne, cockpit ou historique). Ici on ne garde que /li nu, qui n'a pas de
  // slug à interpréter — un redirect statique le couvre sans passer par le routeur.
  async redirects() {
    return [
      {
        source: "/li",
        destination: "/?mtm_campaign=linkedin&mtm_kwd=li",
        permanent: false
      }
    ];
  }
};

export default nextConfig;
