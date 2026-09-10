import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // panos = milliers de tiles d'images : inutiles à indexer
        disallow: ["/api/", "/vtour/panos/"],
      },
    ],
    sitemap: "https://saintgodard.juumo.fr/sitemap.xml",
  };
}
