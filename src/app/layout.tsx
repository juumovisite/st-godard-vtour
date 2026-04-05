import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visite Virtuelle - Cathédrale St Godard",
  description:
    "Explorez la cathédrale St Godard en visite virtuelle 360° interactive. Découvrez l'architecture gothique, les vitraux et la crypte.",
  openGraph: {
    title: "Visite Virtuelle - Cathédrale St Godard",
    description: "Explorez la cathédrale St Godard en visite virtuelle 360°",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full bg-black m-0 p-0 overflow-hidden">
        {children}
      </body>
    </html>
  );
}
