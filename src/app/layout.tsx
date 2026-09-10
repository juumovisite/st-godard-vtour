import type { Metadata } from "next";
import "./globals.css";

import type { Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { MatomoProvider } from "@/components/MatomoProvider";
import { JsonLd } from "@/components/JsonLd";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const SITE_URL = "https://saintgodard.juumo.fr";
const TITLE = "Visite Virtuelle 360° — Église Saint-Godard de Rouen";
const DESCRIPTION =
  "Explorez l'église Saint-Godard de Rouen en visite virtuelle 360° : la nef gothique et ses voûtes en carène, la crypte flamboyante, les vitraux du XVIe siècle et les orgues Cavaillé-Coll classés.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "visite virtuelle",
    "église Saint-Godard",
    "Rouen",
    "vitraux",
    "Arbre de Jessé",
    "orgue Cavaillé-Coll",
    "crypte",
    "visite 360",
    "Normandie",
    "patrimoine",
  ],
  authors: [{ name: "JUUMO", url: "https://juumo.fr" }],
  creator: "JUUMO",
  publisher: "JUUMO",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Église Saint-Godard de Rouen — Visite virtuelle",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/images/menu/Orgue_choeur.jpg",
        width: 1600,
        height: 1067,
        alt: "Le chœur et les vitraux de l'église Saint-Godard de Rouen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/menu/Orgue_choeur.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <head>
        {/* Mode modification JUUMO : edit.js quand un jeton ?edit= est présent (ou en sessionStorage) — le pont bridge.js est dans tour.html */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=new URLSearchParams(location.search).get('edit');if(t&&/^[A-Za-z0-9_-]{20,80}$/.test(t))sessionStorage.setItem('juumo_edit',t);" +
              "if(t||sessionStorage.getItem('juumo_edit')){var s=document.createElement('script');s.src='https://juumo-edit.vercel.app/edit.js';s.defer=true;document.head.appendChild(s);}}catch(e){}",
          }}
        />
        <JsonLd />
      </head>
      <body className="h-full bg-black m-0 p-0 overflow-hidden">
        {children}
        <Analytics />
        <MatomoProvider />
      </body>
    </html>
  );
}
