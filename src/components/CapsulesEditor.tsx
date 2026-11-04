"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Krpano } from "@/components/PointCapsules";
import { texteVide } from "@/lib/capsules/model";
import { avecPrealign, BORNES, formatPrealign, lirePrealign, memePrealign, ZERO, type Prealign } from "@/lib/capsules/prealign";
import type { NomScene } from "@/lib/capsules/scenes";
import type { CapsuleAudio, FicheCapsule, Langue } from "@/lib/capsules/types";

const ACCENT = "#8b1c1c";
const LARGEUR = 380;

type Medias = { audios: CapsuleAudio[]; videos: { url: string; titre: string }[] };
type Supprimee = { id: string; idEn: string | null };
/** Le KRpano de l'iframe expose aussi `set` (contenu des scènes en mémoire). */
type KrpanoSet = Krpano & { set?: (k: string, v: unknown) => void };
type Resultat = { texte: string; erreur: boolean };
const AXES: { cle: keyof Prealign; label: string }[] = [
  { cle: "tilt", label: "Inclinaison (tilt)" },
  { cle: "pan", label: "Axe (pan)" },
  { cle: "roll", label: "Roulis (roll)" },
];

const CSS = `
.cped .apercu{margin-top:8px;display:flex;flex-direction:column;gap:8px}
.cped .apercu-texte{max-height:180px;overflow:auto;background:#f7f4f0;border-radius:8px;padding:8px 10px;font-size:13px;line-height:1.55}
.cped .apercu-texte p{margin:0 0 6px}
.cped .apercu audio{width:100%}
.cped .apercu iframe{width:100%;height:220px;border:0;border-radius:8px;background:#111}
.cped{position:fixed;right:0;top:0;bottom:0;width:${LARGEUR}px;z-index:1000;background:#fff;color:#1a2332;font:14px/1.45 Inter,system-ui,sans-serif;display:flex;flex-direction:column;box-shadow:-4px 0 24px rgba(0,0,0,.25)}
.cped header{padding:14px 16px;border-bottom:1px solid #eee}
.cped h2{margin:0;font-size:16px}
.cped small{color:#6b7380}
.cped .corps{flex:1;overflow:auto;padding:12px 16px}
.cped .liste button{display:block;width:100%;text-align:left;border:1px solid #eee;background:#fafafa;border-radius:10px;padding:8px 10px;margin:0 0 6px;cursor:pointer;font:inherit}
.cped .liste button.sel{border-color:${ACCENT};background:#fbf3f3}
.cped label{display:block;font-size:12px;font-weight:600;color:#6b7380;margin:10px 0 4px}
.cped input[type=text],.cped textarea,.cped select{width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:8px;padding:7px 9px;font:inherit}
.cped textarea{min-height:120px;resize:vertical}
.cped .onglets{display:flex;gap:6px;margin:10px 0 0}
.cped .onglets button,.cped .act{border:0;border-radius:99px;padding:7px 12px;font:600 13px Inter,system-ui,sans-serif;cursor:pointer;background:#F1ECE7;color:${ACCENT}}
.cped .onglets button.on,.cped .act.plein{background:${ACCENT};color:#fff}
.cped footer{padding:12px 16px;border-top:1px solid #eee;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.cped .msg{font-size:12px;width:100%}
.cped .msg.err{color:#b00020}
.cped .vide{color:#b00020;font-size:13px}
.cped button:disabled{opacity:.5;cursor:not-allowed}
.cped .bloc{border:1px solid #eee;border-radius:10px;padding:4px 12px 12px;margin:0 0 14px}
.cped .bloc>summary{cursor:pointer;font-weight:600;padding:8px 0 0}
.cped .curseur{display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:#6b7380;margin:10px 0 2px}
.cped input[type=range]{width:100%;accent-color:${ACCENT}}
.cped .note{display:block;margin-top:6px}
.cpm{position:fixed;left:0;top:0;width:0;height:0;z-index:999;display:none}
.cpm button{position:absolute;left:-20px;top:-20px;width:40px;height:40px;border-radius:50%;border:0;background:${ACCENT};color:#fff;font:700 22px/40px Inter,sans-serif;cursor:grab;box-shadow:0 4px 14px rgba(0,0,0,.3),0 0 0 3px rgba(255,255,255,.6);touch-action:none}
.cpm.sel button{box-shadow:0 0 0 4px #fff,0 0 0 7px ${ACCENT}}
.cpm span{position:absolute;left:26px;top:-12px;white-space:nowrap;background:#fff;color:#1a2332;font:600 12px Inter,sans-serif;padding:3px 8px;border-radius:99px;pointer-events:none}
`;

const nouvelleCle = () => `nouvelle-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

/** Outil local des capsules : panneau à droite, « + » déplaçables dans le panorama, Enregistrer = en ligne. */
/** Lien de lecture d'une vidéo pour l'aperçu (JUUMO Vidéos ou Vimeo), sans lecture automatique. */
function lienApercu(url: string): string {
  const juumo = url.match(/video\.juumo\.fr\/(?:v|embed)\/([A-Za-z0-9_-]{8,})/);
  if (juumo) return `https://video.juumo.fr/embed/${juumo[1]}?title=0`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

/** Aperçu de ce que le + ouvre : texte à lire, audio à écouter, vidéo à voir. */
function Apercu({ texte, audio, video }: { texte?: string; audio?: string; video?: string }) {
  if (!texte && !audio && !video) return <small>Aucun contenu.</small>;
  return (
    <div className="apercu">
      {texte && <div className="apercu-texte">{texte.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>}
      {audio && <audio controls preload="none" src={audio} />}
      {video && <iframe src={lienApercu(video)} title="Aperçu de la vidéo" allow="fullscreen; picture-in-picture" allowFullScreen />}
    </div>
  );
}

export function CapsulesEditor({ getKrpano, scene, titreScene, contenuDeLaScene, vitrauxParScene, placement }: {
  getKrpano: () => Krpano | null | undefined;
  scene: string;
  titreScene: string;
  /** Ce que Lire / Écouter / Vidéo ouvrent pour un + « contenu de la scène », par langue */
  contenuDeLaScene: Record<Langue, { texte: string; audio: string; video: string }>;
  /** Scènes de vitraux : un élément par vitrail (FR + EN), pour créer un + chacun */
  vitrauxParScene: Record<string, Record<Langue, { titre: string; texte: string; audio: string }>[]>;
  /** Placement seul : les + des vitraux sont préparés d'office, l'outil ne sert qu'à les glisser puis enregistrer */
  placement: boolean;
}) {
  const [fiches, setFiches] = useState<FicheCapsule[] | null>(null);
  const [charge, setCharge] = useState(false);
  const [erreurLecture, setErreurLecture] = useState<string | null>(null);
  const [supprimees, setSupprimees] = useState<Supprimee[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [langue, setLangue] = useState<Langue>("fr");
  const [medias, setMedias] = useState<Medias>({ audios: [], videos: [] });
  const [mediasPrets, setMediasPrets] = useState(false);
  const prepares = useRef(false);
  const [modifie, setModifie] = useState(false);
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null);
  const [enCours, setEnCours] = useState(false);
  const marqueurs = useRef(new Map<string, HTMLDivElement>());
  const glisse = useRef<string | null>(null);
  // Clés des fiches modifiées depuis la dernière lecture / sauvegarde : seules celles-là sont envoyées
  const modifiees = useRef(new Set<string>());

  // Noms des scènes : valeur stockée dans les docs Prismic `scene` (champ `title`), FR + EN.
  // `nomsEdits` ne contient que les noms qui diffèrent de la valeur stockée.
  const [noms, setNoms] = useState<NomScene[] | null>(null);
  const [erreurNoms, setErreurNoms] = useState<string | null>(null);
  const [nomsEdits, setNomsEdits] = useState<Record<string, Partial<Record<Langue, string>>>>({});
  // Redressage : prealign écrit dans tour.xml (disque) et réglages en cours par scène,
  // gardés quand on change de scène tant qu'ils ne sont pas enregistrés.
  const [prealignDisque, setPrealignDisque] = useState<Record<string, string> | null>(null);
  const [prealignEdits, setPrealignEdits] = useState<Record<string, Prealign>>({});
  const prealignEditsRef = useRef(prealignEdits);
  prealignEditsRef.current = prealignEdits;
  const prealignAttente = useRef<{ sc: string; p: Prealign } | null>(null);
  const prealignMinuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chargerScenes = useCallback(async () => {
    setNomsEdits({});
    try {
      const r = await fetch("/api/capsules/scenes", { cache: "no-store" });
      const j = (await r.json()) as { scenes?: NomScene[]; erreur?: string };
      if (!r.ok || !Array.isArray(j.scenes)) throw new Error(j.erreur ?? `HTTP ${r.status}`);
      setNoms(j.scenes);
      setErreurNoms(null);
    } catch (e) {
      setNoms(null);
      setErreurNoms(`Lecture des noms impossible : ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);
  const chargerPrealign = useCallback(async () => {
    try {
      const r = await fetch("/api/capsules/prealign", { cache: "no-store" });
      const j = (await r.json()) as { prealign?: Record<string, string>; erreur?: string };
      if (!r.ok || !j.prealign) throw new Error(j.erreur ?? `HTTP ${r.status}`);
      setPrealignDisque(j.prealign);
    } catch (e) {
      setPrealignDisque(null);
      setMessage({ texte: `Lecture du tour.xml impossible : ${e instanceof Error ? e.message : String(e)}`, erreur: true });
    }
  }, []);
  useEffect(() => { chargerScenes(); chargerPrealign(); }, [chargerScenes, chargerPrealign]);

  const prealignEnregistre = useCallback((sc: string): Prealign => lirePrealign(prealignDisque?.[sc]) ?? ZERO, [prealignDisque]);

  /**
   * Applique un prealign à une scène : dans son contenu en mémoire (tout chargement suivant,
   * par la navigation ou le menu, la relit redressée) et, si c'est la scène affichée,
   * en direct par loadscene (prealign passé dans les vars, sinon le rechargement relit le XML).
   */
  const appliquerPrealign = useCallback((sc: string, p: Prealign) => {
    const k = getKrpano() as KrpanoSet | null | undefined;
    if (!k?.get) return;
    const contenu = k.get(`scene[${sc}].content`);
    if (typeof contenu === "string" && k.set) {
      try { k.set(`scene[${sc}].content`, avecPrealign(contenu, p)); } catch { /* scène sans <image> : on laisse */ }
    }
    if (String(k.get("xml.scene") ?? "") !== sc) return;
    k.call(`loadscene(${sc}, image.prealign=${formatPrealign(p)}, MERGE|KEEPVIEW, BLEND(0.3));`);
    // Le rechargement retire les tags ajoutés par le pont juumo-edit : on les lui fait reposer
    const fenetre = (k as unknown as HTMLElement).ownerDocument?.defaultView as (Window & { juumoBridgeNewScene?: () => void }) | null | undefined;
    setTimeout(() => { try { fenetre?.juumoBridgeNewScene?.(); } catch { /* pont absent */ } }, 400);
  }, [getKrpano]);

  // Curseurs : rechargements limités à un toutes les 150 ms, la dernière valeur gagne
  const reglerPrealign = (p: Prealign) => {
    const sc = scene;
    setPrealignEdits((e) => {
      const n = { ...e };
      if (memePrealign(p, prealignEnregistre(sc))) delete n[sc]; else n[sc] = p;
      return n;
    });
    prealignAttente.current = { sc, p };
    if (prealignMinuteur.current) return;
    prealignMinuteur.current = setTimeout(() => {
      prealignMinuteur.current = null;
      const a = prealignAttente.current;
      if (a) appliquerPrealign(a.sc, a.p);
    }, 150);
  };

  // Retour sur une scène réglée mais pas enregistrée : on vérifie que le réglage est bien là
  useEffect(() => {
    const p = prealignEditsRef.current[scene];
    if (!p) return;
    const t = setTimeout(() => {
      const k = getKrpano();
      if (!k?.get || String(k.get("xml.scene") ?? "") !== scene) return;
      const actuel = lirePrealign(String(k.get("image.prealign") ?? "")) ?? ZERO;
      if (!memePrealign(actuel, p)) appliquerPrealign(scene, p);
    }, 700);
    return () => clearTimeout(t);
  }, [scene, getKrpano, appliquerPrealign]);

  const nomScene = (noms ?? []).find((n) => n.krpano === scene) ?? null;
  const majNom = (l: Langue, v: string) => {
    if (!nomScene?.[l]) return;
    const stocke = nomScene[l]?.titre ?? "";
    setNomsEdits((e) => {
      const cur = { ...(e[scene] ?? {}) };
      if (v === stocke) delete cur[l]; else cur[l] = v;
      const n = { ...e };
      if (Object.keys(cur).length) n[scene] = cur; else delete n[scene];
      return n;
    });
  };
  const nomsModifies = Object.keys(nomsEdits).length > 0;
  const prealignModifie = Object.keys(prealignEdits).length > 0;
  const toutModifie = modifie || nomsModifies || prealignModifie;
  const reglage = prealignEdits[scene] ?? prealignEnregistre(scene);

  const charger = useCallback(async () => {
    try {
      const r = await fetch("/api/capsules", { cache: "no-store" });
      const j = (await r.json()) as { fiches?: FicheCapsule[]; jeton?: boolean; erreur?: string };
      // Lecture Prismic en échec : ne rien afficher plutôt qu'une liste vide qui créerait des doublons à l'enregistrement
      if (!r.ok || !Array.isArray(j.fiches)) throw new Error(j.erreur ?? `HTTP ${r.status}`);
      setFiches(j.fiches);
      setSupprimees([]);
      modifiees.current.clear();
      setModifie(false);
      setSel(null);
      setErreurLecture(null);
      setCharge(true);
      setMessage(j.jeton ? null : { texte: "Jeton d'écriture absent : rien ne pourra être enregistré.", erreur: true });
    } catch (e) {
      setCharge(false);
      setErreurLecture(`Lecture des capsules impossible : ${e instanceof Error ? e.message : String(e)}. Recharger la page.`);
    }
  }, []);

  useEffect(() => {
    charger();
    fetch("/api/capsules/medias", { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((m: Medias) => { setMedias(m); setMediasPrets(true); })
      .catch((e) => setMessage({ texte: `Médias indisponibles : ${e instanceof Error ? e.message : String(e)}`, erreur: true }));
  }, [charger]);

  // La visite se décale comme avec juumo-edit
  useEffect(() => {
    document.documentElement.style.setProperty("--juumo-edit-width", `${LARGEUR}px`);
    return () => { document.documentElement.style.removeProperty("--juumo-edit-width"); };
  }, []);

  useEffect(() => { setSel(null); }, [scene]);

  // Changement non enregistré : confirmation avant de quitter la page
  useEffect(() => {
    if (!toutModifie) return;
    const avant = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", avant);
    return () => window.removeEventListener("beforeunload", avant);
  }, [toutModifie]);

  const changer = (cle: string, maj: (f: FicheCapsule) => FicheCapsule) => {
    modifiees.current.add(cle);
    setFiches((fs) => (fs ?? []).map((f) => (f.cle === cle ? maj(f) : f)));
    setModifie(true);
  };

  const ficheSel = (fiches ?? []).find((f) => f.cle === sel) ?? null;
  const ficheScene = useMemo(() => (fiches ?? []).filter((f) => f.scene === scene).sort((a, b) => a.ordre - b.ordre), [fiches, scene]);

  const ajouter = () => {
    if (!charge) return;
    const k = getKrpano();
    const ath = Number(k?.get("view.hlookat")) || 0;
    const atv = Number(k?.get("view.vlookat")) || 0;
    const f: FicheCapsule = {
      cle: nouvelleCle(), id: null, idEn: null, scene, ath, atv,
      ordre: ficheScene.length ? Math.max(...ficheScene.map((x) => x.ordre)) + 1 : 0,
      contenuScene: false, fr: texteVide(), en: texteVide(),
    };
    modifiees.current.add(f.cle);
    setFiches((fs) => [...(fs ?? []), f]);
    setSel(f.cle);
    setModifie(true);
  };

  // Un + par vitrail, prérempli (titre, texte, audio FR + EN), posé devant la vue : à glisser sur chaque vitrail avant d'enregistrer
  const vitraux = vitrauxParScene[scene] ?? [];
  /** + préremplis d'une scène de vitraux, en arc autour d'un point (à glisser ensuite sur chaque vitrail) */
  const preparerVitraux = (sc: string, centre: { ath: number; atv: number }, existantes: FicheCapsule[]): FicheCapsule[] => {
    const liste = vitrauxParScene[sc] ?? [];
    const audio = (url: string) => (url ? medias.audios.find((a) => a.url.split("?")[0] === url.split("?")[0]) ?? null : null);
    const depart = existantes.length ? Math.max(...existantes.map((x) => x.ordre)) + 1 : 1;
    return liste.map((v, i) => ({
      cle: nouvelleCle(), id: null, idEn: null, scene: sc,
      ath: centre.ath + (i - (liste.length - 1) / 2) * 15, atv: centre.atv - 8,
      ordre: depart + i, contenuScene: false,
      fr: { titre: v.fr.titre, texte: v.fr.texte, audio: audio(v.fr.audio), video: "" },
      en: { titre: v.en.titre, texte: v.en.texte, audio: audio(v.en.audio), video: "" },
    }));
  };
  const ajouterPreparees = (nouvelles: FicheCapsule[], texte: string) => {
    nouvelles.forEach((f) => modifiees.current.add(f.cle));
    setFiches((fs) => [...(fs ?? []), ...nouvelles]);
    setModifie(true);
    setMessage({ texte, erreur: false });
  };
  const creerVitraux = () => {
    if (!charge) return;
    const k = getKrpano();
    const nouvelles = preparerVitraux(scene, { ath: Number(k?.get("view.hlookat")) || 0, atv: Number(k?.get("view.vlookat")) || 0 }, ficheScene);
    ajouterPreparees(nouvelles, `${nouvelles.length} + créés devant la vue : glisse chacun sur son vitrail, puis Enregistrer.`);
    setSel(nouvelles[0]?.cle ?? null);
  };
  // Placement seul : dès la lecture faite, un + par vitrail est préparé pour chaque scène de vitraux qui n'en a pas
  useEffect(() => {
    if (!placement || !charge || !mediasPrets || !fiches || prepares.current) return;
    prepares.current = true;
    const nouvelles = Object.keys(vitrauxParScene).flatMap((sc) => {
      const deLaScene = fiches.filter((f) => f.scene === sc);
      if (deLaScene.some((f) => !f.contenuScene)) return [];
      const centre = deLaScene.find((f) => f.contenuScene) ?? { ath: 0, atv: 0 };
      return preparerVitraux(sc, { ath: centre.ath, atv: centre.atv }, deLaScene);
    });
    if (nouvelles.length) {
      ajouterPreparees(nouvelles, `${nouvelles.length} + de vitraux préparés sur ${new Set(nouvelles.map((f) => f.scene)).size} scènes : glisse chacun sur son vitrail, puis Enregistrer.`);
    }
  }, [placement, charge, mediasPrets, fiches, vitrauxParScene]); // eslint-disable-line react-hooks/exhaustive-deps

  const supprimer = (f: FicheCapsule) => {
    if (!window.confirm(`Supprimer le + « ${f.fr.titre || titreScene} » ? Le + sera retiré de la visite (la fiche reste archivable dans Prismic).`)) return;
    if (f.id) setSupprimees((s) => [...s, { id: f.id as string, idEn: f.idEn }]);
    modifiees.current.delete(f.cle);
    setFiches((fs) => (fs ?? []).filter((x) => x.cle !== f.cle));
    setSel(null);
    setModifie(true);
  };

  /** Capsules modifiées : création / mise à jour / retrait dans Prismic, puis publication. */
  const enregistrerCapsules = async (): Promise<Resultat> => {
    if (!fiches) return { texte: "Capsules non chargées : rien d'enregistré.", erreur: true };
    try {
      const r = await fetch("/api/capsules", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fiches: fiches.filter((f) => modifiees.current.has(f.cle)), supprimees }),
      });
      let j: { erreurs?: { cle: string; message: string }[]; erreur?: string; publie?: boolean; fiches?: FicheCapsule[] | null };
      try { j = await r.json(); } catch { throw new Error(`réponse illisible (HTTP ${r.status})`); }
      const erreurs = j.erreurs ?? [];
      // Les fiches renvoyées portent les identifiants créés : les reprendre même en cas d'échec partiel
      // (elles ne contiennent que les fiches envoyées : fusion par clé dans la liste complète)
      if (Array.isArray(j.fiches)) {
        const recues = new Map(j.fiches.map((f) => [f.cle, f] as const));
        setFiches((fs) => (fs ?? []).map((f) => recues.get(f.cle) ?? f));
      }
      if (!r.ok || j.erreur || erreurs.length) {
        const detail = [j.erreur, ...erreurs.map((e) => `${e.cle} : ${e.message}`)].filter(Boolean).join(" · ");
        if (!Array.isArray(j.fiches)) { setCharge(false); setErreurLecture("Enregistrement incertain : recharger la page avant de continuer."); }
        return { texte: `Capsules : ${detail || `enregistrement refusé (HTTP ${r.status})`}`, erreur: true };
      }
      if (!Array.isArray(j.fiches)) {
        // Enregistré sans nouvelle liste : re-sauver dupliquerait les nouvelles fiches
        setCharge(false);
        setErreurLecture("Enregistrement incertain : recharger la page avant de continuer.");
        return { texte: "Capsules : enregistrement incertain, recharger la page avant de continuer.", erreur: true };
      }
      setSupprimees([]);
      modifiees.current.clear();
      setModifie(false);
      setSel(null);
      return j.publie
        ? { texte: "Capsules enregistrées et publiées : en ligne d'ici une minute.", erreur: false }
        : { texte: "Capsules enregistrées mais pas publiées : publier la release dans Prismic.", erreur: true };
    } catch (e) {
      return { texte: `Capsules : enregistrement impossible (${e instanceof Error ? e.message : String(e)})`, erreur: true };
    }
  };

  /** Noms de scènes changés : seul le champ `title` des docs `scene` FR / EN est réécrit, puis publication. */
  const enregistrerNoms = async (): Promise<Resultat> => {
    const envoi = Object.entries(nomsEdits).map(([krpano, e]) => ({ krpano, ...e }));
    try {
      const r = await fetch("/api/capsules/scenes", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenes: envoi }),
      });
      let j: { erreurs?: { cle: string; message: string }[]; publie?: boolean; scenes?: NomScene[] | null };
      try { j = await r.json(); } catch { throw new Error(`réponse illisible (HTTP ${r.status})`); }
      if (Array.isArray(j.scenes)) {
        const recues = j.scenes;
        setNoms(recues);
        // Ne garder en attente que les noms encore différents de la valeur stockée (échecs)
        setNomsEdits((e) => {
          const n: typeof e = {};
          for (const [k, v] of Object.entries(e)) {
            const s = recues.find((x) => x.krpano === k);
            const reste = Object.fromEntries(Object.entries(v).filter(([l, t]) => s?.[l as Langue]?.titre !== t));
            if (Object.keys(reste).length) n[k] = reste;
          }
          return n;
        });
      }
      const erreurs = j.erreurs ?? [];
      if (!r.ok || erreurs.length || !j.publie) {
        const detail = erreurs.map((e) => `${e.cle} : ${e.message}`).join(" · ");
        return { texte: `Noms : ${detail || `enregistrement refusé (HTTP ${r.status})`}`, erreur: true };
      }
      return { texte: "Noms enregistrés et publiés : en ligne d'ici une minute.", erreur: false };
    } catch (e) {
      return { texte: `Noms : enregistrement impossible (${e instanceof Error ? e.message : String(e)})`, erreur: true };
    }
  };

  /** Redressages : attribut prealign des scènes réglées écrit dans public/vtour/tour.xml (à committer). */
  const enregistrerPrealign = async (): Promise<Resultat> => {
    const envoi = prealignEdits;
    try {
      const r = await fetch("/api/capsules/prealign", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prealign: envoi }),
      });
      let j: { prealign?: Record<string, string>; erreur?: string };
      try { j = await r.json(); } catch { throw new Error(`réponse illisible (HTTP ${r.status})`); }
      if (!r.ok || !j.prealign) return { texte: `Redressage : ${j.erreur ?? `refusé (HTTP ${r.status})`}`, erreur: true };
      setPrealignDisque(j.prealign);
      setPrealignEdits({});
      return { texte: `Redressage écrit dans tour.xml (${Object.keys(envoi).length} scène${Object.keys(envoi).length > 1 ? "s" : ""}) : à committer pour la mise en ligne.`, erreur: false };
    } catch (e) {
      return { texte: `Redressage : enregistrement impossible (${e instanceof Error ? e.message : String(e)})`, erreur: true };
    }
  };

  /** Un seul Enregistrer : capsules, noms et redressages modifiés, chacun seulement s'il a changé. */
  const enregistrerTout = async () => {
    if (enCours || !toutModifie) return;
    if (Object.values(nomsEdits).some((e) => Object.values(e).some((t) => !t?.trim()))) {
      setMessage({ texte: "Un nom de scène est vide : le remplir avant d'enregistrer.", erreur: true });
      return;
    }
    setEnCours(true);
    setMessage({ texte: "Enregistrement et publication…", erreur: false });
    const resultats: Resultat[] = [];
    try {
      if (modifie && charge) resultats.push(await enregistrerCapsules());
      if (nomsModifies) resultats.push(await enregistrerNoms());
      if (prealignModifie) resultats.push(await enregistrerPrealign());
    } finally {
      setEnCours(false);
      setMessage(resultats.length ? { texte: resultats.map((r) => r.texte).join(" "), erreur: resultats.some((r) => r.erreur) } : null);
    }
  };

  /** Annuler : relecture des capsules et des noms, scènes remises au prealign du tour.xml. */
  const annulerTout = () => {
    if (!window.confirm("Annuler les modifications non enregistrées ?")) return;
    setMessage(null);
    if (modifie) charger();
    if (nomsModifies) chargerScenes();
    for (const sc of Object.keys(prealignEdits)) appliquerPrealign(sc, prealignEnregistre(sc));
    setPrealignEdits({});
  };

  const deposerAudio = async (file: File) => {
    if (!ficheSel || !charge) return;
    setMessage({ texte: "Envoi de l'audio…", erreur: false });
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await fetch("/api/capsules/audio", { method: "POST", body: form });
      let j: (CapsuleAudio & { erreur?: string }) | { erreur?: string };
      try { j = await r.json(); } catch { throw new Error(`réponse illisible (HTTP ${r.status})`); }
      if (!r.ok) { setMessage({ texte: j.erreur ?? "Envoi refusé", erreur: true }); return; }
      setMedias((m) => ({ ...m, audios: [j as CapsuleAudio, ...m.audios] }));
      changer(ficheSel.cle, (f) => ({ ...f, [langue]: { ...f[langue], audio: j as CapsuleAudio } }));
      setMessage({ texte: "Audio envoyé.", erreur: false });
    } catch (e) {
      setMessage({ texte: `Envoi de l'audio impossible : ${e instanceof Error ? e.message : String(e)}`, erreur: true });
    }
  };

  // Position des « + » à chaque image ; glisser = conversion écran → sphère par KRpano
  useEffect(() => {
    let frame = 0;
    const suivre = () => {
      const k = getKrpano();
      if (k?.get) {
        const vue = Number(k.get("view.hlookat")) || 0;
        for (const f of ficheScene) {
          const el = marqueurs.current.get(f.cle);
          if (!el) continue;
          k.call(`spheretoscreen(${f.ath},${f.atv},cped_x,cped_y)`);
          const x = parseFloat(String(k.get("cped_x")));
          const y = parseFloat(String(k.get("cped_y")));
          const devant = Math.abs(((f.ath - vue + 540) % 360 + 360) % 360 - 180);
          const visible = devant < 118 && isFinite(x) && isFinite(y);
          el.style.display = visible ? "block" : "none";
          if (visible) el.style.transform = `translate(${x}px,${y}px)`;
        }
      }
      frame = requestAnimationFrame(suivre);
    };
    frame = requestAnimationFrame(suivre);
    return () => cancelAnimationFrame(frame);
  }, [getKrpano, ficheScene]);

  const deplacer = (e: React.PointerEvent) => {
    const cle = glisse.current;
    const k = getKrpano();
    if (!cle || !k || !charge || enCours) return;
    k.call(`screentosphere(${e.clientX},${e.clientY},cped_ath,cped_atv)`);
    const ath = parseFloat(String(k.get("cped_ath")));
    const atv = parseFloat(String(k.get("cped_atv")));
    if (isFinite(ath) && isFinite(atv)) changer(cle, (f) => ({ ...f, ath, atv }));
  };

  const t = ficheSel ? ficheSel[langue] : null;
  const majTexte = (champ: "titre" | "texte" | "video", v: string) =>
    ficheSel && changer(ficheSel.cle, (f) => ({ ...f, [langue]: { ...f[langue], [champ]: v } }));

  return createPortal(
    <>
      <style>{CSS}</style>
      {ficheScene.map((f) => (
        <div key={f.cle} className={`cpm${f.cle === sel ? " sel" : ""}`} ref={(el) => { if (el) marqueurs.current.set(f.cle, el); else marqueurs.current.delete(f.cle); }}>
          <button
            aria-label={f.fr.titre || titreScene}
            onPointerDown={(e) => { if (enCours) return; e.currentTarget.setPointerCapture(e.pointerId); glisse.current = f.cle; setSel(f.cle); }}
            onPointerMove={deplacer}
            onPointerUp={() => { glisse.current = null; }}
            onPointerCancel={() => { glisse.current = null; }}
            onLostPointerCapture={() => { glisse.current = null; }}
          >+</button>
          <span>{f.contenuScene ? f.fr.titre || titreScene : f.fr.titre || "Sans titre"}</span>
        </div>
      ))}
      <aside className="cped">
        <header>
          <h2>Capsules « + » — {titreScene}</h2>
          <small>{placement ? "Glisse chaque + à sa place, clique-le pour voir et modifier son contenu, change de scène avec la visite, puis Enregistrer une seule fois." : "Glisse un + dans la visite pour le déplacer."} {toutModifie ? "Modifications non enregistrées." : ""}</small>
        </header>
        <div className="corps">
          <details className="bloc" open={!placement}>
            <summary>Nom de la scène</summary>
            {!noms && <div className="vide">{erreurNoms ?? "Chargement des noms…"}</div>}
            {noms && !nomScene && <div className="vide">Cette scène n&apos;a pas de document dans Prismic : rien à renommer ici.</div>}
            {noms && nomScene && (["fr", "en"] as Langue[]).map((l) => (
              <div key={l}>
                <label htmlFor={`cped-nom-${l}`}>{l === "fr" ? "Français" : "Anglais"}</label>
                {nomScene[l] ? (
                  <input id={`cped-nom-${l}`} type="text" disabled={enCours} value={nomsEdits[scene]?.[l] ?? nomScene[l]?.titre ?? ""} onChange={(e) => majNom(l, e.target.value)} />
                ) : (
                  <div className="vide">Pas de document EN pour cette scène dans Prismic : le créer avant de pouvoir la nommer en anglais.</div>
                )}
              </div>
            ))}
            {nomsModifies && <small className="note">Noms modifiés : {Object.keys(nomsEdits).length} scène{Object.keys(nomsEdits).length > 1 ? "s" : ""} (envoyés à l&apos;enregistrement).</small>}
          </details>

          <details className="bloc">
            <summary>Redresser la scène</summary>
            {!prealignDisque && <div className="vide">tour.xml non lu : redressage indisponible.</div>}
            {prealignDisque && (
              <>
                {AXES.map(({ cle, label }) => (
                  <div key={cle}>
                    <div className="curseur"><span>{label}</span><span>{reglage[cle]}°</span></div>
                    <input
                      type="range" aria-label={label} disabled={enCours}
                      min={BORNES[cle][0]} max={BORNES[cle][1]} step={0.5} value={reglage[cle]}
                      onChange={(e) => reglerPrealign({ ...reglage, [cle]: parseFloat(e.target.value) })}
                    />
                  </div>
                ))}
                <button className="act" disabled={enCours} onClick={() => reglerPrealign(ZERO)} style={{ marginTop: 8 }}>Remettre à zéro</button>
                <small className="note">
                  Enregistré : {prealignDisque[scene] ?? "aucun"}{prealignEdits[scene] ? ` · en cours : ${formatPrealign(prealignEdits[scene])}` : ""}.
                  {" "}Axe puis inclinaison pour niveler, roulis pour finir. Écrit dans tour.xml à l&apos;enregistrement (à committer).
                </small>
                {Object.keys(prealignEdits).filter((sc) => sc !== scene).length > 0 && (
                  <small className="note">Réglages non enregistrés aussi sur : {Object.keys(prealignEdits).filter((sc) => sc !== scene).join(", ")}.</small>
                )}
              </>
            )}
          </details>

          <div className="liste">
            {!charge && <div className="vide">{erreurLecture ?? "Chargement des capsules…"}</div>}
            {charge && ficheScene.map((f) => (
              <button key={f.cle} className={f.cle === sel ? "sel" : ""} onClick={() => setSel(f.cle)}>
                {f.contenuScene ? `${f.fr.titre || titreScene} (contenu de la scène)` : f.fr.titre || "Sans titre"}
              </button>
            ))}
            {charge && !ficheScene.length && <small>Aucun + sur cette scène.</small>}
          </div>
          <button className="act" disabled={!charge || enCours} onClick={ajouter} style={{ marginTop: 6 }}>Ajouter un +</button>
          {!placement && vitraux.length > 0 && !ficheScene.some((f) => !f.contenuScene) && (
            <button className="act" disabled={!charge || enCours} onClick={creerVitraux} style={{ marginTop: 6, marginLeft: 6 }}>Créer un + par vitrail ({vitraux.length})</button>
          )}

          {charge && ficheSel && t && (
            <div style={{ marginTop: 16 }}>
              <label>
                <input type="checkbox" disabled={enCours} checked={ficheSel.contenuScene} onChange={(e) => {
                  const coche = e.target.checked;
                  changer(ficheSel.cle, (f) => {
                    if (coche) return { ...f, contenuScene: true };
                    // Décoché : le contenu de la scène est recopié dans le +, pour pouvoir le modifier
                    const copie = (l: Langue) => {
                      const c = contenuDeLaScene[l];
                      return {
                        titre: f[l].titre || (l === "fr" ? titreScene : ""),
                        texte: f[l].texte || c.texte,
                        audio: f[l].audio ?? medias.audios.find((a) => a.url.split("?")[0] === c.audio.split("?")[0]) ?? null,
                        video: f[l].video || c.video,
                      };
                    };
                    return { ...f, contenuScene: false, fr: copie("fr"), en: copie("en") };
                  });
                }} />
                {" "}Contenu de la scène (Lire / Écouter / Vidéo de la scène)
              </label>
              <div className="onglets">
                {(["fr", "en"] as Langue[]).map((l) => (
                  <button key={l} className={l === langue ? "on" : ""} disabled={enCours} onClick={() => setLangue(l)}>{l === "fr" ? "Français" : "Anglais"}</button>
                ))}
              </div>
              <label htmlFor="cped-titre">Titre {ficheSel.contenuScene ? "(vide = nom de la scène)" : ""}</label>
              <input id="cped-titre" type="text" disabled={enCours} value={t.titre} onChange={(e) => majTexte("titre", e.target.value)} />
              {ficheSel.contenuScene && (
                <>
                  <label>Contenu de la scène (modifiable dans l&apos;espace client)</label>
                  <Apercu texte={contenuDeLaScene[langue].texte} audio={contenuDeLaScene[langue].audio} video={contenuDeLaScene[langue].video} />
                  <small>Pour le modifier dans ce + (retirer le son, changer la vidéo…), décocher « Contenu de la scène » : il est alors recopié ici.</small>
                </>
              )}
              {!ficheSel.contenuScene && (
                <>
                  <label htmlFor="cped-texte">Texte (une ligne vide entre deux paragraphes)</label>
                  <textarea id="cped-texte" disabled={enCours} value={t.texte} onChange={(e) => majTexte("texte", e.target.value)} />
                  <label htmlFor="cped-audio">Audio</label>
                  <select
                    id="cped-audio"
                    disabled={enCours}
                    value={t.audio?.id ?? ""}
                    onChange={(e) => changer(ficheSel.cle, (f) => ({ ...f, [langue]: { ...f[langue], audio: medias.audios.find((a) => a.id === e.target.value) ?? null } }))}
                  >
                    <option value="">Aucun</option>
                    {t.audio && !medias.audios.some((a) => a.id === t.audio?.id) && <option value={t.audio.id}>{t.audio.nom}</option>}
                    {medias.audios.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
                  </select>
                  {t.audio && (
                    <>
                      <Apercu audio={t.audio.url} />
                      <button className="act" disabled={enCours} onClick={() => changer(ficheSel.cle, (f) => ({ ...f, [langue]: { ...f[langue], audio: null } }))} style={{ marginTop: 6 }}>Retirer l&apos;audio</button>
                    </>
                  )}
                  <input type="file" aria-label="Déposer un audio" disabled={enCours} accept="audio/*" style={{ marginTop: 6 }} onChange={(e) => { const file = e.target.files?.[0]; if (file) deposerAudio(file); e.target.value = ""; }} />
                  <label htmlFor="cped-video">Vidéo</label>
                  <select id="cped-video" disabled={enCours} value={medias.videos.some((v) => v.url === t.video) ? t.video : ""} onChange={(e) => majTexte("video", e.target.value)}>
                    <option value="">Aucune (ou lien ci-dessous)</option>
                    {medias.videos.map((v) => <option key={v.url} value={v.url}>{v.titre}</option>)}
                  </select>
                  <input type="text" aria-label="Lien vidéo" disabled={enCours} placeholder="https://video.juumo.fr/v/…" value={t.video} onChange={(e) => majTexte("video", e.target.value)} style={{ marginTop: 6 }} />
                  {t.video && (
                    <>
                      <Apercu video={t.video} />
                      <button className="act" disabled={enCours} onClick={() => majTexte("video", "")} style={{ marginTop: 6 }}>Retirer la vidéo</button>
                    </>
                  )}
                </>
              )}
              <button className="act" disabled={enCours} onClick={() => supprimer(ficheSel)} style={{ marginTop: 14 }}>Supprimer ce +</button>
            </div>
          )}
        </div>
        <footer>
          <button className="act plein" disabled={enCours || !toutModifie} onClick={enregistrerTout}>{enCours ? "En cours…" : "Enregistrer"}</button>
          <button className="act" disabled={enCours || !toutModifie} onClick={annulerTout}>Annuler</button>
          {message && <div role="status" aria-live="polite" className={`msg${message.erreur ? " err" : ""}`}>{message.texte}</div>}
        </footer>
      </aside>
    </>,
    document.body,
  );
}
