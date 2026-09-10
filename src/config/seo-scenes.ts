/**
 * Contenu SEO/AEO par scène (SSR, sr-only) — source : base de connaissances
 * du chatbot Juumi (src/app/api/chat/route.ts) et documents « informations »
 * Prismic de la visite. Aucun fait inventé.
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

export const SCENES_SEO: Record<string, SceneSeo> = {
  "nef-centre": {
    title: "La nef — Église Sainte-Jeanne-d'Arc de Rouen en 360°",
    description:
      "La nef de l'église Sainte-Jeanne-d'Arc de Rouen en 360° : autel central, fenêtres en forme de poisson, place du Vieux-Marché où Jeanne d'Arc fut brûlée en 1431.",
    body: [
      "Bienvenue dans la nef de l'église Sainte-Jeanne-d'Arc, au cœur de la place du Vieux-Marché à Rouen. C'est ici, au pied de la grande croix qui s'élève sur la place, que Jeanne d'Arc fut brûlée vive le 30 mai 1431, à l'âge de 19 ans. La croix rend hommage à l'un de ses derniers souhaits : voir une croix dans ses derniers instants.",
      "L'intérieur, conçu par l'architecte Louis Arretche et inauguré en 1979, est épuré et lumineux : l'autel est placé au centre, une seule colonne interne se dresse près du chœur, et les fenêtres latérales adoptent la forme d'un poisson, symbole des premiers chrétiens. Des silex incrustés dans le ciment rappellent les falaises de la côte d'Albâtre.",
    ],
    related: [
      { uid: "nef-voute", label: "la charpente en bois vue de la nef" },
      { uid: "vitraux-1-2-3", label: "les premières verrières Renaissance" },
      { uid: "statue-jeanne-darc", label: "la statue de Jeanne d'Arc par Michel Coste" },
    ],
  },
  "nef-vue-sud": {
    title: "La nef côté sud et l'orgue de tribune — Sainte-Jeanne-d'Arc Rouen 360°",
    description:
      "La nef vue du sud en 360° : l'orgue de tribune au-dessus de l'entrée, la statue de Jeanne d'Arc et la ligne des 13 vitraux Renaissance de l'église de Rouen.",
    body: [
      "Depuis le côté sud de la nef, le regard embrasse l'ensemble de l'église Sainte-Jeanne-d'Arc : la ligne des vitraux Renaissance au nord, la statue de Jeanne d'Arc et, au-dessus de l'entrée, l'orgue de tribune. Cet instrument modeste, au buffet simple et fonctionnel, s'intègre discrètement à l'architecture et accompagne les offices.",
      "Les vitraux sont volontairement placés au nord, à l'abri du soleil direct, et protégés par une double verrière : ils s'admirent ainsi toute la journée.",
    ],
    related: [
      { uid: "nef-centre", label: "le centre de la nef" },
      { uid: "statue-jeanne-darc", label: "la statue de Jeanne d'Arc" },
      { uid: "vitraux-9-10-11", label: "les vitraux de la Passion et de la Crucifixion" },
    ],
  },
  "nef-voute": {
    title: "La charpente en bois vue de la nef — Sainte-Jeanne-d'Arc Rouen 360°",
    description:
      "La charpente de l'église Sainte-Jeanne-d'Arc en 360° : toit en lamelles de sapin inspiré de la construction navale, paraboles de bois sur portique métallique.",
    body: [
      "En levant les yeux depuis la nef, on découvre le toit en lamelles de sapin de l'église Sainte-Jeanne-d'Arc : ses techniques sont reprises de la construction navale, comme une coque de bateau renversée. Les grandes paraboles en bois reposent sur un portique tubulaire en métal, et un seul pilier interne soutient toute l'armature métallique.",
      "Cette charpente enveloppe l'église comme un abri protecteur, presque un refuge — une image qui fait écho au destin de Jeanne d'Arc, guidant la France à travers les tempêtes de l'Histoire.",
    ],
    related: [
      { uid: "voute", label: "la voûte vue de plus près" },
      { uid: "nef-centre", label: "la nef et son autel central" },
      { uid: "vitraux-4-5-6", label: "les verrières de l'atelier Le Prince" },
    ],
  },
  "voute": {
    title: "La voûte, coque de bateau renversée — Sainte-Jeanne-d'Arc Rouen 360°",
    description:
      "La voûte en bois de l'église Sainte-Jeanne-d'Arc de Rouen en 360° : une coque de bateau renversée, symbole voulu par l'architecte Louis Arretche.",
    body: [
      "L'architecture de cette église est profondément symbolique : la charpente en bois évoque immédiatement la coque d'un bateau, inspirée des techniques de construction navale. Vue de l'extérieur, la forme laisse place à l'imaginaire — Louis Arretche n'a jamais expliqué la forme voulue : certains y voient le heaume d'un chevalier, d'autres des flammes rappelant le bûcher, des vagues, un dragon ou des écailles, tant la toiture d'ardoise taillée en écailles semble vivante.",
    ],
    related: [
      { uid: "nef-voute", label: "la charpente vue de la nef" },
      { uid: "chapelle-saint-sacrement", label: "la chapelle du Saint-Sacrement" },
      { uid: "vitraux-12-13", label: "les dernières verrières du cycle" },
    ],
  },
  "chapelle-de-la-vierge": {
    title: "La chapelle de la Vierge — Église Sainte-Jeanne-d'Arc de Rouen 360°",
    description:
      "La chapelle de la Vierge de l'église Sainte-Jeanne-d'Arc de Rouen en visite virtuelle 360° : un espace de recueillement dans l'édifice de Louis Arretche.",
    body: [
      "La chapelle de la Vierge est l'un des espaces de recueillement de l'église Sainte-Jeanne-d'Arc. Comme tout l'intérieur voulu par Louis Arretche, elle cultive une atmosphère volontairement simple et lumineuse, pensée pour mettre en valeur les vitraux Renaissance et le recueillement.",
    ],
    related: [
      { uid: "chapelle-saint-sacrement", label: "la chapelle du Saint-Sacrement" },
      { uid: "fonts-baptismaux", label: "la chapelle des fonts baptismaux" },
      { uid: "nef-centre", label: "la nef" },
    ],
  },
  "chapelle-saint-sacrement": {
    title: "Chapelle du Saint-Sacrement et boiseries Renaissance — Rouen 360°",
    description:
      "La chapelle du Saint-Sacrement en 360° : boiseries Renaissance de l'ancienne église Saint-Vincent et silex évoquant la pierre de Caumont normande.",
    body: [
      "La chapelle du Saint-Sacrement abrite de remarquables boiseries Renaissance du XVIe siècle, finement sculptées, provenant de la chapelle Sainte-Anne de l'ancienne église Saint-Vincent, détruite par les bombardements de 1944. Leur présence perpétue la mémoire de l'édifice disparu.",
      "Dans les murs, de petites taches noires incrustées dans le ciment ne sont pas des défauts : ce sont des silex, intégrés volontairement en hommage à la pierre de Caumont, cette « craie blanche à silex » typique de Normandie, extraite depuis l'Antiquité et présente dans la plupart des églises anciennes de la région.",
    ],
    related: [
      { uid: "chapelle-de-la-vierge", label: "la chapelle de la Vierge" },
      { uid: "vitraux-1-2-3", label: "les vitraux venus de Saint-Vincent" },
      { uid: "voute", label: "la voûte en bois" },
    ],
  },
  "fonts-baptismaux": {
    title: "La chapelle des fonts baptismaux — Sainte-Jeanne-d'Arc Rouen 360°",
    description:
      "La chapelle des fonts baptismaux en 360° : une ambiance de grotte, des parois striées et un faisceau de lumière naturelle tombé d'une ouverture de la voûte.",
    body: [
      "Légèrement en retrait du reste de l'église, la chapelle des fonts baptismaux contraste avec la nef : une ambiance intime, presque secrète, comme une grotte. Les parois striées donnent une texture organique, minérale, comme si l'espace avait été creusé dans la roche — un retour à l'essentiel : l'eau, la terre, les origines. Une ouverture circulaire dans la voûte laisse passer un faisceau de lumière naturelle.",
      "Petit rappel étymologique : « font » vient de « fontaine », en lien avec l'eau — et non de « fond ».",
    ],
    related: [
      { uid: "chapelle-de-la-vierge", label: "la chapelle de la Vierge" },
      { uid: "nef-centre", label: "la nef" },
      { uid: "statue-jeanne-darc", label: "la statue de Jeanne d'Arc" },
    ],
  },
  "vitraux-1-2-3": {
    title: "Vitraux 1 à 3 : saint Pierre, sainte Anne, vitrail des Chars — Rouen 360°",
    description:
      "Trois verrières Renaissance en 360° : Vie de saint Pierre (don des Boyvin), Sainte Anne signée Jean Le Vieil, et le vitrail des Chars des frères Le Prince.",
    body: [
      "Cette scène réunit trois des treize verrières Renaissance (1520-1530) sauvées du chœur de l'église Saint-Vincent. La Vie de saint Pierre (don de la famille Boyvin, atelier rouennais vers 1530) déroule la vocation des apôtres, la pêche miraculeuse, l'affrontement avec Simon le Magicien et la remise des clés.",
      "La verrière de Sainte Anne est signée Jean Le Vieil — signature discrète sur un manteau et une coiffe — pour la confrérie de Compostelle : Apparition de l'ange à Joachim, Rencontre à la Porte dorée, Naissance de la Vierge, Présentation au Temple.",
      "Le Triomphe de la Vierge, dit vitrail des Chars (Jean et Engrand Le Prince), est un chef-d'œuvre de la Renaissance verrière en Normandie : chars tirés par vertus ou vices, triomphe d'Adam et Ève au paradis, chute avec le char de Satan, triomphe de la Vierge soutenue par David et Isaïe.",
    ],
    related: [
      { uid: "vitraux-4-5-6", label: "les vitraux suivants (4 à 6)" },
      { uid: "vitraux-12-13", label: "le martyre de saint Vincent" },
      { uid: "nef-centre", label: "la nef" },
    ],
  },
  "vitraux-4-5-6": {
    title: "Vitraux 4 à 6 : arbre de sainte Anne, saint Jean-Baptiste, Miséricorde",
    description:
      "Trois verrières Renaissance en 360° : l'Arbre de sainte Anne, la Vie de saint Jean-Baptiste d'Engrand Le Prince et les Œuvres de Miséricorde.",
    body: [
      "L'Arbre de sainte Anne déploie une généalogie inspirée de la Légende dorée de Jacques de Voragine : sainte Anne instruit la Vierge, entourée de Marie Cléophas et Marie Salomé ; au registre supérieur, la Vierge à l'Enfant est entourée de ses neveux, dont cinq deviendront apôtres.",
      "La Vie de saint Jean-Baptiste, chef-d'œuvre d'Engrand Le Prince, enchaîne l'Annonce à Zacharie, la Visitation, la prédication, le baptême du Christ et la décollation — un modèle régional copié dès 1535 par Mausse Heurtault à Pont-Audemer.",
      "Les Œuvres de Miséricorde (Jean et Engrand Le Prince) forment une allégorie de la charité et de l'ingratitude : le Mauvais riche rejetant Lazare, la Charité secourant les démunis, l'Aumône éteignant le feu du Péché, le Christ nourrissant ceux qui viennent à lui.",
    ],
    related: [
      { uid: "vitraux-7-8", label: "saint Antoine de Padoue et divers saints" },
      { uid: "vitraux-1-2-3", label: "le vitrail des Chars" },
      { uid: "nef-voute", label: "la charpente en bois" },
    ],
  },
  "vitraux-7-8": {
    title: "Vitraux 7 et 8 : saint Antoine de Padoue et divers saints — Rouen 360°",
    description:
      "Deux verrières Renaissance en 360° : saint Antoine de Padoue, unique verrière en grisaille et sanguine du cycle, et la verrière des divers saints.",
    body: [
      "La verrière de saint Antoine de Padoue est l'unique verrière en grisaille et sanguine du cycle : miracle de la mule agenouillée devant l'hostie, funérailles de l'usurier au cœur retrouvé dans sa cassette d'or, miracle du pied coupé rattaché, mort du saint.",
      "La verrière des divers saints réunit sainte Anne instruisant la Vierge, saint Jean-Baptiste, un saint archevêque (sans doute saint Claude), saint Nicolas, saint Vincent et saint Jacques le Majeur sous un arc triomphal Renaissance.",
    ],
    related: [
      { uid: "vitraux-9-10-11", label: "l'Enfance du Christ, la Passion et la Crucifixion" },
      { uid: "vitraux-4-5-6", label: "les Œuvres de Miséricorde" },
      { uid: "chapelle-saint-sacrement", label: "les boiseries Renaissance" },
    ],
  },
  "vitraux-9-10-11": {
    title: "Vitraux 9 à 11 : Enfance du Christ, Passion, Crucifixion — Rouen 360°",
    description:
      "Trois verrières Renaissance en 360° : l'Enfance du Christ (don des Le Roux de Bourgtheroulde), la Passion aux influences de Dürer et la Crucifixion.",
    body: [
      "L'Enfance et la Vie publique du Christ (don des Le Roux de Bourgtheroulde) déroule l'Annonciation, la Nativité, l'Adoration des Mages, la Fuite en Égypte, Jésus parmi les Docteurs et la Multiplication des pains — avec des détails réalistes charmants : un chien, une cage à tourterelles.",
      "La Passion du Christ (vers 1520-1530, influences de Dürer) va de l'Entrée à Jérusalem au Portement de croix : le Christ en violet contraste avec les habits élaborés des soldats.",
      "La Crucifixion, ancienne verrière axiale de Saint-Vincent, touche par la douceur du visage de la Vierge et son célèbre soldat chamarré au visage bleu pâle, peint sur la même pièce de verre que son casque, accompagné d'un chien.",
    ],
    related: [
      { uid: "vitraux-12-13", label: "la Vie glorieuse du Christ et saint Vincent" },
      { uid: "vitraux-7-8", label: "saint Antoine de Padoue" },
      { uid: "nef-vue-sud", label: "la nef côté sud" },
    ],
  },
  "vitraux-12-13": {
    title: "Vitraux 12 et 13 : Vie glorieuse du Christ, martyre de saint Vincent",
    description:
      "Les deux dernières verrières Renaissance en 360° : la Vie glorieuse du Christ en grisaille et le Martyre de saint Vincent, don des Le Roux de l'Esprevier.",
    body: [
      "La Vie glorieuse du Christ adopte une tonalité austère en grisaille, avec une représentation saisissante du donateur mort rongé par les vers — vanité du monde — puis la Descente de croix, la Résurrection, le repas d'Emmaüs et l'Incrédulité de Thomas.",
      "Le Martyre de saint Vincent (don des Le Roux de l'Esprevier) joue d'un contraste dramatique entre le bleu-blanc du tympan et les tons brun-orangé : mort sous la vis d'un pressoir, corps jeté à la mer, exposition aux bêtes. Son maître verrier fut surnommé par Jean Lafond « le maître du martyre de saint Vincent ».",
    ],
    related: [
      { uid: "vitraux-1-2-3", label: "le début du cycle des vitraux" },
      { uid: "vitraux-9-10-11", label: "la Passion et la Crucifixion" },
      { uid: "voute", label: "la voûte en bois" },
    ],
  },
  "statue-jeanne-darc": {
    title: "La statue de Jeanne d'Arc par Michel Coste (1999) — Rouen 360°",
    description:
      "La statue de Jeanne d'Arc de Michel Coste (1999) en 360° : une Jeanne transfigurée, figure de paix en apothéose, loin de l'image guerrière traditionnelle.",
    body: [
      "La statue visible dans l'église a été réalisée en 1999 par l'artiste Michel Coste. Elle représente une Jeanne d'Arc transfigurée : pas d'armure, pas de scène de bataille ni de bûcher, mais une vision intime et spirituelle — une Jeanne dans son apothéose, figure de paix baignée de lumière, presque angélique.",
      "L'église se dresse à l'emplacement exact du martyre de Jeanne d'Arc (1431) : dehors, la grande croix du monument national marque le lieu du bûcher, près de l'ancien pilori retrouvé lors du chantier, et une statue de Maxime Real Del Sarte (1929) se tient près de l'entrée, le regard tourné vers l'endroit du supplice. Les fêtes Jeanne d'Arc s'y tiennent chaque fin mai.",
    ],
    related: [
      { uid: "nef-centre", label: "la nef et la place du Vieux-Marché" },
      { uid: "fonts-baptismaux", label: "la chapelle des fonts baptismaux" },
      { uid: "vitraux-1-2-3", label: "les vitraux Renaissance" },
    ],
  },
};
