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
      "@id": "https://saintejeannedarc.juumo.fr#place",
      "name": "Église Sainte-Jeanne-d'Arc de Rouen",
      "description": "Visite virtuelle 360° de l'église Sainte-Jeanne-d'Arc de Rouen, édifice moderne (1979) de l'architecte Louis Arretche bâti sur la place du Vieux-Marché, lieu du martyre de Jeanne d'Arc, et célèbre pour ses vitraux Renaissance. La visite explore la nef, les chapelles, les vitraux et la statue de Jeanne d'Arc.",
      "url": "https://saintejeannedarc.juumo.fr",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Place du Vieux-Marché",
        "postalCode": "76000",
        "addressLocality": "Rouen",
        "addressRegion": "Normandie",
        "addressCountry": "FR"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 49.442951,
        "longitude": 1.088641
      },
      "sameAs": [
        "https://fr.wikipedia.org/wiki/%C3%89glise_Sainte-Jeanne-d%27Arc_de_Rouen"
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
      "@id": "https://saintejeannedarc.juumo.fr#virtualtour",
      "name": "Visite virtuelle 360° — Église Sainte-Jeanne-d'Arc de Rouen",
      "description": "Découverte immersive 360° de Église Sainte-Jeanne-d'Arc de Rouen à Rouen. Visite virtuelle 360° de l'église Sainte-Jeanne-d'Arc de Rouen, édifice moderne (1979) de l'architecte Louis Arretche bâti sur la place du Vieux-Marché, lieu du martyre de Jeanne d'Arc, et célèbre pour ses vitraux Renaissance. La visite explore la nef, les chapelles, les vitraux et la statue de Jeanne d'Arc.",
      "url": "https://saintejeannedarc.juumo.fr",
      "isAccessibleForFree": true,
      "location": {
        "@id": "https://saintejeannedarc.juumo.fr#place"
      },
      "additionalProperty": {
        "@type": "PropertyValue",
        "name": "tourType",
        "value": "virtual360"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://saintejeannedarc.juumo.fr#website",
      "url": "https://saintejeannedarc.juumo.fr",
      "name": "Église Sainte-Jeanne-d'Arc de Rouen — Visite virtuelle JUUMO",
      "about": {
        "@id": "https://saintejeannedarc.juumo.fr#place"
      },
      "publisher": {
        "@type": "Organization",
        "name": "JUUMO",
        "url": "https://juumo.fr",
        "logo": "https://juumo.fr/icon.png"
      }
    },
    // FAQ : questions réellement posées par les visiteurs (source : base de
    // connaissances du chatbot Juumi). Cible : AI Overviews, ChatGPT,
    // Perplexity + featured snippets Google.
    {
      "@type": "FAQPage",
      "@id": "https://saintejeannedarc.juumo.fr#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Qui a conçu l'église Sainte-Jeanne-d'Arc de Rouen ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "L'architecte Louis Arretche. Consacrée le 29 avril 1979 et inaugurée le 27 mai 1979 en présence du président Valéry Giscard d'Estaing, l'église mêle béton, métal et charpente en bois, dans une forme moderne évoquant un bateau viking, un poisson ou un heaume de chevalier. Elle est inscrite aux Monuments historiques depuis 2002."
          }
        },
        {
          "@type": "Question",
          "name": "D'où viennent les vitraux de l'église Sainte-Jeanne-d'Arc ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Les 13 verrières Renaissance (1520-1530) proviennent du chœur de l'ancienne église Saint-Vincent de Rouen, détruite par les bombardements de 1944. Mises à l'abri dès 1939, elles ont été intégrées ici grâce à l'abaissement du sol de deux mètres. Trois sont signées de l'atelier des Le Prince de Beauvais, les autres de l'atelier rouennais influencé par Arnoult de Nimègue."
          }
        },
        {
          "@type": "Question",
          "name": "Quel est le lien entre l'église et Jeanne d'Arc ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "L'église se dresse à l'emplacement exact du martyre de Jeanne d'Arc, brûlée vive le 30 mai 1431 sur la place du Vieux-Marché, à 19 ans. La grande croix extérieure du monument national marque le lieu du bûcher, et une statue de Maxime Real Del Sarte (1929) se tient près de l'entrée. Les fêtes Jeanne d'Arc s'y tiennent chaque fin mai."
          }
        },
        {
          "@type": "Question",
          "name": "Où se trouve l'église Sainte-Jeanne-d'Arc ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Au cœur de la place du Vieux-Marché, 76000 Rouen, en Normandie. Sur la même place se trouvent le mémorial Jeanne d'Arc et les halles du Vieux-Marché."
          }
        },
        {
          "@type": "Question",
          "name": "Quels sont les vitraux les plus remarquables ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Le Triomphe de la Vierge, dit vitrail des Chars (Jean et Engrand Le Prince), chef-d'œuvre de la Renaissance verrière en Normandie ; la Vie de saint Jean-Baptiste d'Engrand Le Prince ; les Œuvres de Miséricorde ; la Crucifixion et son célèbre soldat au visage bleu pâle ; ou encore le Martyre de saint Vincent, dont le maître verrier fut surnommé « le maître du martyre de saint Vincent » par Jean Lafond."
          }
        },
        {
          "@type": "Question",
          "name": "Peut-on visiter l'église Sainte-Jeanne-d'Arc en ligne gratuitement ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Oui, la visite virtuelle 360° sur saintejeannedarc.juumo.fr est libre et gratuite : la nef, la charpente, les chapelles, la statue de Jeanne d'Arc et les 13 vitraux Renaissance s'y explorent librement, avec un guide interactif (Juumi) pour poser ses questions."
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
