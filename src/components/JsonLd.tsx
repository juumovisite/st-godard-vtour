/**
 * JSON-LD schema.org (SSR) pour l'AEO — citations ChatGPT/Perplexity/Google AI.
 * Données validées manuellement. Généré par le déploiement AEO JUUMO.
 */
export function JsonLd() {
  const data = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "PlaceOfWorship",
      "@id": "https://st-godard-vtour.vercel.app#place",
      "name": "Église Saint-Godard de Rouen",
      "description": "Visite virtuelle 360° de l'église Saint-Godard de Rouen, église paroissiale catholique de style gothique flamboyant et Renaissance, classée monument historique depuis 1862. Le parcours immersif compte 22 scènes (parvis, nef, vitraux, chapelles).",
      "url": "https://st-godard-vtour.vercel.app",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1 Place Saint-Godard",
        "postalCode": "76000",
        "addressLocality": "Rouen",
        "addressRegion": "Normandie",
        "addressCountry": "FR"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 49.4449564,
        "longitude": 1.095441
      },
      "sameAs": [
        "https://fr.wikipedia.org/wiki/%C3%89glise_Saint-Godard_de_Rouen"
      ],
      "amenityFeature": [
        {
          "@type": "LocationFeatureSpecification",
          "name": "Visite virtuelle 360°",
          "value": true
        }
      ]
    },
    {
      "@type": "TouristAttraction",
      "@id": "https://st-godard-vtour.vercel.app#virtualtour",
      "name": "Visite virtuelle 360° — Église Saint-Godard de Rouen",
      "description": "Découverte immersive 360° de Église Saint-Godard de Rouen à Rouen. Visite virtuelle 360° de l'église Saint-Godard de Rouen, église paroissiale catholique de style gothique flamboyant et Renaissance, classée monument historique depuis 1862. Le parcours immersif compte 22 scènes (parvis, nef, vitraux, chapelles).",
      "url": "https://st-godard-vtour.vercel.app",
      "isAccessibleForFree": true,
      "location": {
        "@id": "https://st-godard-vtour.vercel.app#place"
      },
      "additionalProperty": {
        "@type": "PropertyValue",
        "name": "tourType",
        "value": "virtual360"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://st-godard-vtour.vercel.app#website",
      "url": "https://st-godard-vtour.vercel.app",
      "name": "Église Saint-Godard de Rouen — Visite virtuelle JUUMO",
      "about": {
        "@id": "https://st-godard-vtour.vercel.app#place"
      },
      "publisher": {
        "@type": "Organization",
        "name": "JUUMO",
        "url": "https://juumo.fr",
        "logo": "https://juumo.fr/icon.png"
      }
    }
  ]
};
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
