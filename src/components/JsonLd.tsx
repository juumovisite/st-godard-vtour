/**
 * JSON-LD schema.org (SSR) pour l'AEO — citations ChatGPT/Perplexity/Google AI.
 * Faits issus de la base de connaissances du guide Juumi (src/app/api/chat/route.ts) ;
 * coordonnées : Wikipédia (Église Saint-Godard de Rouen). Aucun fait inventé.
 */
export function JsonLd() {
  const data = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "PlaceOfWorship",
      "@id": "https://saintgodard.juumo.fr#place",
      "name": "Église Saint-Godard de Rouen",
      "description": "Visite virtuelle 360° de l'église Saint-Godard de Rouen, église gothique reconstruite entre la fin du XVe siècle et le XVIIe siècle, protégée au titre des Monuments historiques et célèbre pour ses vitraux du XVIe siècle (Arbre de Jessé, Vie de saint Romain), sa crypte flamboyante et ses orgues Cavaillé-Coll classés.",
      "url": "https://saintgodard.juumo.fr",
      "address": {
        "@type": "PostalAddress",
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
      "@id": "https://saintgodard.juumo.fr#virtualtour",
      "name": "Visite virtuelle 360° — Église Saint-Godard de Rouen",
      "description": "Découverte immersive 360° de l'église Saint-Godard de Rouen : le parvis, la nef à trois vaisseaux et ses voûtes en carène renversée, le chœur, les collatéraux et leurs verrières du XVIe siècle, le baptistère du XVIIIe siècle, les orgues Cavaillé-Coll et la crypte gothique flamboyante.",
      "url": "https://saintgodard.juumo.fr",
      "isAccessibleForFree": true,
      "location": {
        "@id": "https://saintgodard.juumo.fr#place"
      },
      "additionalProperty": {
        "@type": "PropertyValue",
        "name": "tourType",
        "value": "virtual360"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://saintgodard.juumo.fr#website",
      "url": "https://saintgodard.juumo.fr",
      "name": "Église Saint-Godard de Rouen — Visite virtuelle JUUMO",
      "about": {
        "@id": "https://saintgodard.juumo.fr#place"
      },
      "publisher": {
        "@type": "Organization",
        "name": "JUUMO",
        "url": "https://juumo.fr",
        "logo": "https://juumo.fr/icon.png"
      }
    },
    // FAQ : questions courantes des visiteurs (source : base de connaissances
    // du guide Juumi). Cible : AI Overviews, ChatGPT, Perplexity + featured snippets.
    {
      "@type": "FAQPage",
      "@id": "https://saintgodard.juumo.fr#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "De quand date l'église Saint-Godard de Rouen ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Le site est lié à un culte très ancien. L'église a été détruite par un incendie en 1248, puis reconstruite par grandes campagnes entre la fin du XVe siècle et le XVIIe siècle : nef de la seconde moitié du XVe siècle, collatéral nord achevé en 1527, collatéral sud en 1534, escaliers de la crypte et porte sur la rue du Beffroi en 1537, tour en 1612, sacristie agrandie en 1654. Elle est protégée au titre des Monuments historiques."
          }
        },
        {
          "@type": "Question",
          "name": "Qui est saint Godard ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Saint Godard, ou Gildard, est un évêque de Rouen du VIe siècle qui participa au concile d'Orléans de 511. La tradition rapporte qu'il fut inhumé ici. L'église est aussi fortement marquée par le souvenir de saint Romain, grand évêque de Rouen, auquel est consacrée sa plus grande verrière."
          }
        },
        {
          "@type": "Question",
          "name": "Quels sont les vitraux les plus remarquables de Saint-Godard ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "L'Arbre de Jessé (baie 18), largement attribué à Arnoult de Nimègue vers 1506 et souvent présenté comme l'un des sommets du vitrail rouennais de la Renaissance ; la Vie de saint Romain, plus grande verrière de la nef nord, offerte en 1540 par Richard Le Caron ; et la Vie de la Vierge (baie 6), réalisée vers 1506 et recomposée par l'atelier Gsell vers 1860-1865."
          }
        },
        {
          "@type": "Question",
          "name": "Qui a construit les orgues de Saint-Godard ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Un orgue est attesté dès 1531. Le grand orgue actuel a été construit par Aristide Cavaillé-Coll en 1884, puis l'orgue de chœur en 1885 et 1889. Les deux instruments sont classés Monuments historiques depuis 1999 et la Métropole y programme des concerts."
          }
        },
        {
          "@type": "Question",
          "name": "Peut-on visiter la crypte de Saint-Godard ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "La visite virtuelle 360° permet d'y descendre : derrière l'orgue de chœur s'ouvre l'escalier menant à une crypte de style gothique flamboyant, voûtée sur croisée d'ogives autour d'un pilier central. Ses escaliers datent de 1537."
          }
        },
        {
          "@type": "Question",
          "name": "Peut-on visiter l'église Saint-Godard en ligne gratuitement ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Oui, la visite virtuelle 360° sur saintgodard.juumo.fr est libre et gratuite : le parvis, la nef, le chœur, les collatéraux et leurs vitraux, le baptistère, les orgues et la crypte s'y explorent librement, avec un guide interactif (Juumi) pour poser ses questions."
          }
        }
      ]
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
