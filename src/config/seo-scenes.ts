/**
 * Contenu SEO/AEO par scène (SSR, sr-only) — source : base de connaissances
 * du guide Juumi (src/app/api/chat/route.ts). Aucun fait inventé : quand la
 * base ne dit rien de précis sur un point de vue, le texte reste descriptif
 * (ce que la scène montre) et renvoie aux faits documentés de l'édifice.
 * Clé = uid Prismic fr-fr de la scène (= segment /scene/<uid>).
 * `related` = maillage interne entre pages de scènes.
 */

export interface SceneSeo {
  /** Title unique (balise <title> + H1 sr-only). */
  title: string;
  /** Meta description unique (≤160 caractères). */
  description: string;
  /** Paragraphes factuels rendus en SSR (sr-only). */
  body: string[];
  /** Maillage interne : uid de scène + libellé du lien. */
  related: { uid: string; label: string }[];
}

const EGLISE = "Église Saint-Godard de Rouen en 360°";

const HISTOIRE =
  "Le site de Saint-Godard est lié à un culte très ancien. Détruite par un incendie en 1248, l'église a été reconstruite par grandes campagnes entre la fin du XVe siècle et le XVIIe siècle : nef de la seconde moitié du XVe siècle, collatéral nord achevé en 1527, collatéral sud en 1534, tour en 1612, sacristie agrandie en 1654. Elle est protégée au titre des Monuments historiques.";

const INTERIEUR =
  "L'intérieur donne une impression de clarté et de légèreté : trois vaisseaux, une longue perspective de 71 mètres selon la paroisse, des arcades sobres à moulures prismatiques et des voûtes en bois en forme de carène renversée, éclairées par vingt-quatre baies.";

const ORGUES =
  "Un orgue est attesté à Saint-Godard dès 1531, avec des compositions connues en 1632 puis 1778. Le grand tournant arrive au XIXe siècle : Aristide Cavaillé-Coll construit le grand orgue en 1884, puis l'orgue de chœur en 1885 et 1889. Les deux instruments sont classés Monuments historiques depuis 1999, et la Métropole continue d'y programmer des concerts.";

const VITRAUX_NORD =
  "La nef nord abrite les verrières les plus célèbres de l'église. La Vie de saint Romain, plus grande verrière de la nef nord, fut offerte en 1540 par Richard Le Caron, sieur du Fossé : cinq lancettes sur quatre registres montrent saint Romain capturant la gargouille, le miracle des saintes huiles, l'arrêt de la crue de la Seine ou la levée de la Fierte. L'Arbre de Jessé (baie 18), largement attribué à Arnoult de Nimègue autour de 1506, est souvent présenté comme l'un des sommets du vitrail rouennais de la Renaissance. La Vie de la Vierge (baie 6), réalisée vers 1506, a été recomposée par l'atelier de Laurent Gsell vers 1860-1865.";

export const SCENES_SEO: Record<string, SceneSeo> = {
  "parvis-entree": {
    title: `Le parvis et l'entrée — ${EGLISE}`,
    description:
      "Le parvis et la façade de l'église Saint-Godard de Rouen en 360° : point de départ de la visite virtuelle d'une église gothique reconstruite du XVe au XVIIe siècle.",
    body: [
      "Bienvenue devant l'église Saint-Godard de Rouen. Cette scène 360° montre le parvis et l'entrée de l'édifice, point de départ de la visite virtuelle.",
      HISTOIRE,
    ],
    related: [
      { uid: "entree", label: "entrer dans la nef" },
      { uid: "parvis-entree-sud", label: "le parvis côté sud" },
      { uid: "parvis-nord", label: "le parvis côté nord" },
    ],
  },
  "parvis-entree-sud": {
    title: `Le parvis côté sud — ${EGLISE}`,
    description:
      "La façade latérale sud de l'église Saint-Godard de Rouen en 360° : le collatéral sud achevé en 1534 et les toitures modifiées au XVIIIe siècle.",
    body: [
      "Vue depuis le côté sud du parvis sur la façade latérale de Saint-Godard. Le collatéral sud a été achevé en 1534 ; au XVIIIe siècle, les toitures latérales ont été modifiées pour harmoniser les volumes de l'édifice.",
      HISTOIRE,
    ],
    related: [
      { uid: "parvis-sud-proche", label: "la façade sud de près" },
      { uid: "parvis-sud-loin", label: "la façade sud vue de loin" },
      { uid: "parvis-entree", label: "retour au parvis principal" },
    ],
  },
  "parvis-nord": {
    title: `Le parvis côté nord — ${EGLISE}`,
    description:
      "Le côté nord de l'église Saint-Godard de Rouen en 360° : le collatéral nord achevé en 1527, derrière lequel se trouvent les grandes verrières du XVIe siècle.",
    body: [
      "Le côté nord de Saint-Godard correspond au collatéral nord, achevé en 1527. C'est derrière ces murs que se trouvent la Vie de saint Romain (1540) et l'Arbre de Jessé, les verrières les plus célèbres de l'église.",
      HISTOIRE,
    ],
    related: [
      { uid: "aile-nord-centre", label: "le collatéral nord et ses vitraux" },
      { uid: "parvis-entree", label: "retour au parvis principal" },
      { uid: "vue-cathedrale", label: "la vue vers la cathédrale" },
    ],
  },
  "parvis-sud-loin": {
    title: `La façade sud vue de loin — ${EGLISE}`,
    description:
      "L'église Saint-Godard de Rouen dans son quartier, vue éloignée du côté sud en 360° : la silhouette gothique et la tour construite en 1612.",
    body: [
      "Cette perspective éloignée depuis le sud permet d'apprécier l'ensemble de Saint-Godard dans son environnement urbain, avec sa tour construite en 1612. L'église est discrète en apparence, mais majeure dans le patrimoine rouennais.",
      HISTOIRE,
    ],
    related: [
      { uid: "parvis-sud-proche", label: "la façade sud de près" },
      { uid: "vue-donjon", label: "la vue vers le donjon" },
      { uid: "parvis-entree", label: "retour au parvis principal" },
    ],
  },
  "parvis-sud-proche": {
    title: `La façade sud de près — ${EGLISE}`,
    description:
      "Vue rapprochée de la façade sud de l'église Saint-Godard de Rouen en 360° : les détails de l'architecture du gothique tardif.",
    body: [
      "Vue rapprochée de la façade sud de Saint-Godard, dont l'architecture garde la sobriété du gothique tardif. Le collatéral sud a été achevé en 1534.",
      HISTOIRE,
    ],
    related: [
      { uid: "parvis-sud-loin", label: "la façade sud vue de loin" },
      { uid: "aile-sud-centre", label: "le collatéral sud, à l'intérieur" },
      { uid: "parvis-entree", label: "retour au parvis principal" },
    ],
  },
  "vue-cathedrale": {
    title: `La vue vers la cathédrale — ${EGLISE}`,
    description:
      "Point de vue extérieur en 360° depuis les abords de l'église Saint-Godard, vers la cathédrale de Rouen et le centre historique.",
    body: [
      "Depuis les abords de Saint-Godard, ce panorama s'ouvre vers la cathédrale de Rouen et le centre historique. Saint-Godard porte le nom d'un évêque de Rouen du VIe siècle, saint Godard ou Gildard, et reste fortement marquée par le souvenir de saint Romain, autre grand évêque de la ville.",
    ],
    related: [
      { uid: "vue-donjon", label: "la vue vers le donjon" },
      { uid: "parvis-nord", label: "le parvis côté nord" },
      { uid: "parvis-entree", label: "retour au parvis principal" },
    ],
  },
  "vue-donjon": {
    title: `La vue vers le donjon — ${EGLISE}`,
    description:
      "Point de vue extérieur en 360° depuis les abords de l'église Saint-Godard de Rouen, vers le donjon et les toits du quartier.",
    body: [
      "Ce panorama extérieur, pris depuis un point de vue élevé aux abords de Saint-Godard, s'ouvre vers le donjon et les toits du quartier. L'église elle-même se distingue par sa tour de 1612 et ses toitures latérales remaniées au XVIIIe siècle.",
    ],
    related: [
      { uid: "vue-cathedrale", label: "la vue vers la cathédrale" },
      { uid: "parvis-sud-loin", label: "la façade sud vue de loin" },
      { uid: "entree", label: "entrer dans la nef" },
    ],
  },
  entree: {
    title: `L'entrée de la nef — ${EGLISE}`,
    description:
      "La nef de l'église Saint-Godard de Rouen en 360° : trois vaisseaux, 71 mètres de perspective et des voûtes en bois en carène renversée, seconde moitié du XVe siècle.",
    body: [
      "Depuis l'entrée, la nef de Saint-Godard, attribuée à la seconde moitié du XVe siècle, se découvre dans toute sa longueur. " + INTERIEUR,
      "Sa force réside dans la pureté de son volume, dans sa mémoire religieuse et dans le dialogue constant entre la pierre et la lumière colorée des verrières.",
    ],
    related: [
      { uid: "orgue-choeur", label: "l'orgue et le chœur" },
      { uid: "aile-nord-centre", label: "le collatéral nord et ses vitraux" },
      { uid: "aile-sud-centre", label: "le collatéral sud" },
    ],
  },
  orgue: {
    title: `Le grand orgue Cavaillé-Coll — ${EGLISE}`,
    description:
      "Le grand orgue de l'église Saint-Godard de Rouen en 360°, construit par Aristide Cavaillé-Coll en 1884 et classé Monument historique en 1999.",
    body: [
      "Le grand orgue de Saint-Godard domine la tribune. " + ORGUES,
    ],
    related: [
      { uid: "orgue-choeur", label: "l'orgue et le chœur" },
      { uid: "choeur-autel2", label: "l'orgue de chœur, vue arrière" },
      { uid: "entree", label: "l'entrée de la nef" },
    ],
  },
  "orgue-choeur": {
    title: `L'orgue et le chœur — ${EGLISE}`,
    description:
      "De l'orgue au chœur : toute la profondeur de la nef de l'église Saint-Godard de Rouen en 360°, avec ses voûtes en carène et ses vingt-quatre baies.",
    body: [
      "Cette scène relie le grand orgue au chœur et montre toute la profondeur de la nef centrale. " + INTERIEUR,
      ORGUES,
    ],
    related: [
      { uid: "orgue", label: "le grand orgue" },
      { uid: "choeur-autel", label: "le chœur et l'autel" },
      { uid: "crypte", label: "descendre dans la crypte" },
    ],
  },
  autel: {
    title: `L'autel — ${EGLISE}`,
    description:
      "L'autel de l'église Saint-Godard de Rouen en 360°, au cœur d'un vaisseau central dont le mobilier a été renouvelé après la Révolution.",
    body: [
      "L'autel occupe le centre de la liturgie à Saint-Godard. On chercherait presque en vain un mobilier antérieur à la Révolution dans le vaisseau central : l'église, dévastée par les calvinistes en 1562, fermée pendant la Révolution puis rouverte en 1806, a vu son mobilier largement renouvelé.",
    ],
    related: [
      { uid: "choeur-autel", label: "le chœur" },
      { uid: "choeur-autel1", label: "le chœur, vue latérale" },
      { uid: "orgue-choeur", label: "l'orgue et le chœur" },
    ],
  },
  "choeur-autel": {
    title: `Le chœur — ${EGLISE}`,
    description:
      "Le chœur de l'église Saint-Godard de Rouen en 360° : l'espace liturgique, ses verrières et l'orgue de chœur Cavaillé-Coll de 1885-1889.",
    body: [
      "Le chœur de Saint-Godard concentre l'espace liturgique de l'église, éclairé par ses verrières. C'est ici que se trouve l'orgue de chœur construit par Aristide Cavaillé-Coll en 1885 et 1889, classé Monument historique en 1999 comme le grand orgue.",
      "Derrière l'orgue de chœur s'ouvre l'escalier menant à la crypte gothique flamboyante, dont les escaliers datent de 1537.",
    ],
    related: [
      { uid: "choeur-autel1", label: "le chœur, vue latérale" },
      { uid: "choeur-autel2", label: "le chœur, vue arrière" },
      { uid: "crypte", label: "la crypte" },
    ],
  },
  "choeur-autel1": {
    title: `Le chœur, vue latérale — ${EGLISE}`,
    description:
      "Vue latérale du chœur de l'église Saint-Godard de Rouen en 360° : les verrières et l'architecture intérieure du gothique tardif.",
    body: [
      "Vue latérale du chœur de Saint-Godard, qui révèle les verrières et les arcades à moulures prismatiques caractéristiques de l'église. " + INTERIEUR,
    ],
    related: [
      { uid: "choeur-autel", label: "le chœur et l'autel" },
      { uid: "choeur-autel2", label: "le chœur, vue arrière" },
      { uid: "aile-nord-autel", label: "le collatéral nord" },
    ],
  },
  "choeur-autel2": {
    title: `Le chœur, vue arrière — ${EGLISE}`,
    description:
      "Le chœur de l'église Saint-Godard de Rouen vu de l'arrière en 360°, avec l'orgue de chœur Cavaillé-Coll et l'accès à la crypte.",
    body: [
      "Depuis l'arrière du chœur, cette scène embrasse l'ensemble de l'espace liturgique de Saint-Godard. " + ORGUES,
    ],
    related: [
      { uid: "crypte", label: "descendre dans la crypte" },
      { uid: "choeur-autel", label: "le chœur et l'autel" },
      { uid: "orgue", label: "le grand orgue" },
    ],
  },
  "aile-nord-autel": {
    title: `Le collatéral nord, l'autel — ${EGLISE}`,
    description:
      "L'autel du collatéral nord de l'église Saint-Godard de Rouen en 360° : un collatéral achevé en 1527, marqué par ses ex-voto de 1871, 1940 et de l'Occupation.",
    body: [
      "Le collatéral nord de Saint-Godard a été achevé en 1527. Dans cette nef nord, plusieurs ex-voto témoignent de périodes d'angoisse collective : 1871 devant la Vierge, juin 1940 devant saint Antoine de Padoue, et l'Occupation devant saint Joseph.",
      VITRAUX_NORD,
    ],
    related: [
      { uid: "aile-nord-centre", label: "le centre du collatéral nord" },
      { uid: "choeur-autel1", label: "le chœur, vue latérale" },
      { uid: "aile-sud-autel", label: "le collatéral sud" },
    ],
  },
  "aile-nord-centre": {
    title: `Le collatéral nord et ses vitraux — ${EGLISE}`,
    description:
      "Les vitraux du collatéral nord de l'église Saint-Godard de Rouen en 360° : la Vie de saint Romain (1540), la Vie de la Vierge et l'Arbre de Jessé d'Arnoult de Nimègue.",
    body: [
      "Le centre du collatéral nord, achevé en 1527, est le meilleur point de vue sur le trésor de Saint-Godard : ses verrières des XVIe et XVIIIe siècles, déposées, restaurées ou recomposées au fil de l'histoire.",
      VITRAUX_NORD,
      "Après la Révolution, seules la Vie de saint Romain et les Apparitions du Christ ressuscité avaient réellement survécu dans la nef nord ; beaucoup de baies furent complétées par des vitraux du XIXe siècle, souvent de la maison Gsell.",
    ],
    related: [
      { uid: "aile-nord-autel", label: "l'autel du collatéral nord" },
      { uid: "entree", label: "la nef" },
      { uid: "aile-sud-centre", label: "le collatéral sud" },
    ],
  },
  "aile-sud-autel": {
    title: `Le collatéral sud, l'autel — ${EGLISE}`,
    description:
      "L'autel latéral du collatéral sud de l'église Saint-Godard de Rouen en 360°, dans un collatéral achevé en 1534.",
    body: [
      "L'autel latéral du collatéral sud de Saint-Godard. Le collatéral sud a été achevé en 1534, sept ans après le collatéral nord, dans la grande campagne de reconstruction qui suivit l'incendie de 1248 et s'étendit jusqu'au XVIIe siècle.",
      INTERIEUR,
    ],
    related: [
      { uid: "aile-sud-autel2", label: "le second autel du collatéral sud" },
      { uid: "aile-sud-baptistere", label: "le baptistère" },
      { uid: "aile-nord-autel", label: "le collatéral nord" },
    ],
  },
  "aile-sud-autel2": {
    title: `Le second autel du collatéral sud — ${EGLISE}`,
    description:
      "Un second espace de dévotion dans le collatéral sud de l'église Saint-Godard de Rouen en 360°.",
    body: [
      "Second espace de dévotion du collatéral sud de Saint-Godard, achevé en 1534. L'intérêt de l'église vient du dialogue entre survivances du XVIe siècle, restaurations du XIXe siècle et réaménagements liturgiques plus récents.",
    ],
    related: [
      { uid: "aile-sud-autel", label: "l'autel du collatéral sud" },
      { uid: "aile-sud-centre", label: "le centre du collatéral sud" },
      { uid: "aile-sud-fond", label: "le fond du collatéral sud" },
    ],
  },
  "aile-sud-baptistere": {
    title: `Le baptistère — ${EGLISE}`,
    description:
      "La chapelle des fonts baptismaux de l'église Saint-Godard de Rouen en 360° : un ensemble du XVIIIe siècle avec lambris, bancs, cuve et couvercle, sous le clocher.",
    body: [
      "Sous le clocher, la chapelle des fonts baptismaux de Saint-Godard forme un bel ensemble du XVIIIe siècle : lambris, bancs, cuve baptismale et son couvercle. C'est l'un des rares ensembles de mobilier ancien conservés dans l'église.",
    ],
    related: [
      { uid: "aile-sud-autel", label: "l'autel du collatéral sud" },
      { uid: "aile-sud-centre", label: "le centre du collatéral sud" },
      { uid: "entree", label: "la nef" },
    ],
  },
  "aile-sud-centre": {
    title: `Le collatéral sud — ${EGLISE}`,
    description:
      "Le collatéral sud de l'église Saint-Godard de Rouen en 360° : colonnes, voûtes et lumière des baies d'un bas-côté achevé en 1534.",
    body: [
      "Le centre du collatéral sud, achevé en 1534, offre une perspective sur les colonnes et les voûtes de ce bas-côté. " + INTERIEUR,
    ],
    related: [
      { uid: "aile-sud-fond", label: "le fond du collatéral sud" },
      { uid: "aile-sud-baptistere", label: "le baptistère" },
      { uid: "aile-nord-centre", label: "le collatéral nord et ses vitraux" },
    ],
  },
  "aile-sud-fond": {
    title: `Le fond du collatéral sud — ${EGLISE}`,
    description:
      "Le fond du collatéral sud de l'église Saint-Godard de Rouen en 360°, espace de recueillement baigné par la lumière des verrières.",
    body: [
      "Le fond du collatéral sud de Saint-Godard est un espace de recueillement baigné par la lumière filtrée des verrières. Les vitraux de l'église, des XVIe et XVIIIe siècles, forment un patrimoine vivant traversé par les accidents de l'histoire, les restaurations du XIXe siècle et les protections patrimoniales du XXe siècle.",
    ],
    related: [
      { uid: "aile-sud-centre", label: "le centre du collatéral sud" },
      { uid: "aile-sud-autel2", label: "le second autel du collatéral sud" },
      { uid: "parvis-sud-proche", label: "la façade sud, à l'extérieur" },
    ],
  },
  crypte: {
    title: `La crypte — ${EGLISE}`,
    description:
      "La crypte de l'église Saint-Godard de Rouen en 360° : gothique flamboyant, croisée d'ogives et pilier central, escaliers de 1537, mémoire des saints évêques de Rouen.",
    body: [
      "Derrière l'orgue de chœur s'ouvre l'escalier menant à la crypte de Saint-Godard. C'est une crypte de style gothique flamboyant, voûtée sur croisée d'ogives, avec un pilier central ; ses escaliers datent de 1537.",
      "Elle entretient le lien entre l'église visible et une mémoire plus ancienne, attachée aux saints évêques de Rouen : saint Godard, ou Gildard, évêque du VIe siècle présent au concile d'Orléans de 511 et inhumé ici selon la tradition, et saint Romain. Elle donne une profondeur spirituelle et historique que l'on ne perçoit pas depuis la nef.",
    ],
    related: [
      { uid: "choeur-autel2", label: "remonter vers le chœur" },
      { uid: "orgue-choeur", label: "l'orgue et le chœur" },
      { uid: "entree", label: "la nef" },
    ],
  },
};
