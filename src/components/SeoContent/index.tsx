/**
 * Contenu factuel rendu côté serveur (SSR) pour le SEO et l'AEO.
 *
 * La visite est une app client (KRpano) : sans ce bloc, le HTML servi à
 * Google, ChatGPT, Claude ou Perplexity ne contient quasiment aucun texte.
 * Le bloc est en sr-only : lisible par les crawlers et lecteurs d'écran,
 * invisible à l'écran (l'expérience visuelle reste la visite 360).
 * Les faits reprennent la base de connaissances du chatbot Juumi et les
 * documents Prismic de la visite. Chaque scène est LIÉE à sa page /scene/… :
 * c'est le maillage interne qui rend ces pages découvrables (sans lui, la
 * home est un cul-de-sac et les pages scènes ne sont que dans le sitemap).
 */

import Link from "next/link";

export function SeoContent() {
  return (
    <>
      <section
        className="sr-only"
        aria-label="À propos de l'église Sainte-Jeanne-d'Arc de Rouen"
      >
        <h1>
          Visite virtuelle 360° — Église Sainte-Jeanne-d&apos;Arc de Rouen
        </h1>
        <p>
          Explorez en immersion 360° l&apos;église Sainte-Jeanne-d&apos;Arc,
          au cœur de la place du Vieux-Marché à Rouen. Inaugurée le 27 mai
          1979 et conçue par l&apos;architecte Louis Arretche, elle a une
          double mission : honorer sainte Jeanne d&apos;Arc, brûlée ici en
          1431, et remplacer l&apos;ancienne église Saint-Vincent, détruite
          par les bombardements de 1944. Béton, métal et charpente en bois
          dessinent une forme moderne évoquant un bateau viking, un poisson ou
          un heaume de chevalier, sous une toiture d&apos;ardoise taillée
          comme des écailles. L&apos;édifice est inscrit aux Monuments
          historiques depuis 2002. Il abrite les 13 verrières Renaissance
          (1520-1530) sauvées du chœur de Saint-Vincent, mises à l&apos;abri
          dès 1939 — l&apos;une des plus importantes commandes de vitraux de
          la Renaissance en France.
        </p>
        <h2>Les espaces à découvrir dans la visite</h2>
        <ul>
          <li>
            <Link prefetch={false} href="/scene/nef-centre">La nef</Link> — l&apos;autel au centre,
            les fenêtres en forme de poisson et la place du Vieux-Marché
          </li>
          <li>
            <Link prefetch={false} href="/scene/nef-vue-sud">La nef côté sud</Link> —
            l&apos;orgue de tribune au-dessus de l&apos;entrée
          </li>
          <li>
            <Link prefetch={false} href="/scene/nef-voute">La charpente vue de la nef</Link> — le
            toit en lamelles de sapin inspiré de la construction navale
          </li>
          <li>
            <Link prefetch={false} href="/scene/voute">La voûte</Link> — une coque de bateau
            renversée, symbole voulu par Louis Arretche
          </li>
          <li>
            <Link prefetch={false} href="/scene/chapelle-de-la-vierge">La chapelle de la Vierge</Link>{" "}
            — un espace de recueillement
          </li>
          <li>
            <Link prefetch={false} href="/scene/chapelle-saint-sacrement">
              La chapelle du Saint-Sacrement
            </Link>{" "}
            — boiseries Renaissance de l&apos;ancienne église Saint-Vincent
          </li>
          <li>
            <Link prefetch={false} href="/scene/fonts-baptismaux">
              La chapelle des fonts baptismaux
            </Link>{" "}
            — une ambiance de grotte baignée d&apos;un faisceau de lumière
          </li>
          <li>
            <Link prefetch={false} href="/scene/statue-jeanne-darc">La statue de Jeanne d&apos;Arc</Link>{" "}
            — l&apos;apothéose sculptée par Michel Coste en 1999
          </li>
        </ul>
        <h2>Les 13 vitraux Renaissance de l&apos;église Saint-Vincent</h2>
        <ul>
          <li>
            <Link prefetch={false} href="/scene/vitraux-1-2-3">Vitraux 1 à 3</Link> — Vie de saint
            Pierre, Sainte Anne (signée Jean Le Vieil), Triomphe de la Vierge
            dit vitrail des Chars (Jean et Engrand Le Prince)
          </li>
          <li>
            <Link prefetch={false} href="/scene/vitraux-4-5-6">Vitraux 4 à 6</Link> — Arbre de
            sainte Anne, Vie de saint Jean-Baptiste (Engrand Le Prince),
            Œuvres de Miséricorde
          </li>
          <li>
            <Link prefetch={false} href="/scene/vitraux-7-8">Vitraux 7 et 8</Link> — Saint Antoine
            de Padoue (grisaille et sanguine), divers saints
          </li>
          <li>
            <Link prefetch={false} href="/scene/vitraux-9-10-11">Vitraux 9 à 11</Link> — Enfance et
            Vie publique du Christ, Passion du Christ, Crucifixion
          </li>
          <li>
            <Link prefetch={false} href="/scene/vitraux-12-13">Vitraux 12 et 13</Link> — Vie
            glorieuse du Christ, Martyre de saint Vincent
          </li>
        </ul>
        <p>
          Trois verrières sont signées du prestigieux atelier des Le Prince de
          Beauvais ; les autres viennent de l&apos;atelier rouennais influencé
          par le Flamand Arnoult de Nimègue. Protégées par une double verrière
          et placées au nord, à l&apos;abri du soleil direct, elles portent
          les traces de mécènes locaux : les familles Boyvin, Le Roux de
          Bourgtheroulde et Le Roux de l&apos;Esprevier.
        </p>
        <h2>Jeanne d&apos;Arc et le mémorial</h2>
        <p>
          L&apos;église se dresse à l&apos;emplacement exact du martyre de
          Jeanne d&apos;Arc, le 30 mai 1431. La grande croix du monument
          national, près de l&apos;ancien pilori retrouvé lors du chantier,
          marque le lieu du bûcher ; la statue de Maxime Real Del Sarte (1929)
          se tient près de l&apos;entrée, le regard tourné vers
          l&apos;endroit du supplice. Une citation d&apos;André Malraux a été
          dévoilée en 1979, et les fêtes Jeanne d&apos;Arc s&apos;y tiennent
          chaque fin mai.
        </p>
        <h2>Informations pratiques</h2>
        <p>
          La visite virtuelle est libre et gratuite, compatible mobile et
          ordinateur, avec un guide interactif (Juumi) pour poser ses
          questions. Adresse : place du Vieux-Marché, 76000 Rouen, Normandie.
          Découvrez aussi{" "}
          <a href="https://eglises-rouen.juumo.fr">
            toutes les églises de Rouen en 360°
          </a>
          . Cette visite virtuelle a été réalisée par{" "}
          <a href="https://juumo.fr">JUUMO</a>, studio normand spécialisé dans
          les visites virtuelles immersives.
        </p>
      </section>
      <section className="sr-only" aria-label="About this virtual tour">
        <h2>360° Virtual Tour — Sainte-Jeanne-d&apos;Arc Church, Rouen</h2>
        <p>
          Explore the church of Sainte-Jeanne-d&apos;Arc in immersive 360°, on
          the Place du Vieux-Marché in Rouen, Normandy — the exact site where
          Joan of Arc was burned in 1431. Designed by architect Louis Arretche
          and inaugurated in 1979, the modern building houses 13 Renaissance
          stained-glass windows (1520-1530) saved from the former
          Saint-Vincent church, destroyed in 1944. The tour is free, with the
          nave, chapels, windows and Joan of Arc statue all explorable
          online. Virtual tour by <a href="https://juumo.fr">JUUMO</a>.
        </p>
      </section>
    </>
  );
}
