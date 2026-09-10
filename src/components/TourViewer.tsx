"use client";
import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { Lang, translations, TranslationKey } from "@/lib/i18n";

interface InfoItem {
  label?: string | null;
  description?: { text: string }[] | null;
  audio_file?: { url: string } | null;
  video_url?: string | null;
  video_ratio?: number | null;
}

interface SceneData {
  id: string;
  data: {
    title?: string;
    nom_scene_krpano?: string;
    /** Vue d'arrivée définie par le client (espace client / mode modification) */
    vue_arrivee_ath?: number;
    vue_arrivee_atv?: number;
    vue_arrivee_fov?: number;
    description?: { text: string }[];
    categorie?: string;
    badge?: string;
    epoque?: string;
    style_architectural?: string;
    element_remarquable?: string;
    ordre?: number;
    description_longue?: { text: string }[];
    audio_file?: { url?: string };
    video_url?: string;
    video_file?: { url?: string };
    video_ratio?: number | null;
    informations_list?: InfoItem[];
  };
}

// Valeurs de secours uniquement (Prismic indisponible) — le contenu réel vit dans Prismic
// et s'édite depuis l'espace client (règle contenu JUUMO, Max 2026-09-04).
const DEFAULT_SCENES: SceneData[] = [
  { id: "1", data: { title: "Parvis - Entrée", nom_scene_krpano: "scene_parvis_entree", categorie: "Extérieur", ordre: 1 } },
  { id: "2", data: { title: "Parvis - Côté sud", nom_scene_krpano: "scene_parvis_entree_sud", categorie: "Extérieur", ordre: 2 } },
  { id: "3", data: { title: "Parvis - Côté nord", nom_scene_krpano: "scene_parvis_nord", categorie: "Extérieur", ordre: 3 } },
  { id: "4", data: { title: "Parvis - Vue éloignée", nom_scene_krpano: "scene_parvis_sud_loin", categorie: "Extérieur", ordre: 4 } },
  { id: "5", data: { title: "Parvis - Vue rapprochée", nom_scene_krpano: "scene_parvis_sud_proche", categorie: "Extérieur", ordre: 5 } },
  { id: "6", data: { title: "Vue du ciel - Cathédrale", nom_scene_krpano: "scene_vue_cathedrale", categorie: "Extérieur", ordre: 6 } },
  { id: "7", data: { title: "Vue du ciel - Donjon", nom_scene_krpano: "scene_vue_donjon", categorie: "Extérieur", ordre: 7 } },
  { id: "8", data: { title: "Entrée - La nef", nom_scene_krpano: "scene_entree", categorie: "Intérieur", ordre: 8 } },
  { id: "9", data: { title: "Le grand orgue", nom_scene_krpano: "scene_orgue", categorie: "Intérieur", ordre: 9 } },
  { id: "10", data: { title: "L'orgue et le chœur", nom_scene_krpano: "scene_orgue_choeur", categorie: "Intérieur", ordre: 10 } },
  { id: "11", data: { title: "L'autel", nom_scene_krpano: "scene_autel", categorie: "Intérieur", ordre: 11 } },
  { id: "12", data: { title: "Le chœur", nom_scene_krpano: "scene_choeur_autel", categorie: "Intérieur", ordre: 12 } },
  { id: "13", data: { title: "Le chœur - Vue latérale", nom_scene_krpano: "scene_choeur_autel1", categorie: "Intérieur", ordre: 13 } },
  { id: "14", data: { title: "Le chœur - Vue arrière", nom_scene_krpano: "scene_choeur_autel2", categorie: "Intérieur", ordre: 14 } },
  { id: "15", data: { title: "Collatéral nord - L'autel", nom_scene_krpano: "scene_aile_nord_autel", categorie: "Intérieur", ordre: 15 } },
  { id: "16", data: { title: "Collatéral nord - Les vitraux", nom_scene_krpano: "scene_aile_nord_centre", categorie: "Intérieur", ordre: 16 } },
  { id: "17", data: { title: "Collatéral sud - L'autel", nom_scene_krpano: "scene_aile_sud_autel", categorie: "Intérieur", ordre: 17 } },
  { id: "18", data: { title: "Collatéral sud - Second autel", nom_scene_krpano: "scene_aile_sud_autel2", categorie: "Intérieur", ordre: 18 } },
  { id: "19", data: { title: "Le baptistère", nom_scene_krpano: "scene_aile_sud_baptistere", categorie: "Intérieur", ordre: 19 } },
  { id: "20", data: { title: "Collatéral sud - Le centre", nom_scene_krpano: "scene_aile_sud_centre", categorie: "Intérieur", ordre: 20 } },
  { id: "21", data: { title: "Collatéral sud - Le fond", nom_scene_krpano: "scene_aile_sud_fond", categorie: "Intérieur", ordre: 21 } },
  { id: "22", data: { title: "La crypte", nom_scene_krpano: "scene_crypte", categorie: "Crypte", ordre: 22 } },
];

// Aucune description en dur : les descriptions courtes et longues viennent de Prismic.
const SCENE_FALLBACK_DESCRIPTIONS: Record<string, { fr: string[]; en: string[] }> = {};

// (conservé pour parité de structure avec Sainte Jeanne d'Arc — vide ici)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SCENE_SHORT_INTRO: Record<string, { fr: string; en: string }> = {};

export default function TourViewer({ scenesByLang, initialScene }: { scenesByLang: { fr: SceneData[]; en: SceneData[] }; initialScene?: string }) {
  const [lang, setLang] = useState<Lang>("fr");
  const sortedScenes = useMemo(() => {
    const raw = lang === "en" ? (scenesByLang.en ?? []) : (scenesByLang.fr ?? []);
    const base = raw.length > 0 ? raw : DEFAULT_SCENES;
    // Dédoublonnage par nom_scene_krpano uniquement
    const seenId = new Set<string>();
    const deduped = base.filter(s => {
      const id = s.data.nom_scene_krpano;
      if (!id || seenId.has(id)) return false;
      seenId.add(id);
      return true;
    });
    return deduped.sort((a, b) => (a.data.ordre ?? 99) - (b.data.ordre ?? 99));
  }, [lang, scenesByLang]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Scène de départ : celle demandée (/scene/…), sinon la première du parcours (ordre Prismic),
  // sinon le parvis. Aucun id de scène en dur propre à un autre site.
  const startScene = initialScene || sortedScenes[0]?.data?.nom_scene_krpano || "scene_parvis_entree";
  const [activeScene, setActiveScene] = useState(startScene);
  const [visitedScenes, setVisitedScenes] = useState<Set<string>>(() => new Set([startScene]));
  const [showMenu, setShowMenu] = useState(false);
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState<number | null>(null);
  const [showFullMenu, setShowFullMenu] = useState(false);
  const [flippedInfo, setFlippedInfo] = useState(false);
  const [showChurches, setShowChurches] = useState(false);
  const [menuSection, setMenuSection] = useState<"info" | "churches" | "partners" | null>(null);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoPip, setVideoPip] = useState(false);
  // Swipe vers le bas sur la vidéo plein écran → réduction en mini-lecteur
  const [videoDragY, setVideoDragY] = useState(0);
  const videoDragStart = useRef<{ x: number; y: number } | null>(null);
  const videoDragDir = useRef<"h" | "v" | null>(null);
  const [pipVideoUrl, setPipVideoUrl] = useState<string | null>(null);
  const [pipVideoRatio, setPipVideoRatio] = useState(16 / 9);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoIframeRef = useRef<HTMLIFrameElement>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioPlayingScene, setAudioPlayingScene] = useState<string | null>(null);
  const [audioPlayingUrl, setAudioPlayingUrl] = useState<string | null>(null);
  const [audioPlayingLabel, setAudioPlayingLabel] = useState<string | null>(null);
  const audioPlayingRef = useRef(false);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [showSceneAudio, setShowSceneAudio] = useState(false);
  const [hsPreview, setHsPreview] = useState<{ title: string; thumburl: string; x: number; y: number } | null>(null);
  // Popup actif au-dessus de la barre : "scene" | "chat" | "don" | null
  const [activePopup, setActivePopup] = useState<"scene" | "chat" | "don" | null>(null);
  const [chatInput, setChatInput] = useState("");
  // Coach-mark 1ère visite (desktop + mobile) : signale que le titre de scène (barre du bas) se déroule
  const [showTitleHint, setShowTitleHint] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("sjda_scene_hint_seen")) return;
    const show = setTimeout(() => {
      // Revérifie au moment de l'apparition : un popup ouvert entre-temps pose le flag
      if (!localStorage.getItem("sjda_scene_hint_seen")) setShowTitleHint(true);
    }, 3000);
    const hide = setTimeout(() => {
      setShowTitleHint(false);
      localStorage.setItem("sjda_scene_hint_seen", "1");
    }, 14000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);
  useEffect(() => {
    // Dès qu'un popup s'ouvre, l'utilisateur a découvert la barre : hint inutile
    if (activePopup !== null) {
      setShowTitleHint(false);
      localStorage.setItem("sjda_scene_hint_seen", "1");
    }
  }, [activePopup]);
  // Bulle proactive Juumi : apparaît une fois par session après 25s
  const [showJuumiTeaser, setShowJuumiTeaser] = useState(false);
  const dismissJuumiTeaser = () => {
    setShowJuumiTeaser(false);
    try { sessionStorage.setItem("sjda_juumi_teaser_seen", "1"); } catch {}
  };
  useEffect(() => {
    try { if (sessionStorage.getItem("sjda_juumi_teaser_seen")) return; } catch { return; }
    const timer = setTimeout(() => {
      try { if (sessionStorage.getItem("sjda_juumi_teaser_seen")) return; } catch {}
      setShowJuumiTeaser(true);
    }, 25000);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    // Ouvrir un popup (dont le chat lui-même) = la bulle n'a plus de raison d'être
    if (activePopup !== null) {
      setShowJuumiTeaser(false);
      try { sessionStorage.setItem("sjda_juumi_teaser_seen", "1"); } catch {}
    }
  }, [activePopup]);

  // Popup don : vue principale ou formulaire cierge
  const SUMUP_URL = "https://pay.sumup.com/b2c/QCSIXK2K";
  const [donView, setDonView] = useState<"main" | "cierge">("main");
  const [ciergeEmail, setCiergeEmail] = useState("");
  const [ciergeName, setCiergeName] = useState("");
  const [ciergeIntent, setCiergeIntent] = useState("");
  const [ciergeStatus, setCiergeStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  useEffect(() => {
    // Réinitialise la vue à chaque (ré)ouverture du popup don
    if (activePopup === "don") { setDonView("main"); setCiergeStatus("idle"); }
  }, [activePopup]);

  async function submitCierge() {
    if (ciergeStatus === "sending") return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ciergeEmail.trim())) return;
    setCiergeStatus("sending");
    if (typeof window !== "undefined") window._paq?.push(["trackEvent", "Don", "cierge_submit"]);
    try {
      const res = await fetch("/api/cierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ciergeEmail.trim(), firstname: ciergeName.trim(), intention: ciergeIntent.trim() }),
      });
      if (!res.ok) throw new Error("send failed");
      setCiergeStatus("done");
    } catch {
      setCiergeStatus("error");
    }
    // Dans tous les cas on ouvre le paiement : l'e-mail ne doit jamais bloquer le don
    window.open(SUMUP_URL, "_blank", "noopener");
  }

  // Conversation multi-tours + suggestions cliquables (portées de saint-maclou)
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatStreaming, setChatStreaming] = useState("");
  const [chatSuggestions, setChatSuggestions] = useState<string[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  // Statut central du chatbot (fin d'essai) — fail-open : inactif UNIQUEMENT
  // si l'espace client répond explicitement active:false. Inactif = le chat
  // est entièrement MASQUÉ (aucun message « essai terminé » côté visiteur).
  const [juumiStatus, setJuumiStatus] = useState<{ active: boolean; message?: string }>({ active: true });
  useEffect(() => {
    fetch(`https://espace.juumo.fr/api/juumi-status?site=${window.location.hostname}`)
      .then((r) => r.json())
      .then((st) => { if (st && st.active === false) setJuumiStatus(st); })
      .catch(() => {});
  }, []);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Panneau de modification partagé JUUMO (edit.js) : ce que la visite affiche et les
  // vues d'arrivée, lus par bridge.js dans tour.html et par le panneau (recherche, textes).
  useEffect(() => {
    (window as unknown as { JUUMO_EDIT_SITE?: unknown }).JUUMO_EDIT_SITE = {
      scenes: ((scenesByLang.fr ?? [])).map((s) => ({
        id: s.data?.nom_scene_krpano ?? "",
        title: s.data?.title ?? "",
        description: Array.isArray(s.data?.description) ? s.data.description.map((b: { text?: string }) => b?.text ?? "").filter(Boolean).join("\n\n") : "",
        vue: typeof s.data?.vue_arrivee_ath === "number" && typeof s.data?.vue_arrivee_atv === "number"
          ? { hlookat: s.data.vue_arrivee_ath, vlookat: s.data.vue_arrivee_atv, fov: s.data.vue_arrivee_fov ?? undefined }
          : undefined,
      })),
      tourXml: "/vtour/tour.xml",
      // Tags (points d'info positionnés dans le panorama) : rendu partagé par bridge.js
      // depuis l'espace client (convention Prismic « infospot », hotspots KRpano jtag_<docId>).
      // Les « informations » audio/vidéo de l'accordéon restent un système à part.
      outils: { points: true },
      tags: { rendu: "juumo", couleur: "#8b1c1c" },
      spotPrefix: "jtag_",
      spotKey: "docId",
    };
    // Le pont vit dans l'iframe tour.html : on lui signale la mise à jour (vues d'arrivée, tags)
    (iframeRef.current?.contentWindow as (Window & { juumoBridgeNewScene?: () => void }) | null | undefined)?.juumoBridgeNewScene?.();
  }, [scenesByLang]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const swipeDir = useRef<"h" | "v" | null>(null);
  const [swipeDeltaY, setSwipeDeltaY] = useState(0);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const t = (key: TranslationKey): string => translations[lang][key] as string;
  const barRef = useRef<HTMLDivElement>(null);
  const [barHeight, setBarHeight] = useState(120);
  const navBarRef = useRef<HTMLDivElement>(null);
  const [navBarHeight, setNavBarHeight] = useState(80);

  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const update = () => setBarHeight(el.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fiche des tags du rendu partagé (bridge.js, dans l'iframe) : on lui transmet la hauteur
  // occupée par la barre du bas pour qu'elle s'affiche au-dessus (variable lue par tour.html).
  const appliquerInsetBas = () => {
    try {
      const bar = barRef.current?.getBoundingClientRect();
      const inset = bar ? Math.max(0, Math.round(window.innerHeight - bar.top)) : 0;
      iframeRef.current?.contentDocument?.documentElement.style.setProperty("--juumo-ui-bottom", `${inset}px`);
    } catch { /* iframe pas encore chargée */ }
  };
  useEffect(appliquerInsetBas, [barHeight, isMobile]);

  useLayoutEffect(() => {
    const el = navBarRef.current;
    if (!el) return;
    const update = () => setNavBarHeight(el.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function renderSimpleMarkdown(text: string) {
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // [GOTO:scene_x]Label[/GOTO] → bouton de navigation (délégation de clic,
      // convention chatbot JUUMO — voir integration-kit/CHATBOT-CONTENU.md)
      .replace(/\[GOTO:([a-z0-9_]+)\]([\s\S]*?)\[\/GOTO\]/gi, (_m, scene, label) =>
        `<button type="button" data-goto="${scene}" style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:14px;border:none;background:#8b1c1c;color:#fff;font-weight:600;font-size:12px;font-family:inherit;cursor:pointer;vertical-align:baseline">${label} ↗</button>`)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#2D3E50;font-weight:500">$1</a>')
      .replace(/^[\-\*]\s+(.+)/gm, "<li>$1</li>")
      .replace(/(<li>[\s\S]*<\/li>)/, "<ul>$1</ul>")
      .replace(/\n/g, "<br>");
  }

  const CHAT_SUGGESTIONS_RE = /\[SUGGESTIONS\]([\s\S]*?)(\[\/SUGGESTIONS\]|$)/;

  async function sendChatMessage(textArg?: string) {
    const text = (textArg ?? chatInput).trim();
    if (!text || chatLoading) return;
    if (!juumiStatus.active) return;
    if (typeof window !== "undefined") window._paq?.push(["trackEvent", "Chatbot", "message", text]);
    const next: { role: "user" | "assistant"; content: string }[] = [...chatMessages, { role: "user", content: text }];
    setChatMessages(next);
    setChatInput("");
    setChatSuggestions([]);
    setChatLoading(true);
    setChatStreaming("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, scene: activeScene }),
      });

      if (!response.ok || !response.body) throw new Error("Erreur");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setChatStreaming(fullText.replace(CHAT_SUGGESTIONS_RE, "").trim());
              }
            } catch {}
          }
        }
      }

      const m = fullText.match(CHAT_SUGGESTIONS_RE);
      if (m) setChatSuggestions(m[1].split("|").map(x => x.trim()).filter(Boolean).slice(0, 3));
      setChatMessages([...next, { role: "assistant", content: fullText.replace(CHAT_SUGGESTIONS_RE, "").trim() }]);
    } catch {
      setChatMessages([...next, { role: "assistant", content: "Désolé, une erreur est survenue. Veuillez réessayer." }]);
    }

    setChatStreaming("");
    setChatLoading(false);
  }

  // Suit la conversation (scroll bas) à chaque message / token streamé
  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages, chatStreaming]);

  const currentIndex = sortedScenes.findIndex(
    (s) => s.data.nom_scene_krpano === activeScene
  );
  const currentScene = sortedScenes[currentIndex];
  const totalScenes = sortedScenes.length;

  // Aperçu en direct du mode modification (panneau juumo-edit) : le titre / la description
  // saisis dans le panneau (événement juumo-edit:preview) remplacent ceux de la scène
  // courante tant qu'ils la concernent.
  const [apercuScene, setApercuScene] = useState<{ id: string; title?: string; description?: string } | null>(null);
  useEffect(() => {
    const f = (e: Event) => setApercuScene((e as CustomEvent<{ scene?: { id: string; title?: string; description?: string } }>).detail?.scene ?? null);
    window.addEventListener("juumo-edit:preview", f);
    return () => window.removeEventListener("juumo-edit:preview", f);
  }, []);
  const apercuCourant = apercuScene && apercuScene.id === activeScene ? apercuScene : null;
  const sceneTitle = apercuCourant?.title ?? currentScene?.data.title ?? "";
  // Description courte (champ Prismic `description`, modifiable dans la visite) : aperçu si saisi, sinon Prismic
  const sceneShortDesc: string[] =
    apercuCourant?.description !== undefined
      ? apercuCourant.description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
      : (currentScene?.data.description ?? []).map((p) => (p.text ?? "").trim()).filter(Boolean);

  // Heatmap espace client : chaque ouverture d'un point d'info (accordéon
  // vitraux/hotspots) = event Matomo (catégorie Hotspot, action = scène, nom = label)
  useEffect(() => {
    if (expandedInfo === null || typeof window === "undefined") return;
    const items = (currentScene?.data.informations_list ?? []).filter(
      (i) => i.description && i.description.length > 0
    );
    const title = items[expandedInfo]?.label ?? `info_${expandedInfo}`;
    window._paq?.push(["trackEvent", "Hotspot", activeScene, title]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedInfo]);

  // Liste courante des scènes lisible depuis le handler postMessage (effet monté une seule fois)
  const sortedScenesRef = useRef(sortedScenes);
  sortedScenesRef.current = sortedScenes;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.action === "hs_hover") {
        // Titre de la scène visée : celui de Prismic (espace client), le titre KRpano n'est qu'un secours
        const target = sortedScenesRef.current.find((s) => s.data.nom_scene_krpano === event.data.scene);
        setHsPreview({
          title: target?.data.title || event.data.title || "",
          thumburl: event.data.thumburl ? `/vtour/${event.data.thumburl}` : "",
          x: event.data.x,
          y: event.data.y,
        });
      }
      if (event.data?.action === "hs_out") {
        setHsPreview(null);
      }
      if (event.data?.action === "scenechanged" && event.data.scene) {
        setActiveScene(event.data.scene);
        setVisitedScenes(prev => new Set([...prev, event.data.scene]));
        setActivePopup(prev => prev === "scene" ? "scene" : null);
        setShowDetailedInfo(false);
        setExpandedInfo(null);
        setShowVideo(false);
        if (!audioPlayingRef.current) {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          setAudioPlaying(false);
          setAudioPlayingScene(null);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Vimeo postMessage API — track time for custom controls (modal + PiP)
  useEffect(() => {
    if (!showVideo && !videoPip) {
      setVideoTime(0);
      setVideoDuration(0);
      setVideoIsPlaying(false);
      return;
    }
    const handleVimeoMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (!data?.event) return;
        if (data.event === "ready") {
          const win = videoIframeRef.current?.contentWindow;
          if (!win) return;
          ["timeupdate", "play", "pause", "ended"].forEach((evt) =>
            win.postMessage(JSON.stringify({ method: "addEventListener", value: evt }), "https://player.vimeo.com")
          );
        } else if (data.event === "timeupdate") {
          setVideoTime(data.data.seconds);
          setVideoDuration(data.data.duration);
        } else if (data.event === "play") {
          setVideoIsPlaying(true);
        } else if (data.event === "pause" || data.event === "ended") {
          setVideoIsPlaying(false);
        }
      } catch { /* ignore non-Vimeo messages */ }
    };
    window.addEventListener("message", handleVimeoMessage);
    return () => window.removeEventListener("message", handleVimeoMessage);
  }, [showVideo, videoPip]);

  const changeScene = (sceneName: string) => {
    setActiveScene(sceneName);
    setVisitedScenes(prev => new Set([...prev, sceneName]));
    setActivePopup(prev => prev === "scene" ? "scene" : null);
    setShowDetailedInfo(false);
    setShowVideo(false);
    setShowMenu(false);
    if (!audioPlayingRef.current) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setAudioPlaying(false);
      setAudioPlayingScene(null);
    }
    iframeRef.current?.contentWindow?.postMessage(
      { action: "loadscene", scene: sceneName },
      "*"
    );
  };

  const goNext = () => {
    const next = (currentIndex + 1) % totalScenes;
    changeScene(sortedScenes[next].data.nom_scene_krpano!);
  };

  const goPrev = () => {
    const prev = (currentIndex - 1 + totalScenes) % totalScenes;
    changeScene(sortedScenes[prev].data.nom_scene_krpano!);
  };

  // Délégation de clic : boutons [GOTO] injectés dans le HTML des réponses
  // (convention chatbot JUUMO — integration-kit/CHATBOT-CONTENU.md).
  const onChatLinkClick = (e: { target: EventTarget | null }) => {
    const btn = (e.target as HTMLElement | null)?.closest?.("[data-goto]");
    const scene = btn?.getAttribute("data-goto") ?? "";
    if (!scene || !sortedScenes.some(s => s.data.nom_scene_krpano === scene)) return;
    if (typeof window !== "undefined") window._paq?.push(["trackEvent", "Chatbot", "goto_scene", scene]);
    changeScene(scene);
    setActivePopup(null); // laisse le visiteur profiter de la scène
  };

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Passage plein écran → mini-lecteur (bouton « Réduire » et swipe vers le bas)
  const reduceVideoToPip = () => {
    if (!pipVideoUrl) {
      setPipVideoUrl(currentScene?.data.video_file?.url || currentScene?.data.video_url || "");
      setPipVideoRatio(currentScene?.data.video_ratio || 16 / 9);
    }
    setVideoPip(true);
    setShowVideo(false);
  };

  const videoSwipeHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      videoDragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      videoDragDir.current = null;
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (!videoDragStart.current) return;
      const dy = e.touches[0].clientY - videoDragStart.current.y;
      const dx = Math.abs(e.touches[0].clientX - videoDragStart.current.x);
      if (!videoDragDir.current && (Math.abs(dy) > 8 || dx > 8)) {
        videoDragDir.current = Math.abs(dy) > dx ? "v" : "h";
      }
      if (videoDragDir.current === "v" && dy > 0) setVideoDragY(Math.min(dy, 350));
    },
    onTouchEnd: () => {
      if (videoDragDir.current === "v" && videoDragY > 80) reduceVideoToPip();
      setVideoDragY(0);
      videoDragDir.current = null;
      videoDragStart.current = null;
    },
    onTouchCancel: () => {
      setVideoDragY(0);
      videoDragDir.current = null;
      videoDragStart.current = null;
    },
  };

  const playAudio = (url: string, scene: string, label?: string | null) => {
    if (!audioRef.current) return;
    if (videoPip) { setVideoPip(false); setPipVideoUrl(null); }
    if (audioPlayingUrl !== url) {
      audioRef.current.src = url;
      setAudioTime(0);
    }
    audioRef.current.play();
    setAudioPlaying(true);
    audioPlayingRef.current = true;
    setAudioPlayingScene(scene);
    setAudioPlayingUrl(url);
    setAudioPlayingLabel(label ?? null);
  };

  // Backward compat — joue le premier audio de la scène courante
  const playSceneAudio = () => {
    const url = currentScene?.data.audio_file?.url;
    if (url) playAudio(url, activeScene);
  };

  const pauseAudio = () => {
    audioRef.current?.pause();
    setAudioPlaying(false);
    audioPlayingRef.current = false;
  };

  const toggleSceneAudio = () => {
    if (audioPlaying && audioPlayingScene === activeScene) pauseAudio();
    else playSceneAudio();
  };

  // Reprend/pause l'audio en cours sans tenir compte de la scène active
  // (utilisé par le lecteur flottant quand on a changé de scène)
  const toggleCurrentAudio = () => {
    if (audioPlaying) {
      pauseAudio();
    } else if (audioRef.current) {
      audioRef.current.play();
      setAudioPlaying(true);
      audioPlayingRef.current = true;
    }
  };

  // Swipe vertical pour fermer les tiroirs
  const onDrawerTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
    swipeDir.current = null;
  };
  const onDrawerTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - swipeStartY.current;
    const dx = Math.abs(e.touches[0].clientX - swipeStartX.current);
    if (!swipeDir.current && (Math.abs(dy) > 8 || dx > 8)) {
      swipeDir.current = Math.abs(dy) > dx ? "v" : "h";
    }
    if (swipeDir.current === "v" && dy > 0) {
      setSwipeDeltaY(Math.min(dy, 350));
    }
  };
  const onDrawerTouchEnd = (e: React.TouchEvent, allowHorizontal = false) => {
    if (swipeDir.current === "v") {
      if (swipeDeltaY > 80) setActivePopup(null);
      setSwipeDeltaY(0);
    } else if (allowHorizontal && swipeDir.current === "h") {
      const dx = e.changedTouches[0].clientX - swipeStartX.current;
      if (Math.abs(dx) > 52) { if (dx < 0) goNext(); else goPrev(); }
    }
    swipeDir.current = null;
  };

  const seekAudio = (pct: number) => {
    if (audioRef.current && audioDuration) {
      const t = Math.max(0, Math.min(1, pct)) * audioDuration;
      audioRef.current.currentTime = t;
      setAudioTime(t);
    }
  };

  const seekVideo = (pct: number) => {
    if (!videoDuration) return;
    const t = Math.max(0, Math.min(1, pct)) * videoDuration;
    videoIframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ method: "setCurrentTime", value: t }),
      "https://player.vimeo.com"
    );
    setVideoTime(t);
  };

  const toggleVideo = () => {
    const method = videoIsPlaying ? "pause" : "play";
    videoIframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ method }),
      "https://player.vimeo.com"
    );
  };

  // Ouvre/bascule un popup au-dessus de la barre (un seul à la fois)
  const togglePopup = (p: "scene" | "chat" | "don") => {
    // Reset du swipe : un touchcancel peut laisser un offset résiduel qui
    // fige le popup à mi-course
    setSwipeDeltaY(0);
    swipeDir.current = null;
    setActivePopup((cur) => {
      const next = cur === p ? null : p;
      if (next === "chat" && typeof window !== "undefined") window._paq?.push(["trackEvent", "Chatbot", "open"]);
      return next;
    });
    setShowMenu(false);
    // Sur mobile : délai après fin d'animation (600ms) pour éviter que le clavier
    // s'ouvre en plein milieu de la transition et fasse sauter le popup
    if (p === "chat") setTimeout(() => chatInputRef.current?.focus(), isMobile ? 620 : 60);
  };

  return (
    <div style={{ width: "calc(100vw - var(--juumo-edit-width, 0px))", height: "100dvh", position: "relative", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
      {/* Fonts auto-hébergées (public/fonts) : le site fonctionne 100 % hors-ligne
          — plus de dépendance à fonts.googleapis.com, et meilleur LCP au passage */}
      <link href="/fonts/fonts.css" rel="stylesheet" />

      {/* KRPano iframe */}
      <iframe
        ref={iframeRef}
        src={`/vtour/tour.html?startscene=${startScene}`}
        width="100%"
        height="100%"
        style={{ border: "none", position: "absolute", top: 0, left: 0 }}
        allowFullScreen
        title="Visite virtuelle Cathédrale St Godard"
        onLoad={appliquerInsetBas}
      />

      {/* Click-outside overlay to close popups */}
      {activePopup && (
        <div
          onClick={() => setActivePopup(null)}
          style={{ position: "absolute", inset: 0, zIndex: 8 }}
        />
      )}

      {/* Top left — bouton déclencheur chapitre */}
      <div style={{ position: "absolute", top: isMobile ? 16 : 28, left: 0, zIndex: 20 }}>
        <div
          onClick={() => { setShowMenu(!showMenu); setShowFullMenu(false); }}
          style={{
            display: "block",
            width: isMobile ? "calc((100vw - 20px) / 2)" : 340,
            maxWidth: 380,
            padding: "8px 20px 8px 16px",
            borderRadius: "0 20px 20px 0",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderLeft: "none",
            cursor: "pointer",
            transition: "all 0.25s ease",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: "rgba(255,255,255,0.9)", textTransform: "uppercase" }}>
            {t("chapters_and_videos")}
          </span>
        </div>
      </div>

      {/* Backdrop menu chapitres */}
      {showMenu && (
        <div
          onClick={() => setShowMenu(false)}
          style={{ position: "absolute", inset: 0, zIndex: 24, background: "rgba(10,14,20,0.45)", backdropFilter: "blur(2px)" }}
        />
      )}

      {/* Drawer chapitres — slide depuis la gauche */}
      <div
        onTouchStart={(e) => { swipeStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { if (e.changedTouches[0].clientX - swipeStartX.current < -52) setShowMenu(false); }}
        style={{
        position: "absolute", top: 20, left: 0, bottom: 20, zIndex: 25,
        width: isMobile ? "calc(100vw - 20px)" : 340,
        maxWidth: 380,
        background: "#F7F5F2",
        boxShadow: "8px 0 48px rgba(0,0,0,0.22)",
        display: "flex", flexDirection: "column",
        transform: showMenu ? "translateX(0)" : "translateX(calc(-100% - 2px))",
        transition: "transform 0.48s cubic-bezier(0.32, 0.72, 0, 1)",
        borderRadius: "0 20px 20px 0",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          flexShrink: 0, padding: "22px 24px 16px",
          borderBottom: "1px solid rgba(45,62,80,0.1)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#8b1c1c", textTransform: "uppercase", margin: "0 0 3px" }}>
              {t("virtual_tour")}
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2332", margin: 0, fontFamily: "'Inter', sans-serif", lineHeight: 1.15 }}>
              {t("tour_path_label")}
            </h2>
          </div>
          <button onClick={() => setShowMenu(false)} style={{
            width: 38, height: 38, borderRadius: "50%", border: "none",
            background: "rgba(45,62,80,0.08)", cursor: "pointer", color: "#5a6776",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Liste des scènes + section vidéos */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0", WebkitOverflowScrolling: "touch" as const }}>

          {/* Section vidéos en premier */}
          {(() => {
            const videoScenes = sortedScenes.filter(s =>
              (s.data.video_file?.url || s.data.video_url) &&
              !s.data.categorie?.toLowerCase().includes("vitraux")
            );
            if (videoScenes.length === 0) return null;
            return (
              <>
                <div style={{ margin: "4px 20px 8px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#8b1c1c", textTransform: "uppercase" }}>{t("videos_section")}</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(45,62,80,0.1)" }} />
                </div>
                {(showAllVideos ? videoScenes : videoScenes.slice(0, 3)).map((scene) => {
                  const fileUrl = scene.data.video_file?.url;
                  // Dossiers KRpano : seule la 1re lettre du nom est en majuscule
                  // (ex : scene_nef_vue_sud → Nef_vue_sud.tiles)
                  const panoBase = (scene.data.nom_scene_krpano ?? "").replace("scene_", "");
                  const panoFolder = panoBase.charAt(0).toUpperCase() + panoBase.slice(1);
                  const thumb = `/vtour/panos/${panoFolder}.tiles/preview.jpg`;
                  return (
                    <button
                      key={scene.id}
                      onClick={() => {
                        changeScene(scene.data.nom_scene_krpano!);
                        pauseAudio();
                        setPipVideoUrl(fileUrl || scene.data.video_url || "");
                        setPipVideoRatio(scene.data.video_ratio || 16 / 9);
                        setVideoPip(true);
                        setShowMenu(false);
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        width: "100%", padding: "10px 20px",
                        border: "none", background: "transparent",
                        cursor: "pointer", textAlign: "left",
                        fontFamily: "'Inter', sans-serif",
                        transition: "background 0.2s ease",
                      }}
                    >
                      <div style={{ position: "relative", width: 52, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#1a2332" }}>
                        <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.75 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#8b1c1c", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2332" }}>{scene.data.title}</div>
                        <div style={{ fontSize: 11, color: "#8b1c1c", marginTop: 2, fontWeight: 600 }}>{t("watch_video")}</div>
                      </div>
                    </button>
                  );
                })}
                {videoScenes.length > 3 && (
                  <button
                    onClick={() => setShowAllVideos(v => !v)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", padding: "8px 20px",
                      border: "none", background: "transparent",
                      cursor: "pointer", textAlign: "left",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#8b1c1c", fontWeight: 700 }}>
                      {showAllVideos
                        ? `▴ ${t("collapse_videos")}`
                        : `▾ ${t("show_all_videos")} (${videoScenes.length - 3} ${t("more_count")})`}
                    </span>
                  </button>
                )}
                {/* Séparateur avant chapitres */}
                <div style={{ margin: "8px 20px 4px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#1a3250", textTransform: "uppercase" }}>{t("chapters_section")}</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(45,62,80,0.1)" }} />
                </div>
              </>
            );
          })()}

          {sortedScenes.map((scene, i) => (
            <button
              key={scene.id}
              onClick={() => { changeScene(scene.data.nom_scene_krpano!); setShowMenu(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "14px 20px",
                border: "none", background: activeScene === scene.data.nom_scene_krpano ? "rgba(45,62,80,0.08)" : "transparent",
                cursor: "pointer", textAlign: "left",
                transition: "background 0.2s ease",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {(() => {
                const isCurrent = activeScene === scene.data.nom_scene_krpano;
                const isVisited = visitedScenes.has(scene.data.nom_scene_krpano!);
                return (
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: isCurrent ? "#2D3E50" : isVisited ? "rgba(34,139,60,0.13)" : "rgba(45,62,80,0.07)",
                    color: isCurrent ? "white" : "#2D3E50",
                    fontSize: isCurrent ? 11 : 13, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.2s",
                  }}>
                    {isCurrent ? (i + 1) : isVisited ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22913c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (i + 1)}
                  </span>
                );
              })()}
              <div>
                <div style={{ fontSize: 14, fontWeight: activeScene === scene.data.nom_scene_krpano ? 700 : 500, color: "#1a2332" }}>
                  {scene.data.title}
                </div>
                {scene.data.categorie && (
                  <div style={{ fontSize: 11, color: "#8a8a8a", marginTop: 2 }}>
                    {scene.data.categorie}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Title + Description */}
      {/* top 96 aussi sur mobile : le bouton "Chapitres & vidéos" (2 lignes) descend jusqu'à ~78px */}
      <div style={{ position: "absolute", top: 96, left: isMobile ? 16 : 36, zIndex: 10, maxWidth: isMobile ? "calc(100vw - 120px)" : 500, pointerEvents: "none" }}>

        <h1 style={{
          margin: 0, fontSize: isMobile ? 28 : 44, fontWeight: 600, color: "white",
          fontFamily: "'Cormorant Garamond', serif",
          lineHeight: 1.1, textShadow: "0 2px 20px rgba(0,0,0,0.5)",
          fontStyle: "italic", pointerEvents: "none",
        }}>
          {sceneTitle}
        </h1>

      </div>

      {/* Overlay fermeture dropdown langue */}
      {showLangDropdown && (
        <div style={{ position: "fixed", inset: 0, zIndex: 19 }} onClick={() => setShowLangDropdown(false)} />
      )}

      {/* Top right — Langue + Menu */}
      <div style={{ position: "absolute", top: isMobile ? 16 : 32, right: isMobile ? 16 : 36, zIndex: 20, display: "flex", gap: 10, alignItems: "center" }}>
        {/* Bouton langue avec dropdown */}
        <div style={{ position: "relative" }}>
          <HeaderButton onClick={() => setShowLangDropdown(!showLangDropdown)} active={showLangDropdown}>
            {lang.toUpperCase()}
          </HeaderButton>
          {showLangDropdown && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "rgba(255,252,248,0.97)", backdropFilter: "blur(20px)",
              borderRadius: 16, padding: 4,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              border: "1px solid rgba(255,255,255,0.4)",
              minWidth: 130, zIndex: 20,
            }}>
              {([
                { code: "fr", label: "Français", flag: "🇫🇷" },
                { code: "en", label: "English",  flag: "🇬🇧" },
              ] as { code: Lang; label: string; flag: string }[]).map(({ code, label, flag }) => (
                <button
                  key={code}
                  onClick={() => { setLang(code); setShowLangDropdown(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    width: "100%", padding: "9px 14px",
                    background: lang === code ? "rgba(45,62,80,0.08)" : "transparent",
                    border: "none", cursor: "pointer", borderRadius: 12,
                    fontSize: 13, fontWeight: lang === code ? 700 : 500,
                    color: lang === code ? "#2D3E50" : "#4a5568",
                    fontFamily: "'Inter', sans-serif",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{flag}</span>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <HeaderButton
          onClick={() => { setShowFullMenu(!showFullMenu); setActivePopup(null); setShowMenu(false); }}
          active={showFullMenu}
        >
          {showFullMenu ? "✕" : "≡"}
        </HeaderButton>
      </div>

      {/* Popup Scène — description + actions */}
      <div style={{
        position: "absolute", bottom: isMobile ? navBarHeight : "calc(max(env(safe-area-inset-bottom, 0px) + 10px, 18px) + 54px)", left: "50%", transform: "translateX(-50%)",
        zIndex: 9,
        width: isMobile ? "calc(100vw - 24px)" : "min(460px, calc(100vw - 32px))", maxWidth: isMobile ? 400 : 460,
        height: isMobile ? "65svh" : 500,
        overflow: "hidden",
        pointerEvents: "none",
      }}>
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            transform: activePopup === "scene" ? `translateY(${swipeDeltaY}px)` : "translateY(115%)",
            transition: swipeDeltaY > 0 ? "none" : "transform 0.55s cubic-bezier(0.32, 0.72, 0, 1)",
            pointerEvents: activePopup === "scene" ? "auto" : "none",
          }}
          onTouchStart={onDrawerTouchStart}
          onTouchMove={onDrawerTouchMove}
          onTouchEnd={(e) => onDrawerTouchEnd(e, true)}
          onTouchCancel={() => { setSwipeDeltaY(0); swipeDir.current = null; }}
        >
        {currentScene && (() => {
          const sceneVideo = currentScene.data.video_file?.url || currentScene.data.video_url || "";
          const hasAudio = !!currentScene.data.audio_file?.url;
          // Descriptifs depuis informations_list (un par vitrail ou hotspot)
          const infoItems = (currentScene.data.informations_list ?? [])
            .filter(i => i.description && i.description.length > 0)
            // L'explicatif général ("Les vitraux") passe systématiquement en tête,
            // devant les vitraux spécifiques (tri stable : ordre Prismic conservé sinon)
            .sort((a, b) => {
              // fr "Les vitraux" · en "The Stained Glass Windows" · it "Le vetrate"
              const isGeneral = (x: typeof a) =>
                /^(les vitraux|the stained glass|le vetrate)/i.test((x.label ?? "").trim()) ? 0 : 1;
              return isGeneral(a) - isGeneral(b);
            });
          const prismicLongText = currentScene.data.description_longue?.filter(p => p.text) || [];
          const fallbackLang = lang === "en" ? "en" : "fr";
          const fallbackLongText = ((SCENE_FALLBACK_DESCRIPTIONS[activeScene]?.[fallbackLang] ?? SCENE_FALLBACK_DESCRIPTIONS[activeScene]?.fr) || []).map((t: string) => ({ text: t }));
          // Accordéon multi-info UNIQUEMENT sur les vitraux.
          // Les autres scènes (Nef, etc.) ont aussi plusieurs hotspots dans Prismic
          // (statue, vitraux, architecture visibles depuis la scène) mais ne doivent
          // afficher qu'un seul descriptif — pas d'accordéon.
          const isVitraux = currentScene.data.categorie?.toLowerCase().includes("vitraux");
          const hasInfoItems = isVitraux && infoItems.length >= 2;
          const longTextParagraphs = !hasInfoItems && prismicLongText.length > 0 ? prismicLongText : !hasInfoItems ? fallbackLongText : [];
          const hasLongText = hasInfoItems || longTextParagraphs.length > 0;
          const isThisAudio = audioPlayingScene === activeScene;
          const audioPos = isThisAudio ? audioTime : 0;
          const d = isThisAudio ? audioDuration : 0;
          const meta = [currentScene.data.categorie, currentScene.data.epoque].filter(Boolean).join(" · ");
          return (
          <div style={{
            background: "rgba(255,252,248,0.94)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px 24px 0 0",
            boxShadow: "0 -6px 32px rgba(0,0,0,0.18)",
            maxHeight: isMobile ? "65svh" : 500,
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            {/* Pill drag handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(45,62,80,0.18)", margin: "10px auto 0", flexShrink: 0 }} />
            {/* Header */}
            <div style={{ padding: "14px 22px 0", flexShrink: 0, position: "relative" }}>
              <button onClick={() => setActivePopup(null)} style={{
                position: "absolute", top: 10, right: 16,
                background: "rgba(45,62,80,0.08)", border: "none", fontSize: 12, cursor: "pointer", color: "#6b7d8e",
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#8b1c1c", textTransform: "uppercase", margin: 0 }}>
                {t("chapter")} {currentIndex + 1} {t("of")} {totalScenes}
              </p>
              <h2 style={{
                fontSize: 24, fontWeight: 700, color: "#1a2332", margin: "5px 0 0",
                fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", lineHeight: 1.12,
                paddingRight: 34,
              }}>
                {sceneTitle}
              </h2>
              {meta && (
                <p style={{ fontSize: 11, fontWeight: 600, color: "#8a96a3", margin: "5px 0 0", letterSpacing: 0.3 }}>
                  {meta}
                </p>
              )}
            </div>

            {/* Actions — juste sous le titre, avant le descriptif */}
            <div style={{ padding: "10px 18px 2px", flexShrink: 0, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {!hasInfoItems && hasLongText && (
                <button onClick={() => setShowDetailedInfo(!showDetailedInfo)} style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "7px 13px",
                  borderRadius: 20, border: "none", cursor: "pointer",
                  fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                  background: showDetailedInfo ? "#2D3E50" : "rgba(45,62,80,0.08)",
                  color: showDetailedInfo ? "white" : "#2D3E50",
                  transition: "all 0.2s ease", flexShrink: 0,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="16" y2="12"/></svg>
                  {showDetailedInfo ? t("collapse") : t("read_more")}
                </button>
              )}
              {/* Bouton audio principal — mode standard (non-vitraux) : un seul audio "Écouter" */}
              {!hasInfoItems && (() => {
                const audioInfos = currentScene.data.informations_list?.filter(i => i.audio_file?.url) ?? [];
                const url = audioInfos[0]?.audio_file?.url ?? currentScene.data.audio_file?.url;
                if (!url) return null;
                const isThisOne = audioPlayingUrl === url && audioPlayingScene === activeScene;
                return (
                  <button onClick={() => {
                    if (isThisOne && audioPlaying) pauseAudio();
                    else { setShowSceneAudio(true); playAudio(url, activeScene, null); }
                  }} style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "7px 13px",
                    borderRadius: 20, border: "none", cursor: "pointer",
                    fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                    background: isThisOne ? "#2D3E50" : "rgba(45,62,80,0.08)",
                    color: isThisOne ? "white" : "#2D3E50",
                    transition: "all 0.2s ease", flexShrink: 0,
                  }}>
                    {isThisOne && audioPlaying
                      ? <svg width="11" height="11" viewBox="0 0 24 24" fill={isThisOne ? "white" : "#2D3E50"} stroke="none"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                      : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    }
                    {isThisOne && audioPlaying ? t("pause") : t("listen")}
                  </button>
                );
              })()}
              {sceneVideo && !isVitraux && (
                <button onClick={() => {
                  setActivePopup(null);
                  pauseAudio();
                  const fileUrl = currentScene?.data.video_file?.url;
                  const embedUrl = currentScene?.data.video_url;
                  setPipVideoUrl(fileUrl || embedUrl || "");
                  setPipVideoRatio(currentScene?.data.video_ratio || 16 / 9);
                  setVideoPip(true);
                }} style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "7px 13px",
                  borderRadius: 20, border: "none", cursor: "pointer",
                  fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                  background: "#8b1c1c", color: "white",
                  transition: "all 0.2s ease", flexShrink: 0,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="white" stroke="none" style={{marginLeft:1}}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  {t("video")}
                </button>
              )}
            </div>

            {/* Zone principale : cartes vitrails OU description standard */}
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: isMobile ? "8px 16px 20px" : "8px 16px 14px", WebkitOverflowScrolling: "touch" as const }}>
              {/* Description courte de la scène (Prismic `description`, modifiable dans la visite) — au-dessus de l'accordéon / du texte long */}
              {sceneShortDesc.length > 0 && (
                <div style={{ padding: "2px 4px 10px" }}>
                  {sceneShortDesc.map((p, i) => (
                    <p key={i} style={{ fontSize: 12.5, lineHeight: 1.65, color: "#3a4a5a", margin: i > 0 ? "6px 0 0" : 0 }}>
                      {p}
                    </p>
                  ))}
                </div>
              )}
              {hasInfoItems ? (
                // Mode accordéon — réduit par défaut, clic pour déployer
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {infoItems.map((info, i) => {
                    const url = info.audio_file?.url ?? null;
                    const isPlayingThis = audioPlayingUrl === url && audioPlayingScene === activeScene && url !== null;
                    const isOpen = expandedInfo === i;
                    return (
                      <div key={i} style={{
                        background: isOpen ? "rgba(45,62,80,0.06)" : "rgba(45,62,80,0.04)",
                        borderRadius: 11,
                        border: isPlayingThis ? "1px solid rgba(139,28,28,0.3)" : "1px solid rgba(45,62,80,0.08)",
                        overflow: "hidden", transition: "border 0.2s",
                      }}>
                        {/* En-tête cliquable */}
                        <button
                          onClick={() => setExpandedInfo(isOpen ? null : i)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "10px 12px", background: "transparent", border: "none", cursor: "pointer",
                            textAlign: "left", gap: 8,
                          }}
                        >
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1a2332", lineHeight: 1.3, flex: 1 }}>
                            {info.label}
                          </span>
                          <svg
                            width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="#8a96a3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                          >
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </button>

                        {/* Contenu déplié */}
                        {isOpen && (
                          <div style={{ padding: "0 12px 12px" }}>
                            {info.description && info.description.length > 0 && (
                              <div style={{ marginBottom: url ? 10 : 0 }}>
                                {info.description.map((p, j) => (
                                  <p key={j} style={{ fontSize: 12, lineHeight: 1.65, color: "#4a5563", margin: j > 0 ? "5px 0 0" : 0 }}>
                                    {p.text}
                                  </p>
                                ))}
                              </div>
                            )}
                            {url && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isPlayingThis && audioPlaying) pauseAudio();
                                  else { setShowSceneAudio(true); playAudio(url, activeScene, info.label); }
                                }}
                                style={{
                                  display: "flex", alignItems: "center", gap: 5,
                                  padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer",
                                  fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
                                  background: isPlayingThis ? "#2D3E50" : "rgba(45,62,80,0.10)",
                                  color: isPlayingThis ? "white" : "#2D3E50",
                                  transition: "all 0.2s",
                                }}
                              >
                                {isPlayingThis && audioPlaying
                                  ? <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/></svg>
                                  : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                                }
                                {isPlayingThis && audioPlaying ? t("pause") : t("listen")}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : showDetailedInfo && hasLongText ? (
                // Mode standard : description unique expandée
                <div style={{ padding: 14, background: "rgba(45,62,80,0.04)", borderRadius: 12 }}>
                  {longTextParagraphs.map((p: { text: string }, i: number) => (
                    <p key={i} style={{ fontSize: 12.5, lineHeight: 1.7, color: "#3a4a5a", margin: i > 0 ? "8px 0 0" : 0 }}>
                      {p.text}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>

          </div>
          );
        })()}
        </div>
      </div>

      {/* Video modal overlay (fullscreen) */}
      {showVideo && !videoPip && (currentScene?.data.video_file?.url || currentScene?.data.video_url) && (() => {
        // Calcul des dimensions depuis le ratio oEmbed (portrait ou paysage)
        const ratio = currentScene?.data.video_ratio ?? (16 / 9);
        // width = min(90vw, 85vh * ratio) / height = min(85vh, 90vw / ratio)
        const w = `min(90vw, calc(85vh * ${ratio}))`;
        const h = `min(85vh, calc(90vw / ${ratio}))`;
        return (
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 30,
            background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => { setShowVideo(false); setPipVideoUrl(null); }}
        >
          <div
            style={{
              position: "relative", width: w, height: h,
              transform: videoDragY ? `translateY(${videoDragY}px)` : undefined,
              opacity: videoDragY ? Math.max(0.45, 1 - videoDragY / 400) : 1,
              transition: videoDragY ? "none" : "transform 0.3s ease, opacity 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
            {...videoSwipeHandlers}
          >
            {currentScene?.data.video_file?.url ? (
              <video
                ref={videoRef}
                src={currentScene.data.video_file.url}
                controls
                autoPlay
                style={{ width: "100%", height: "100%", borderRadius: 16, objectFit: "contain", background: "black" }}
              />
            ) : (
              <>
                <iframe
                  ref={videoIframeRef}
                  src={getEmbedUrl(pipVideoUrl || currentScene!.data.video_url!)}
                  width="100%"
                  height="100%"
                  style={{ border: "none", borderRadius: 16, display: "block" }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
                {/* Custom Vimeo controls overlay */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "linear-gradient(transparent, rgba(0,0,0,0.78))",
                  borderRadius: "0 0 16px 16px",
                  padding: "32px 16px 14px",
                  pointerEvents: "none",
                }}>
                  {/* Progress bar */}
                  <div
                    onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seekVideo((e.clientX - r.left) / r.width); }}
                    style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.25)", cursor: "pointer", position: "relative", marginBottom: 10, pointerEvents: "all" }}
                  >
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0,
                      width: `${videoDuration ? (videoTime / videoDuration) * 100 : 0}%`,
                      background: "white", borderRadius: 2, transition: "width 0.5s linear",
                    }} />
                  </div>
                  {/* Controls row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, pointerEvents: "all" }}>
                    <button onClick={toggleVideo} style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                      color: "white", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {videoIsPlaying
                        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/></svg>
                        : <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                      }
                    </button>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                      {formatTime(videoTime)} / {formatTime(videoDuration)}
                    </span>
                  </div>
                </div>
              </>
            )}
            <div style={{ position: "absolute", top: -44, right: 0, display: "flex", gap: 8 }}>
              {/* Reduce to PiP */}
              {(currentScene?.data.video_file?.url || currentScene?.data.video_url || pipVideoUrl) && (
                <button onClick={reduceVideoToPip} style={{
                  background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                  border: "none", color: "white", width: 36, height: 36, borderRadius: "50%",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s",
                }} title="Réduire">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                  </svg>
                </button>
              )}
              {/* Close */}
              <button onClick={() => { setShowVideo(false); setPipVideoUrl(null); }} style={{
                background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                border: "none", color: "white", width: 36, height: 36, borderRadius: "50%",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, transition: "background 0.2s",
              }}>✕</button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Video PiP (picture-in-picture mini player) */}
      {videoPip && pipVideoUrl && (() => {
        const isEmbed = /vimeo\.com|youtu/.test(pipVideoUrl);
        const pipW = isMobile ? 200 : 320;
        const pipH = Math.round(pipW / pipVideoRatio);
        return (
          <div style={{
            position: "absolute",
            bottom: isMobile ? navBarHeight + 10 : 24,
            right: isMobile ? 8 : 24,
            zIndex: 25,
            width: pipW,
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
            background: "black",
            transition: "all 0.3s ease",
          }}>
            {isEmbed ? (
              <div style={{ position: "relative", width: pipW, height: pipH }}>
                <iframe
                  ref={videoIframeRef}
                  src={getEmbedUrl(pipVideoUrl)}
                  width={pipW}
                  height={pipH}
                  style={{ border: "none", display: "block" }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <video
                src={pipVideoUrl}
                autoPlay
                controls
                style={{ width: "100%", display: "block" }}
              />
            )}
            {/* Top-right buttons: expand + close */}
            <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4 }}>
              <button onClick={() => { pauseAudio(); setVideoPip(false); setShowVideo(true); }} style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
                border: "none", color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }} title="Agrandir">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>
                </svg>
              </button>
              <button onClick={() => { setVideoPip(false); setPipVideoUrl(null); }} style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
                border: "none", color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
              }}>✕</button>
            </div>
          </div>
        );
      })()}

      {/* Hotspot preview — rendu React via postMessage depuis KRpano */}
      {hsPreview && !isMobile && (
        // Wrapper de positionnement (ne joue pas d'animation pour éviter conflit transform)
        <div style={{
          position: "absolute",
          left: hsPreview.x,
          top: hsPreview.y,
          transform: "translate(-50%, -50%)",
          zIndex: 15,
          pointerEvents: "none",
        }}>
          {/* Wrapper d'animation — remonte de zéro depuis le centre du hotspot */}
          <div className="hs-preview-enter" style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}>
            <div style={{
              width: 130, height: 130,
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.95)",
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(0,0,0,0.65)",
              flexShrink: 0,
              background: "rgba(10,20,40,0.75)",
            }}>
              {hsPreview.thumburl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hsPreview.thumburl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
            </div>
            <span style={{
              color: "white", fontSize: 12, fontWeight: 700,
              fontFamily: "'Inter', Arial, sans-serif",
              textShadow: "0 2px 6px rgba(0,0,0,0.9)",
              whiteSpace: "nowrap",
              background: "rgba(0,0,0,0.42)",
              borderRadius: 16, padding: "3px 10px",
            }}>
              {hsPreview.title}
            </span>
          </div>
        </div>
      )}

      {/* Floating waveform audio player — bas droite, niveau barre de nav */}
      {showSceneAudio && audioPlayingScene !== null && (() => {
        const audioScene = sortedScenes.find(s => s.data.nom_scene_krpano === audioPlayingScene);
        const audioSceneTitle = audioPlayingLabel || audioScene?.data.title || "";
        const pct = audioDuration ? (audioTime / audioDuration) * 100 : 0;
        const isPlaying = audioPlaying;
        return (
        <div style={{
          position: "absolute",
          bottom: isMobile ? navBarHeight + 8 : "max(env(safe-area-inset-bottom, 0px) + 10px, 18px)",
          ...(isMobile
            ? { left: "50%", transform: "translateX(-50%)" }
            : { right: 24 }),
          zIndex: 8,
          display: "flex", flexDirection: "column", alignItems: isMobile ? "center" : "flex-start",
          padding: "8px 14px 8px 10px",
          width: isMobile ? "min(calc(100vw - 48px), 300px)" : 280,
        }}>
          {/* Nom de la scène */}
          {audioSceneTitle && (
            <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.55)", margin: "0 0 5px", letterSpacing: 0.6, textTransform: "uppercase", whiteSpace: "nowrap" }}>
              {audioSceneTitle}
            </p>
          )}

          {/* Ligne de contrôles */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Play / Pause */}
            <button onClick={toggleCurrentAudio} style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              background: "transparent", border: "2px solid rgba(255,255,255,0.55)",
              color: "white", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {isPlaying
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
              }
            </button>

            {/* Waveform bars */}
            <div style={{ display: "flex", alignItems: "center", gap: 3, height: 28 }}>
              {[
                { dur: "0.7s", del: "0.0s" }, { dur: "0.5s", del: "0.1s" },
                { dur: "0.9s", del: "0.2s" }, { dur: "0.6s", del: "0.05s" },
                { dur: "0.8s", del: "0.15s" }, { dur: "0.5s", del: "0.25s" },
                { dur: "1.0s", del: "0.0s" }, { dur: "0.7s", del: "0.1s" },
                { dur: "0.6s", del: "0.3s" }, { dur: "0.9s", del: "0.05s" },
                { dur: "0.5s", del: "0.2s" }, { dur: "0.8s", del: "0.15s" },
                { dur: "0.7s", del: "0.0s" }, { dur: "0.6s", del: "0.1s" },
                { dur: "1.0s", del: "0.25s" }, { dur: "0.5s", del: "0.05s" },
                { dur: "0.9s", del: "0.2s" }, { dur: "0.7s", del: "0.1s" },
                { dur: "0.6s", del: "0.3s" }, { dur: "0.8s", del: "0.0s" },
              ].map((b, i) => (
                <div key={i} style={{
                  width: 3, height: "100%",
                  background: "rgba(255,255,255,0.82)", borderRadius: 2,
                  transformOrigin: "bottom",
                  transform: isPlaying ? undefined : "scaleY(0.25)",
                  animation: isPlaying ? `waveBar ${b.dur} ${b.del} ease-in-out infinite alternate` : "none",
                }} />
              ))}
            </div>

            {/* Fermer */}
            <button onClick={() => { pauseAudio(); setShowSceneAudio(false); setAudioPlayingScene(null); }}
              style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: "rgba(255,255,255,0.12)", border: "none",
                color: "rgba(255,255,255,0.7)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
              }}
            >✕</button>
          </div>

          {/* Barre de progression */}
          <div style={{ marginTop: 7, width: "100%" }}>
            <div
              onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seekAudio((e.clientX - r.left) / r.width); }}
              style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.18)", cursor: "pointer", position: "relative" }}
            >
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "rgba(255,255,255,0.88)", borderRadius: 2, transition: "width 0.3s linear" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 3, fontWeight: 600 }}>
              <span>{formatTime(audioTime)}</span>
              <span>{formatTime(audioDuration)}</span>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Menu drawer — slide in from right, works mobile + desktop */}
      {/* Backdrop */}
      {showFullMenu && (
        <div
          onClick={() => { setShowFullMenu(false); setMenuSection(null); }}
          style={{ position: "absolute", inset: 0, zIndex: 24, background: "rgba(10,14,20,0.45)", backdropFilter: "blur(2px)" }}
        />
      )}
      <div
        onTouchStart={(e) => { swipeStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { if (e.changedTouches[0].clientX - swipeStartX.current > 52) { setShowFullMenu(false); setMenuSection(null); } }}
        style={{
        position: "absolute", top: isMobile ? 0 : 20, right: 0, bottom: isMobile ? 0 : 20, zIndex: 25,
        width: isMobile ? "100vw" : 420,
        maxWidth: isMobile ? "none" : 460,
        background: "#F7F5F2",
        boxShadow: "-8px 0 48px rgba(0,0,0,0.22)",
        display: "flex", flexDirection: "column",
        transform: showFullMenu ? "translateX(0)" : "translateX(calc(100% + 2px))",
        transition: "transform 0.48s cubic-bezier(0.32, 0.72, 0, 1)",
        borderRadius: isMobile ? 0 : "20px 0 0 20px",
        overflow: "hidden",
      }}>
        {/* Drawer header */}
        <div style={{
          flexShrink: 0, padding: "22px 24px 16px",
          borderBottom: "1px solid rgba(45,62,80,0.1)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#8b1c1c", textTransform: "uppercase", margin: "0 0 3px" }}>
              {t("virtual_tour")}
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2332", margin: 0, fontFamily: "'Inter', sans-serif", lineHeight: 1.15 }}>
              {t("church_name")}
            </h2>
          </div>
          <button onClick={() => { setShowFullMenu(false); setMenuSection(null); }} style={{
            width: 38, height: 38, borderRadius: "50%", border: "none",
            background: "rgba(45,62,80,0.08)", cursor: "pointer", color: "#5a6776",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 10, WebkitOverflowScrolling: "touch" as const }}>

          {/* — Hero : reprendre la visite — */}
          <button onClick={() => { setShowFullMenu(false); setMenuSection(null); }} style={{
            position: "relative", width: "100%", height: 160, borderRadius: 20,
            overflow: "hidden", border: "none", cursor: "pointer", textAlign: "left", flexShrink: 0, minHeight: 160,
          }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "url(/images/menu/Orgue_choeur.jpg)", backgroundSize: "cover", backgroundPosition: "center" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.08) 60%)" }} />
            <span style={{ position: "absolute", top: 14, left: 14, background: "rgba(26,50,80,0.92)", color: "white", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 16, letterSpacing: 0.5 }}>
              {t("guided_visit")}
            </span>
            <div style={{ position: "absolute", bottom: 14, left: 16, right: 52 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "white", margin: 0, fontFamily: "'Inter', sans-serif" }}>{t("resume_visit")}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.72)", margin: "2px 0 0" }}>{currentScene?.data.title || t("visit_fallback")}</p>
            </div>
            <div style={{ position: "absolute", bottom: 12, right: 14, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.22)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </button>

          {/* — Soutenir ce projet — */}
          <button
            onClick={() => { setShowFullMenu(false); setMenuSection(null); setActivePopup("don"); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              padding: "16px 18px", borderRadius: 16, border: "none", cursor: "pointer",
              background: "rgba(139,28,28,0.07)", textAlign: "left",
              transition: "background 0.2s", flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, background: "#8b1c1c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1a2332", margin: 0 }}>{t("support_project")}</p>
                <p style={{ fontSize: 11, color: "#8a96a3", margin: "2px 0 0" }}>{t("donate_online")}</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b1c1c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          {/* — Prier et acheter un cierge — */}
          <button
            onClick={() => { setShowFullMenu(false); setMenuSection(null); setActivePopup("don"); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              padding: "16px 18px", borderRadius: 16, border: "none", cursor: "pointer",
              background: "rgba(217,119,6,0.07)", textAlign: "left",
              transition: "background 0.2s", flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, background: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
                  <path d="M12 2c0 0-3.5 3.5-3.5 6.8a3.5 3.5 0 0 0 7 0C15.5 5.5 12 2 12 2z"/>
                  <rect x="11.2" y="9.2" width="1.6" height="3.8" rx="0.8"/>
                  <rect x="8" y="13" width="8" height="9" rx="1.5"/>
                </svg>
              </span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1a2332", margin: 0 }}>{t("pray_candle")}</p>
                <p style={{ fontSize: 11, color: "#8a96a3", margin: "2px 0 0" }}>{t("pray_candle_sub")}</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          {/* — Informations pratiques — */}
          <MenuAccordion
            open={menuSection === "info"}
            onToggle={() => setMenuSection(menuSection === "info" ? null : "info")}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>}
            label={t("info_pratiques")}
            iconColor="#1a3250"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
              <InfoRow icon="🕐" label={t("info_hours_label")} value={t("info_hours_value")} href="https://rouen.catholique.fr/diocese/paroisses/paroisses-du-doyenne-de-rouen-nord/paroisse-dame-de-rouen-centre/" />
              <InfoRow icon="⛪" label={t("info_mass_label")} value={t("info_mass_value")} href="https://rouen.catholique.fr/diocese/paroisses/paroisses-du-doyenne-de-rouen-nord/paroisse-dame-de-rouen-centre/" />
              <InfoRow icon="📍" label={t("info_address_label")} value={t("info_address_value")} />
              <InfoRow icon="🚇" label={t("info_access_label")} value={t("info_access_value")} />
              <InfoRow icon="♿" label={t("info_accessibility_label")} value={t("info_accessibility_value")} />
            </div>
          </MenuAccordion>

          {/* — Autres églises — */}
          <MenuAccordion
            open={menuSection === "churches"}
            onToggle={() => setMenuSection(menuSection === "churches" ? null : "churches")}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="5"/><line x1="10.5" y1="3.5" x2="13.5" y2="3.5"/><polyline points="4,11 12,6 20,11"/><rect x="4" y="11" width="16" height="11"/><path d="M10 22v-5a2 2 0 0 1 4 0v5"/></svg>}
            label={t("visit_churches")}
            iconColor="#1a3250"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { name: "Église Sainte-Jeanne-d'Arc", city: "Rouen", url: "https://saintejeannedarc.juumo.fr", preview: "/images/churches/sainte-jeanne-darc.jpg", available: true },
                { name: "Église Saint-Maclou", city: "Rouen", url: "https://saintmaclou.juumo.fr", preview: "/images/churches/saint-maclou.jpg", available: true },
                { name: "Église Saint-Gervais", city: "Rouen", url: null, preview: "/vtour/panos/Vue_cathedrale.tiles/preview.jpg", available: false },
              ].map((c) => {
                const inner = (
                  <>
                    <div style={{ width: 46, height: 46, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#ddd", filter: c.available ? "none" : "grayscale(60%) opacity(0.6)" }}>
                      <div style={{ width: "100%", height: "100%", backgroundImage: `url(${c.preview})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: c.available ? "#1a2332" : "#8a96a3", margin: 0, fontFamily: "'Inter', sans-serif" }}>{c.name}</p>
                      <p style={{ fontSize: 11, color: "#8a96a3", margin: "2px 0 0" }}>
                        {c.available ? c.city : <span style={{ background: "rgba(45,62,80,0.1)", color: "#6b7d8e", borderRadius: 6, padding: "1px 7px", fontSize: 10, fontWeight: 600 }}>Bientôt disponible</span>}
                      </p>
                    </div>
                    {c.available && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa5b1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>}
                  </>
                );
                const commonStyle: React.CSSProperties = {
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 14,
                  background: "rgba(45,62,80,0.04)", border: "1px solid rgba(45,62,80,0.08)",
                };
                return c.available ? (
                  <a key={c.name} href={c.url!} target="_blank" rel="noopener noreferrer" style={{ ...commonStyle, textDecoration: "none" }}>{inner}</a>
                ) : (
                  <div key={c.name} style={commonStyle}>{inner}</div>
                );
              })}
            </div>
          </MenuAccordion>

          {/* — Partenaires — */}
          <MenuAccordion
            open={menuSection === "partners"}
            onToggle={() => setMenuSection(menuSection === "partners" ? null : "partners")}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
            label={t("partners")}
            iconColor="#1a3250"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Catho Rouen — 1er */}
              <a href="https://www.cathorouen.org/" target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 14, textDecoration: "none",
                background: "rgba(45,62,80,0.04)", border: "1px solid rgba(45,62,80,0.08)",
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src="/images/partners/catho-rouen.png" alt="Catho Rouen" style={{ width: 44, height: 44, objectFit: "contain" }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2332", margin: 0 }}>Catho Rouen</p>
                </div>
              </a>

              {/* Élodie — 2e */}
              <a href="https://elodieguidelocal.fr/" target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 14, textDecoration: "none",
                background: "rgba(45,62,80,0.04)", border: "1px solid rgba(45,62,80,0.08)",
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#fff8f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src="/images/partners/elodie.svg" alt="Élodie Guide Local" style={{ width: 44, height: 44, objectFit: "contain" }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2332", margin: 0 }}>Élodie – Guide Local</p>
                  <p style={{ fontSize: 11, color: "#8a96a3", margin: "2px 0 0" }}>{t("partner_elodie_role")}</p>
                </div>
              </a>

              {/* Juumo — 3e */}
              <a href="https://juumo.fr" target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 14, textDecoration: "none",
                background: "rgba(45,62,80,0.04)", border: "1px solid rgba(45,62,80,0.08)",
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src="/images/partners/juumo.png" alt="Juumo" style={{ width: 44, height: 44, objectFit: "contain" }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2332", margin: 0 }}>Juumo</p>
                  <p style={{ fontSize: 11, color: "#8a96a3", margin: "2px 0 0" }}>{t("partner_juumo_role")}</p>
                </div>
              </a>

              {/* CTA rejoindre */}
              <a href="mailto:contact@juumo.fr?subject=Rejoindre le projet Saint-Godard" style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", borderRadius: 14, textDecoration: "none",
                background: "rgba(26,50,80,0.07)",
                marginTop: 4,
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "#1a3250", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2332", margin: 0 }}>{t("join_project")}</p>
                  <p style={{ fontSize: 11, color: "#8a96a3", margin: "2px 0 0" }}>{t("join_project_sub")}</p>
                </div>
              </a>
            </div>
          </MenuAccordion>

          {/* Footer */}
          <div style={{ marginTop: 6, textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#b0b8c4", margin: 0 }}>
              {t("made_by")}{" "}
              <a href="https://juumo.fr" target="_blank" rel="noopener noreferrer" style={{ color: "#2D3E50", fontWeight: 700, textDecoration: "none" }}>Juumo</a>
            </p>
          </div>
        </div>
      </div>

      {/* Hidden audio element for playback */}
      <audio
        ref={audioRef}
        style={{ display: "none" }}
        onTimeUpdate={() => setAudioTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration || 0)}
        onEnded={() => { setAudioPlaying(false); audioPlayingRef.current = false; setAudioPlayingScene(null); setAudioTime(0); }}
      />

      {/* Popup Don — soutenir le lieu */}
      <div style={{
        position: "absolute", bottom: isMobile ? navBarHeight : "calc(max(env(safe-area-inset-bottom, 0px) + 10px, 18px) + 54px)", left: "50%", transform: "translateX(-50%)",
        zIndex: 9,
        width: isMobile ? "calc(100vw - 24px)" : "min(460px, calc(100vw - 32px))", maxWidth: isMobile ? 400 : 460,
        height: isMobile ? "65svh" : 446, overflow: "hidden", pointerEvents: "none",
      }}>
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            transform: activePopup === "don" ? `translateY(${swipeDeltaY}px)` : "translateY(115%)",
            transition: swipeDeltaY > 0 ? "none" : "transform 0.55s cubic-bezier(0.32, 0.72, 0, 1)",
            pointerEvents: activePopup === "don" ? "auto" : "none",
          }}
          onTouchStart={onDrawerTouchStart}
          onTouchMove={onDrawerTouchMove}
          onTouchEnd={(e) => onDrawerTouchEnd(e)}
          onTouchCancel={() => { setSwipeDeltaY(0); swipeDir.current = null; }}
        >
          <div style={{
            background: "rgba(255,252,248,0.94)", backdropFilter: "blur(20px)",
            borderRadius: "24px 24px 0 0",
            boxShadow: "0 -6px 32px rgba(0,0,0,0.18)",
            padding: "10px 22px 28px",
            display: "flex", flexDirection: "column", gap: 10,
            position: "relative",
          }}>
            {/* Pill drag handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(45,62,80,0.18)", margin: "0 auto 6px", flexShrink: 0 }} />
            <button onClick={() => setActivePopup(null)} style={{
              position: "absolute", top: 20, right: 16,
              background: "rgba(45,62,80,0.08)", border: "none", fontSize: 12, cursor: "pointer", color: "#6b7d8e",
              width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#8b1c1c", textTransform: "uppercase", margin: "0 0 4px" }}>
                {t("donation_label")}
              </p>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1a2332", margin: 0, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", paddingRight: 34 }}>
                {t("donation_title")}
              </h2>
            </div>

            {donView === "main" ? (<>
            {/* Option 1 — Don : lien SumUp direct */}
            <DonOption
              accent="#8b1c1c"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
              title={t("donation_option1_title")}
              desc={t("donation_option1_desc")}
              cta={t("donation_option1_cta")}
              href={SUMUP_URL}
            />

            {/* Option 2 — Cierge : ouvre le mini-formulaire (e-mails + paiement) */}
            <DonOption
              accent="#D97706"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
                  {/* Flamme */}
                  <path d="M12 2c0 0-3.5 3.5-3.5 6.8a3.5 3.5 0 0 0 7 0C15.5 5.5 12 2 12 2z"/>
                  {/* Mèche */}
                  <rect x="11.2" y="9.2" width="1.6" height="3.8" rx="0.8"/>
                  {/* Corps de la bougie */}
                  <rect x="8" y="13" width="8" height="9" rx="1.5"/>
                </svg>
              }
              title={t("donation_option2_title")}
              desc={t("donation_option2_desc")}
              cta={t("donation_option2_cta")}
              onClick={() => setDonView("cierge")}
            />
            </>) : (
            /* ——— Formulaire cierge ——— */
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <button onClick={() => setDonView("main")} style={{
                alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 5,
                background: "transparent", border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, color: "#8a96a3", padding: 0,
                fontFamily: "'Inter', sans-serif",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                {t("cierge_back")}
              </button>

              {ciergeStatus === "done" ? (
                <p style={{ fontSize: 13, lineHeight: 1.65, color: "#22913c", margin: 0, fontWeight: 600 }}>
                  🕯️ {t("cierge_done")}
                </p>
              ) : (<>
                <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "#5a6577", margin: 0 }}>
                  🕯️ {t("cierge_note")}
                </p>
                <input
                  type="email"
                  value={ciergeEmail}
                  onChange={(e) => setCiergeEmail(e.target.value)}
                  placeholder={t("cierge_email")}
                  style={{
                    padding: "11px 14px", borderRadius: 12, fontSize: 16,
                    border: "1px solid rgba(45,62,80,0.18)", background: "white",
                    outline: "none", fontFamily: "'Inter', sans-serif", color: "#1a2332",
                  }}
                />
                <input
                  type="text"
                  value={ciergeName}
                  onChange={(e) => setCiergeName(e.target.value)}
                  placeholder={t("cierge_name")}
                  style={{
                    padding: "11px 14px", borderRadius: 12, fontSize: 16,
                    border: "1px solid rgba(45,62,80,0.18)", background: "white",
                    outline: "none", fontFamily: "'Inter', sans-serif", color: "#1a2332",
                  }}
                />
                <textarea
                  value={ciergeIntent}
                  onChange={(e) => setCiergeIntent(e.target.value)}
                  placeholder={t("cierge_intent")}
                  rows={2}
                  style={{
                    padding: "11px 14px", borderRadius: 12, fontSize: 16,
                    border: "1px solid rgba(45,62,80,0.18)", background: "white",
                    outline: "none", fontFamily: "'Inter', sans-serif", color: "#1a2332",
                    resize: "none",
                  }}
                />
                {ciergeStatus === "error" && (
                  <p style={{ fontSize: 12, color: "#8b1c1c", margin: 0 }}>
                    {t("cierge_error")}{" "}
                    <a href={SUMUP_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#8b1c1c", fontWeight: 700 }}>SumUp</a>
                  </p>
                )}
                <button
                  onClick={submitCierge}
                  disabled={ciergeStatus === "sending" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ciergeEmail.trim())}
                  style={{
                    padding: "13px 16px", borderRadius: 14, border: "none",
                    background: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ciergeEmail.trim()) && ciergeStatus !== "sending" ? "#D97706" : "rgba(45,62,80,0.15)",
                    color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Inter', sans-serif", transition: "background 0.2s",
                  }}
                >
                  {ciergeStatus === "sending" ? "…" : t("cierge_submit")}
                </button>
              </>)}
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Popup Chat — questions sur Saint-Godard (non rendu si chatbot inactif) */}
      {juumiStatus.active && (
      <div style={{
        position: "absolute", bottom: isMobile ? navBarHeight : "calc(max(env(safe-area-inset-bottom, 0px) + 10px, 18px) + 54px)", left: "50%", transform: "translateX(-50%)",
        zIndex: 9,
        width: isMobile ? "calc(100vw - 24px)" : "min(460px, calc(100vw - 32px))", maxWidth: isMobile ? 400 : 460,
        height: isMobile ? "60svh" : 440, overflow: "hidden", pointerEvents: "none",
      }}>
        <div
          style={{
            // Même structure que le popup don : ancré en bas, taille = contenu.
            // (height 100% + flex-end créait une zone tactile invisible au-dessus
            // de la carte qui avalait les taps sur mobile)
            position: "absolute", bottom: 0, left: 0, right: 0,
            transform: activePopup === "chat" ? `translateY(${swipeDeltaY}px)` : "translateY(115%)",
            transition: swipeDeltaY > 0 ? "none" : "transform 0.55s cubic-bezier(0.32, 0.72, 0, 1)",
            pointerEvents: activePopup === "chat" ? "auto" : "none",
          }}
          onTouchStart={onDrawerTouchStart}
          onTouchMove={onDrawerTouchMove}
          onTouchEnd={(e) => onDrawerTouchEnd(e)}
          onTouchCancel={() => { setSwipeDeltaY(0); swipeDir.current = null; }}
        >
          <div style={{
            background: "rgba(255,252,248,0.94)", backdropFilter: "blur(20px)",
            borderRadius: "24px 24px 0 0",
            boxShadow: "0 -6px 32px rgba(0,0,0,0.18)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            {/* Pill drag handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(45,62,80,0.18)", margin: "10px auto 0", flexShrink: 0 }} />
            {/* Header */}
            <div style={{ padding: "10px 20px 12px", flexShrink: 0, position: "relative", borderBottom: "1px solid rgba(45,62,80,0.08)" }}>
              <button onClick={() => setActivePopup(null)} style={{
                position: "absolute", top: 8, right: 16,
                background: "rgba(45,62,80,0.08)", border: "none", fontSize: 12, cursor: "pointer", color: "#6b7d8e",
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#8b1c1c", textTransform: "uppercase", margin: 0 }}>
                {t("ai_assistant")}
              </p>
              <h2 style={{ fontSize: 21, fontWeight: 700, color: "#1a2332", margin: "4px 0 0", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", paddingRight: 34, lineHeight: 1.15 }}>
                {t("chat_title")}
              </h2>
            </div>

            {/* Conversation — bulles multi-tours + suggestions (style saint-maclou) */}
            <div ref={chatScrollRef} onClick={onChatLinkClick} style={{
              overflowY: "auto", maxHeight: isMobile ? "calc(60svh - 170px)" : 270,
              padding: "14px 18px", WebkitOverflowScrolling: "touch" as const,
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              {chatMessages.length === 0 && !chatStreaming && (
                <p style={{ fontSize: 13, lineHeight: 1.65, color: "#6b7d8e", margin: 0 }}>
                  {t("chat_intro")}
                </p>
              )}
              {chatMessages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    background: m.role === "user" ? "#2D3E50" : "rgba(45,62,80,0.06)",
                    color: m.role === "user" ? "white" : "#2a3a4a",
                    padding: "9px 13px",
                    borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    fontSize: 13, lineHeight: 1.6,
                  }}
                  dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(m.content) }}
                />
              ))}
              {chatStreaming && (
                <div
                  style={{
                    alignSelf: "flex-start", maxWidth: "85%",
                    background: "rgba(45,62,80,0.06)", color: "#2a3a4a",
                    padding: "9px 13px", borderRadius: "14px 14px 14px 4px",
                    fontSize: 13, lineHeight: 1.6,
                  }}
                  dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(chatStreaming) }}
                />
              )}
              {chatLoading && !chatStreaming && (
                <div style={{ alignSelf: "flex-start", color: "#8a96a3", fontSize: 13, fontStyle: "italic" }}>
                  {t("chat_thinking")}…
                </div>
              )}
              {chatSuggestions.length > 0 && !chatLoading && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                  {chatSuggestions.map((sg, i) => (
                    <button
                      key={i}
                      onClick={() => sendChatMessage(sg)}
                      style={{
                        padding: "6px 12px", borderRadius: 16,
                        border: "1px solid rgba(139,28,28,0.25)",
                        background: "rgba(139,28,28,0.06)", color: "#8b1c1c",
                        fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                        fontFamily: "'Inter', sans-serif", textAlign: "left",
                      }}
                    >
                      {sg}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Saisie (style saint-maclou : input + bouton rond séparé) */}
            <div style={{
              flexShrink: 0, padding: "10px 14px 28px",
              display: "flex", gap: 8,
              borderTop: "1px solid rgba(45,62,80,0.08)",
            }}>
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendChatMessage(); }}
                placeholder={t("chat_placeholder")}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: 22,
                  border: "1px solid rgba(45,62,80,0.15)", background: "white",
                  fontSize: 16, outline: "none",
                  fontFamily: "'Inter', sans-serif", color: "#1a2332",
                }}
              />
              <button
                onClick={() => sendChatMessage()}
                disabled={!chatInput.trim() || chatLoading}
                style={{
                  width: 44, height: 44, borderRadius: "50%", border: "none", flexShrink: 0,
                  background: chatInput.trim() && !chatLoading ? "#8b1c1c" : "rgba(45,62,80,0.15)",
                  color: "white",
                  cursor: chatInput.trim() && !chatLoading ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Barre du bas — parcours + scène */}
      <div ref={barRef} style={{
        position: "absolute",
        bottom: isMobile ? 0 : "max(env(safe-area-inset-bottom, 0px) + 10px, 18px)",
        left: isMobile ? 0 : "50%",
        right: isMobile ? 0 : "auto",
        transform: isMobile ? "none" : "translateX(-50%)",
        zIndex: 10,
        width: isMobile ? "auto" : "calc(100vw - 16px)",
        maxWidth: isMobile ? "none" : 620,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: isMobile ? 6 : 9,
        padding: isMobile ? "6px 0 0" : 0,
      }}>
        {/* (mini lecteur déplacé en floating bas-droite) */}

        {/* Bulle proactive Juumi — message contextuel une fois par session */}
        {juumiStatus.active && showJuumiTeaser && activePopup === null && (
          <div
            onClick={() => {
              if (typeof window !== "undefined") window._paq?.push(["trackEvent", "Chatbot", "open_source", "teaser"]);
              dismissJuumiTeaser();
              togglePopup("chat");
            }}
            style={{
              position: "absolute", bottom: "calc(100% + 12px)",
              right: isMobile ? 8 : 40,
              maxWidth: 260,
              background: "rgba(255,252,248,0.98)", color: "#1a2332",
              borderRadius: "16px 16px 4px 16px", padding: "11px 30px 11px 14px",
              boxShadow: "0 8px 28px rgba(0,0,0,0.3)",
              fontSize: 12.5, lineHeight: 1.5, cursor: "pointer", zIndex: 11,
              fontFamily: "'Inter', sans-serif",
              animation: "sjdaHintIn 0.45s cubic-bezier(0.34,1.4,0.64,1) both",
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); dismissJuumiTeaser(); }}
              aria-label="Fermer"
              style={{
                position: "absolute", top: 5, right: 7,
                background: "transparent", border: "none", cursor: "pointer",
                color: "#b0b8c4", fontSize: 12, padding: 2,
              }}
            >✕</button>
            <span style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#2D3E50", color: "white", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>J</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#8b1c1c" }}>{t("juumi_teaser_name")}</span>
            </span>
            {t("juumi_teaser_before")} <b>{currentScene?.data.title || t("visit_fallback")}</b> {t("juumi_teaser_after")}
          </div>
        )}

        {/* Coach-mark 1ère visite — pointe le titre de scène (jamais par-dessus un popup) */}
        {showTitleHint && activePopup === null && (
          <div
            onClick={() => togglePopup("scene")}
            style={{
              position: "absolute", bottom: "calc(100% + 14px)", left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(255,252,248,0.97)", backdropFilter: "blur(10px)",
              border: "1px solid rgba(245,158,11,0.4)",
              color: "#1a2332", fontSize: 12.5, fontWeight: 600,
              padding: "9px 15px", borderRadius: 14,
              display: "flex", alignItems: "center", gap: 7,
              whiteSpace: "nowrap", cursor: "pointer", zIndex: 11,
              boxShadow: "0 6px 24px rgba(0,0,0,0.28)",
              animation: "sjdaHintIn 0.5s ease both, sjdaHintBob 1.8s ease-in-out 0.5s infinite",
            }}
          >
            <span style={{ color: "#F59E0B" }}>✦</span>
            {t(isMobile ? "scene_hint_touch" : "scene_hint")}
            {/* Caret vers la barre */}
            <span style={{
              position: "absolute", top: "100%", left: "50%",
              transform: "translateX(-50%)",
              borderLeft: "7px solid transparent", borderRight: "7px solid transparent",
              borderTop: "7px solid rgba(255,252,248,0.97)",
            }} />
            <style>{`
              @keyframes sjdaHintIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
              @keyframes sjdaHintBob { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-5px); } }
            `}</style>
          </div>
        )}

        {/* Progression du parcours — masquée dès qu'un panneau est ouvert :
            les points flottent au-dessus du popup et recouvraient le texte */}
        <div style={{
          display: activePopup !== null ? "none" : "flex", gap: 5, alignItems: "center",
          maxWidth: "100%", overflowX: "auto",
          WebkitOverflowScrolling: "touch" as const, scrollbarWidth: "none" as const,
          padding: activePopup !== null ? "4px 10px" : "0 2px",
          background: activePopup !== null ? "rgba(255,252,248,0.88)" : "transparent",
          backdropFilter: activePopup !== null ? "blur(12px)" : "none",
          borderRadius: 12,
          transition: "background 0.35s ease",
        }}>
          {sortedScenes.map((s, i) => (
            <button
              key={s.id}
              onClick={() => changeScene(s.data.nom_scene_krpano!)}
              title={s.data.title}
              style={{
                width: 6, height: 6, borderRadius: "50%",
                border: "none", padding: 0, cursor: "pointer", flexShrink: 0,
                background: i === currentIndex
                  ? (activePopup !== null ? "#2D3E50" : "#ffffff")
                  : (activePopup !== null ? "rgba(45,62,80,0.28)" : "rgba(255,255,255,0.45)"),
                transition: "all 0.35s cubic-bezier(0.32,0.72,0,1)",
              }}
            />
          ))}
        </div>

        {/* Barre — navigation parcours + titre + actions */}
        <div
          ref={navBarRef}
          onTouchStart={(e) => { swipeStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - swipeStartX.current;
            if (Math.abs(dx) > 40) { if (dx < 0) goNext(); else goPrev(); }
          }}
          style={{
          display: "flex", alignItems: "center", gap: isMobile ? 2 : 3, width: "100%",
          background: "rgba(255,252,248,0.97)", backdropFilter: "blur(16px)",
          borderRadius: isMobile ? "20px 20px 0 0" : 22,
          padding: isMobile ? `8px 6px calc(env(safe-area-inset-bottom, 0px) + 8px)` : "6px 8px",
          boxShadow: isMobile ? "0 -4px 24px rgba(0,0,0,0.13)" : "0 8px 32px rgba(0,0,0,0.16)",
        }}>
          {/* Précédent */}
          <BarButton
            ariaLabel="Scène précédente"
            onClick={goPrev}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>}
          />

          {/* Titre de la scène — ouvre le popup */}
          <button
            onClick={() => togglePopup("scene")}
            style={{
              flex: 1, minWidth: 0, border: "none", cursor: "pointer",
              background: activePopup === "scene"
                ? "rgba(45,62,80,0.12)"
                : isMobile
                  ? "rgba(45,62,80,0.07)"
                  : "transparent",
              borderRadius: 14, padding: isMobile ? "7px 3px" : "8px 12px",
              display: "flex", alignItems: "center", gap: isMobile ? 4 : 7,
              transition: "background 0.2s ease",
            }}
          >
            {/* Titre centré + icônes collées */}
            <span style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 0, overflow: "hidden" }}>
              <span style={{
                fontSize: isMobile ? 12 : 14.5, fontWeight: 700, color: "#1a2332",
                fontFamily: "'Inter', sans-serif",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {isMobile
                  ? t("read_more")
                  : (currentScene?.data.title || t("visit_fallback"))}
              </span>
              {/* Indicateurs média — desktop uniquement : illisibles/incompréhensibles sur mobile */}
              {!isMobile && <MediaIcons scene={currentScene} />}
            </span>
            {/* Compteur masqué en variante A mobile : les points de progression
                juste au-dessus portent déjà l'information, et la pilule a besoin
                de la place pour afficher son libellé complet */}
            {!isMobile && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: "#9aa5b1", flexShrink: 0 }}>
                {currentIndex + 1}/{totalScenes}
              </span>
            )}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9aa5b1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>

          {/* Suivant */}
          <BarButton
            ariaLabel="Scène suivante"
            onClick={goNext}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>}
          />

          <div style={{ display: isMobile ? "none" : "block", width: 1, height: 24, background: "rgba(45,62,80,0.12)", flexShrink: 0, margin: "0 2px" }} />

          {/* Pilule chat — libellé explicite (la loupe seule n'était pas comprise) — non rendue si chatbot inactif */}
          {juumiStatus.active && (
          <button
            aria-label="Poser une question"
            onClick={() => {
              if (typeof window !== "undefined") window._paq?.push(["trackEvent", "Chatbot", "open_source", "pill"]);
              togglePopup("chat");
            }}
            style={{
              display: "flex", alignItems: "center", gap: isMobile ? 4 : 6, flexShrink: 0,
              background: activePopup === "chat" ? "#2D3E50" : "linear-gradient(145deg, #F5B84B, #E8890B)",
              color: "white", border: "none", borderRadius: 999,
              padding: isMobile ? "9px 9px" : "10px 14px",
              fontSize: isMobile ? 11 : 12, fontWeight: 700, fontFamily: "'Inter', sans-serif",
              cursor: "pointer", whiteSpace: "nowrap",
              boxShadow: activePopup === "chat" ? "none" : "0 2px 10px rgba(232,137,11,0.4)",
              transition: "background 0.2s ease",
            }}
          >
            <span style={{ fontSize: 11 }}>✦</span>
            {t("chat_pill")}
          </button>
          )}

          {/* Don */}
          <BarButton
            ariaLabel="Faire un don"
            onClick={() => togglePopup("don")}
            active={activePopup === "don"}
            accent="#8b1c1c"
            label="DON"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill={activePopup === "don" ? "white" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
          />
        </div>
      </div>

      {/* Crédit Juumo — texte discret bas droite, UTM marketing conservé.
          Desktop uniquement : sur mobile il chevauche la barre pleine largeur
          et fait doublon avec "Une réalisation Juumo" du menu. */}
      {!isMobile && (
        <div style={{ position: "fixed", bottom: 6, right: 12, zIndex: 200, display: "flex", gap: 14 }}>
          <a
            href="https://juumo.fr/?utm_source=visite360&utm_medium=badge&utm_campaign=saint-godard"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.38)",
              textDecoration: "none",
              letterSpacing: 0.3,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              transition: "color 0.2s",
              userSelect: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.72)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}
          >
            Réalisé par Juumo
          </a>
        </div>
      )}
    </div>
  );
}

function MediaIcon({ children, title }: { children: React.ReactNode; title: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        opacity: hovered ? 0.85 : 0.42,
        transform: hovered ? "scale(1.45)" : "scale(1)",
        transition: "opacity 0.18s ease, transform 0.18s ease",
        cursor: "default",
      }}
    >
      {children}
    </span>
  );
}

function MediaIcons({ scene }: { scene: SceneData | undefined }) {
  const hasText = !!(scene?.data.description?.[0]?.text || scene?.data.description_longue?.[0]?.text);
  const hasAudio = !!scene?.data.audio_file?.url;
  const hasVideo = !!(scene?.data.video_file?.url || scene?.data.video_url);
  if (!hasText && !hasAudio && !hasVideo) return null;
  return (
    <span style={{ display: "flex", gap: 3, alignItems: "center", flexShrink: 0, marginLeft: 15 }}>
      {hasText && (
        <MediaIcon title="Description">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#2D3E50" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/></svg>
        </MediaIcon>
      )}
      {hasAudio && (
        <MediaIcon title="Audio">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#2D3E50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
        </MediaIcon>
      )}
      {hasVideo && (
        <MediaIcon title="Vidéo">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="#2D3E50" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </MediaIcon>
      )}
    </span>
  );
}

function BarButton({ icon, onClick, active, accent, ariaLabel, label }: {
  icon: React.ReactNode; onClick: () => void; active?: boolean; accent?: string; ariaLabel: string; label?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const ac = accent || "#2D3E50";
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 38, height: label ? 44 : 38, borderRadius: 13, flexShrink: 0,
        border: "none", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: label ? 2 : 0,
        background: active ? ac : hovered ? "rgba(45,62,80,0.09)" : "transparent",
        color: active ? "white" : (accent || "#5a6776"),
        transition: "all 0.2s ease",
      }}
    >
      {icon}
      {label && (
        <span style={{
          fontSize: 7.5, fontWeight: 800, letterSpacing: 0.8,
          color: active ? "white" : (accent ?? "#8a96a3"),
          lineHeight: 1, fontFamily: "'Inter', sans-serif",
          transition: "color 0.2s ease",
        }}>
          {label}
        </span>
      )}
    </button>
  );
}

function DonOption({ icon, title, desc, cta, accent, href, onClick }: {
  icon: React.ReactNode; title: string; desc: string; cta: string; href?: string; accent: string;
  onClick?: () => void;
}) {
  const cardStyle: React.CSSProperties = {
    display: "flex", gap: 12, alignItems: "flex-start",
    padding: 14, borderRadius: 16,
    background: "rgba(45,62,80,0.035)",
    border: "1px solid rgba(45,62,80,0.1)",
    textAlign: "left", textDecoration: "none", cursor: "pointer",
    width: "100%",
  };
  const inner = (
    <>
      <span style={{
        width: 38, height: 38, borderRadius: 12, flexShrink: 0,
        background: accent, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1a2332", fontFamily: "'Inter', sans-serif", lineHeight: 1.25 }}>
          {title}
        </span>
        <span style={{ fontSize: 12, lineHeight: 1.5, color: "#5a6577" }}>
          {desc}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: accent, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
          {cta}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </span>
      </span>
    </>
  );
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" style={cardStyle}>{inner}</a>;
  return <button onClick={onClick} style={cardStyle}>{inner}</button>;
}

function ActionButton({ icon, label, onClick, active, visible }: {
  icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; visible?: boolean;
}) {
  if (visible === false) return null;
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 18px", border: "none", borderRadius: 14,
        background: active ? "#2D3E50" : "rgba(45,62,80,0.06)",
        color: active ? "white" : "#2D3E50",
        cursor: "pointer", fontFamily: "'Inter', sans-serif",
        fontSize: 13, fontWeight: 600, textAlign: "left",
        transition: "all 0.25s ease",
        width: "100%",
      }}
    >
      <span style={{ flexShrink: 0, opacity: 0.8 }}>{icon}</span>
      {label}
    </button>
  );
}

function HeaderButton({ children, onClick, active }: {
  children: React.ReactNode; onClick?: () => void; active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 42, height: 42, borderRadius: "50%",
        background: active ? "rgba(255,255,255,0.9)" : hovered ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.2)",
        color: active ? "#2D3E50" : "white",
        fontSize: 13, fontWeight: 600,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        transition: "all 0.25s ease",
        transform: hovered && !active ? "scale(1.08)" : "scale(1)",
      }}
    >
      {children}
    </button>
  );
}

function MenuAccordion({ open, onToggle, icon, label, children, iconColor }: {
  open: boolean; onToggle: () => void; icon: React.ReactNode; label: string; children: React.ReactNode;
  iconColor?: string;
}) {
  const bg = iconColor || "rgba(45,62,80,0.08)";
  const iconTextColor = iconColor ? "white" : "#2D3E50";
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(45,62,80,0.1)", background: "white", flexShrink: 0 }}>
      <button onClick={onToggle} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        width: "100%", padding: "15px 18px", border: "none", background: "transparent",
        cursor: "pointer", textAlign: "left",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: iconTextColor }}>
            {icon}
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1a2332", fontFamily: "'Inter', sans-serif" }}>{label}</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa5b1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.3s ease" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{ padding: "0 18px 16px", borderTop: "1px solid rgba(45,62,80,0.07)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#8a96a3", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", fontSize: 13, color: "#2D3E50", margin: "2px 0 0", lineHeight: 1.45, textDecoration: "underline", textUnderlineOffset: 3 }}>
            {value}
          </a>
        ) : (
          <p style={{ fontSize: 13, color: "#2D3E50", margin: "2px 0 0", lineHeight: 1.45 }}>{value}</p>
        )}
      </div>
    </div>
  );
}

function getEmbedUrl(url: string): string {
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&controls=0&api=1`;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  return url;
}
