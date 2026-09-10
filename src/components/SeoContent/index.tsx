/**
 * Contenu factuel rendu côté serveur (SSR) pour le SEO et l'AEO.
 *
 * La visite est une app client (KRpano) : sans ce bloc, le HTML servi à
 * Google, ChatGPT, Claude ou Perplexity ne contient quasiment aucun texte.
 * Le bloc est en sr-only : lisible par les crawlers et lecteurs d'écran,
 * invisible à l'écran (l'expérience visuelle reste la visite 360).
 * Les faits reprennent la base de connaissances du guide Juumi. Chaque
 * scène est LIÉE à sa page /scene/… : c'est le maillage interne qui rend
 * ces pages découvrables.
 */

import Link from "next/link";

export function SeoContent() {
  return (
    <>
      <section
        className="sr-only"
        aria-label="À propos de l'église Saint-Godard de Rouen"
      >
        <h1>Visite virtuelle 360° — Église Saint-Godard de Rouen</h1>
        <p>
          Explorez en immersion 360° l&apos;église Saint-Godard de Rouen,
          édifice discret en apparence mais majeur dans le patrimoine
          rouennais. Son site est lié à un culte très ancien ; détruite par un
          incendie en 1248, l&apos;église a été reconstruite par grandes
          campagnes entre la fin du XVe siècle et le XVIIe siècle : nef de la
          seconde moitié du XVe siècle, collatéral nord achevé en 1527,
          collatéral sud en 1534, tour en 1612. Dévastée par les calvinistes
          en 1562, fermée pendant la Révolution puis rouverte en 1806, elle
          est protégée au titre des Monuments historiques et reste célèbre
          pour la qualité exceptionnelle de ses vitraux.
        </p>
        <p>
          L&apos;intérieur donne une impression de clarté et de légèreté :
          trois vaisseaux, une longue perspective de 71 mètres, des arcades
          sobres à moulures prismatiques et des voûtes en bois en forme de
          carène renversée, éclairées par vingt-quatre baies.
        </p>
        <h2>L&apos;extérieur</h2>
        <ul>
          <li>
            <Link prefetch={false} href="/scene/parvis-entree">Le parvis et l&apos;entrée</Link>
          </li>
          <li>
            <Link prefetch={false} href="/scene/parvis-entree-sud">Le parvis côté sud</Link>
          </li>
          <li>
            <Link prefetch={false} href="/scene/parvis-nord">Le parvis côté nord</Link>
          </li>
          <li>
            <Link prefetch={false} href="/scene/parvis-sud-loin">La façade sud vue de loin</Link>
          </li>
          <li>
            <Link prefetch={false} href="/scene/parvis-sud-proche">La façade sud de près</Link>
          </li>
          <li>
            <Link prefetch={false} href="/scene/vue-cathedrale">La vue vers la cathédrale</Link>
          </li>
          <li>
            <Link prefetch={false} href="/scene/vue-donjon">La vue vers le donjon</Link>
          </li>
        </ul>
        <h2>La nef, le chœur et les orgues</h2>
        <ul>
          <li>
            <Link prefetch={false} href="/scene/entree">L&apos;entrée de la nef</Link> — les
            trois vaisseaux et les voûtes en carène renversée
          </li>
          <li>
            <Link prefetch={false} href="/scene/orgue">Le grand orgue</Link> — Aristide
            Cavaillé-Coll, 1884, classé Monument historique en 1999
          </li>
          <li>
            <Link prefetch={false} href="/scene/orgue-choeur">L&apos;orgue et le chœur</Link> —
            toute la profondeur de la nef centrale
          </li>
          <li>
            <Link prefetch={false} href="/scene/autel">L&apos;autel</Link>
          </li>
          <li>
            <Link prefetch={false} href="/scene/choeur-autel">Le chœur</Link>,{" "}
            <Link prefetch={false} href="/scene/choeur-autel1">vue latérale</Link> et{" "}
            <Link prefetch={false} href="/scene/choeur-autel2">vue arrière</Link> — l&apos;orgue
            de chœur Cavaillé-Coll (1885-1889)
          </li>
        </ul>
        <h2>Les collatéraux et leurs vitraux du XVIe siècle</h2>
        <ul>
          <li>
            <Link prefetch={false} href="/scene/aile-nord-autel">Le collatéral nord, l&apos;autel</Link>{" "}
            — achevé en 1527 ; ex-voto de 1871, de juin 1940 et de l&apos;Occupation
          </li>
          <li>
            <Link prefetch={false} href="/scene/aile-nord-centre">Le collatéral nord</Link> — la
            Vie de saint Romain (1540), la Vie de la Vierge (vers 1506) et
            l&apos;Arbre de Jessé attribué à Arnoult de Nimègue
          </li>
          <li>
            <Link prefetch={false} href="/scene/aile-sud-autel">Le collatéral sud, l&apos;autel</Link>{" "}
            — achevé en 1534
          </li>
          <li>
            <Link prefetch={false} href="/scene/aile-sud-autel2">Le second autel du collatéral sud</Link>
          </li>
          <li>
            <Link prefetch={false} href="/scene/aile-sud-centre">Le collatéral sud</Link>
          </li>
          <li>
            <Link prefetch={false} href="/scene/aile-sud-fond">Le fond du collatéral sud</Link>
          </li>
          <li>
            <Link prefetch={false} href="/scene/aile-sud-baptistere">Le baptistère</Link> — la
            chapelle des fonts baptismaux sous le clocher, ensemble du XVIIIe
            siècle avec lambris, bancs, cuve et couvercle
          </li>
        </ul>
        <h2>La crypte</h2>
        <p>
          Derrière l&apos;orgue de chœur s&apos;ouvre l&apos;escalier menant à{" "}
          <Link prefetch={false} href="/scene/crypte">la crypte</Link>, de style gothique
          flamboyant, voûtée sur croisée d&apos;ogives autour d&apos;un pilier
          central. Ses escaliers datent de 1537. Elle entretient le lien entre
          l&apos;église visible et une mémoire plus ancienne, attachée aux
          saints évêques de Rouen : saint Godard, ou Gildard, évêque du VIe
          siècle qui participa au concile d&apos;Orléans de 511 et fut, selon
          la tradition, inhumé ici, et saint Romain.
        </p>
        <h2>Informations pratiques</h2>
        <p>
          La visite virtuelle est libre et gratuite, compatible mobile et
          ordinateur, avec un guide interactif (Juumi) pour poser ses
          questions. Adresse : 76000 Rouen, Normandie. Découvrez aussi{" "}
          <a href="https://eglises-rouen.juumo.fr">
            toutes les églises de Rouen en 360°
          </a>
          . Cette visite virtuelle a été réalisée par{" "}
          <a href="https://juumo.fr">JUUMO</a>, studio normand spécialisé dans
          les visites virtuelles immersives.
        </p>
      </section>
      <section className="sr-only" aria-label="About this virtual tour">
        <h2>360° Virtual Tour — Saint-Godard Church, Rouen</h2>
        <p>
          Explore the church of Saint-Godard in Rouen, Normandy, in immersive
          360°. Rebuilt between the late 15th and the 17th century after a fire
          in 1248, this listed Gothic church is famous for its 16th-century
          stained glass (the Tree of Jesse attributed to Arnoult de Nimègue,
          the Life of Saint Romain), its Flamboyant Gothic crypt and its two
          Cavaillé-Coll organs, listed as historic monuments in 1999. The tour
          is free: the square, the nave, the choir, the side aisles, the
          baptistery, the organs and the crypt can all be explored online.
          Virtual tour by <a href="https://juumo.fr">JUUMO</a>.
        </p>
      </section>
    </>
  );
}
