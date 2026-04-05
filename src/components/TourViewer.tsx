"use client";
import { useState, useRef, useEffect, useMemo } from "react";

interface SceneData {
  id: string;
  data: {
    title?: string;
    nom_scene_krpano?: string;
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
  };
}

const DEFAULT_SCENES: SceneData[] = [
  { id: "1", data: { title: "Parvis Entrée", nom_scene_krpano: "scene_parvis_entree", categorie: "Extérieur", ordre: 1 } },
  { id: "2", data: { title: "Entrée", nom_scene_krpano: "scene_entree", categorie: "Intérieur", ordre: 2 } },
  { id: "3", data: { title: "Orgue", nom_scene_krpano: "scene_orgue", categorie: "Intérieur", ordre: 3 } },
  { id: "4", data: { title: "Autel", nom_scene_krpano: "scene_autel", categorie: "Intérieur", ordre: 4 } },
  { id: "5", data: { title: "Choeur", nom_scene_krpano: "scene_choeur_autel", categorie: "Intérieur", ordre: 5 } },
  { id: "6", data: { title: "Crypte", nom_scene_krpano: "scene_crypte", categorie: "Crypte", ordre: 6 } },
  { id: "7", data: { title: "Aile Nord", nom_scene_krpano: "scene_aile_nord_autel", categorie: "Intérieur", ordre: 7 } },
  { id: "8", data: { title: "Aile Sud", nom_scene_krpano: "scene_aile_sud_autel", categorie: "Intérieur", ordre: 8 } },
  { id: "9", data: { title: "Vue Cathédrale", nom_scene_krpano: "scene_vue_cathedrale", categorie: "Extérieur", ordre: 9 } },
  { id: "10", data: { title: "Vue Donjon", nom_scene_krpano: "scene_vue_donjon", categorie: "Extérieur", ordre: 10 } },
];

export default function TourViewer({ scenes }: { scenes: SceneData[] }) {
  const allScenes = scenes.length > 0 ? scenes : DEFAULT_SCENES;
  const sortedScenes = useMemo(
    () => [...allScenes].sort((a, b) => (a.data.ordre || 99) - (b.data.ordre || 99)),
    [allScenes]
  );

  const [activeScene, setActiveScene] = useState(
    sortedScenes[0]?.data?.nom_scene_krpano || "scene_parvis_entree"
  );
  const [showHistoire, setShowHistoire] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFullMenu, setShowFullMenu] = useState(false);
  const [flippedDon, setFlippedDon] = useState(false);
  const [flippedInfo, setFlippedInfo] = useState(false);
  const [showChurches, setShowChurches] = useState(false);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  function renderSimpleMarkdown(text: string) {
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#2D3E50;font-weight:500">$1</a>')
      .replace(/^[\-\*]\s+(.+)/gm, "<li>$1</li>")
      .replace(/(<li>[\s\S]*<\/li>)/, "<ul>$1</ul>")
      .replace(/\n/g, "<br>");
  }

  async function sendChatMessage() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput("");
    setChatLoading(true);
    setChatAnswer("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
      });

      if (!response.ok) throw new Error("Erreur");

      const reader = response.body!.getReader();
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
                const clean = fullText.replace(/\[SUGGESTIONS\].*?(\[\/SUGGESTIONS\]|$)/g, "").trim();
                setChatAnswer(clean);
              }
            } catch {}
          }
        }
      }

      const clean = fullText.replace(/\[SUGGESTIONS\].*?(\[\/SUGGESTIONS\]|$)/g, "").trim();
      setChatAnswer(clean);
    } catch {
      setChatAnswer("Désolé, une erreur est survenue. Veuillez réessayer.");
    }

    setChatLoading(false);
  }

  const currentIndex = sortedScenes.findIndex(
    (s) => s.data.nom_scene_krpano === activeScene
  );
  const currentScene = sortedScenes[currentIndex];
  const totalScenes = sortedScenes.length;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.action === "scenechanged" && event.data.scene) {
        setActiveScene(event.data.scene);
        setShowHistoire(false);
        setShowDetailedInfo(false);
        setShowAudio(false);
        setShowVideo(false);
        if (audioRef.current) audioRef.current.pause();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const changeScene = (sceneName: string) => {
    setActiveScene(sceneName);
    setShowHistoire(false);
    setShowDetailedInfo(false);
    setShowAudio(false);
    setShowVideo(false);
    if (audioRef.current) audioRef.current.pause();
    setShowMenu(false);
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

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* KRPano iframe */}
      <iframe
        ref={iframeRef}
        src="/vtour/tour.html"
        width="100%"
        height="100%"
        style={{ border: "none", position: "absolute", top: 0, left: 0 }}
        allowFullScreen
        title="Visite virtuelle Cathédrale St Godard"
      />

      {/* Top left — Step counter + menu zone */}
      <div
        style={{ position: "absolute", top: 32, left: 36, zIndex: 20 }}
        onMouseLeave={() => setShowMenu(false)}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: 20,
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={() => { setShowMenu(true); setShowHistoire(false); }}
          onClick={() => { setShowMenu(!showMenu); setShowHistoire(false); }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: "rgba(255,255,255,0.9)", textTransform: "uppercase" }}>
            Étape {currentIndex + 1} sur {totalScenes}
          </span>
        </div>

        {/* Menu dropdown */}
        {showMenu && (
          <div style={{
            marginTop: 8,
            width: 300, maxHeight: "55vh", overflowY: "auto",
            borderRadius: 20,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            padding: "8px 0",
          }}>
            {sortedScenes.map((scene, i) => (
              <button
                key={scene.id}
                onClick={() => changeScene(scene.data.nom_scene_krpano!)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  width: "100%", padding: "14px 20px",
                  border: "none", background: activeScene === scene.data.nom_scene_krpano ? "rgba(45,62,80,0.08)" : "transparent",
                  cursor: "pointer", textAlign: "left",
                  transition: "background 0.2s ease",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: activeScene === scene.data.nom_scene_krpano ? "#2D3E50" : "rgba(45,62,80,0.1)",
                  color: activeScene === scene.data.nom_scene_krpano ? "white" : "#2D3E50",
                  fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {i + 1}
                </span>
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
        )}
      </div>

      {/* Title + Description */}
      <div style={{ position: "absolute", top: 76, left: 36, zIndex: 10, maxWidth: 500, pointerEvents: "none" }}>

        <h1 style={{
          margin: 0, fontSize: 44, fontWeight: 600, color: "white",
          fontFamily: "'Cormorant Garamond', serif",
          lineHeight: 1.1, textShadow: "0 2px 20px rgba(0,0,0,0.5)",
          fontStyle: "italic", pointerEvents: "none",
        }}>
          {currentScene?.data.title || ""}
        </h1>

      </div>

      {/* Top right — FR + Menu */}
      <div style={{ position: "absolute", top: 32, right: 36, zIndex: 10, display: "flex", gap: 10, alignItems: "center" }}>
        <HeaderButton>FR</HeaderButton>
        <HeaderButton
          onClick={() => { setShowFullMenu(!showFullMenu); setShowHistoire(false); setShowMenu(false); }}
          active={showFullMenu}
        >
          {showFullMenu ? "✕" : "≡"}
        </HeaderButton>
      </div>

      {/* Histoire panel */}
      {showHistoire && currentScene && (
        <div style={{
          position: "absolute", left: 36, bottom: 120, zIndex: 15,
          width: 380, maxHeight: "60vh", overflowY: "auto",
          borderRadius: 24,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          padding: "28px 24px",
        }}>
          <button onClick={() => { setShowHistoire(false); setShowDetailedInfo(false); setShowAudio(false); if (audioRef.current) audioRef.current.pause(); }} style={{
            position: "absolute", top: 14, right: 16,
            background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#999",
          }}>✕</button>

          {currentScene.data.categorie && (
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#2D3E50", textTransform: "uppercase" }}>
              {currentScene.data.categorie}
            </span>
          )}

          <h2 style={{
            fontSize: 26, fontWeight: 700, color: "#1a2332", margin: "8px 0 12px",
            fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.15,
          }}>
            {currentScene.data.title}
          </h2>

          {currentScene.data.description?.[0]?.text && (
            <p style={{ fontSize: 14, lineHeight: 1.65, color: "#5a6577", marginBottom: 20 }}>
              {currentScene.data.description[0].text}
            </p>
          )}

          {/* Detailed info expanded */}
          {showDetailedInfo && currentScene.data.description_longue?.[0]?.text && (
            <div style={{ marginBottom: 20, padding: "16px", background: "rgba(45,62,80,0.04)", borderRadius: 14 }}>
              {currentScene.data.description_longue.map((p, i) => (
                <p key={i} style={{ fontSize: 13, lineHeight: 1.7, color: "#3a4a5a", margin: i > 0 ? "10px 0 0" : 0 }}>
                  {p.text}
                </p>
              ))}
            </div>
          )}

          {/* Action button */}
          {currentScene.data.description_longue?.[0]?.text && (
            <ActionButton
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>}
              label="Voir plus d'info"
              onClick={() => setShowDetailedInfo(!showDetailedInfo)}
              active={showDetailedInfo}
            />
          )}
        </div>
      )}

      {/* Video modal overlay */}
      {showVideo && currentScene?.data.video_url && (
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 30,
            background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setShowVideo(false)}
        >
          <div style={{ position: "relative", width: "80%", maxWidth: 800, aspectRatio: "16/9" }} onClick={(e) => e.stopPropagation()}>
            <iframe
              src={getEmbedUrl(currentScene.data.video_url)}
              width="100%"
              height="100%"
              style={{ border: "none", borderRadius: 16 }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
            <button onClick={() => setShowVideo(false)} style={{
              position: "absolute", top: -40, right: 0,
              background: "none", border: "none", color: "white",
              fontSize: 28, cursor: "pointer",
            }}>✕</button>
          </div>
        </div>
      )}

      {/* Fullscreen menu overlay */}
      {showFullMenu && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 25,
          background: "#fafafa",
          overflowY: "auto",
          padding: "0 24px 40px",
        }}>
          {/* Close button */}
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "24px 0 0" }}>
            <button onClick={() => setShowFullMenu(false)} style={{
              width: 42, height: 42, borderRadius: "50%",
              background: "rgba(0,0,0,0.06)", border: "none",
              fontSize: 18, cursor: "pointer", color: "#333",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>

          {/* Header */}
          <div style={{ maxWidth: 700, margin: "0 auto", padding: "10px 0 30px" }}>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 4px", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
              Visite virtuelle 360°
            </p>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#111", margin: 0, fontFamily: "'Inter', sans-serif", lineHeight: 1.15 }}>
              Cathédrale Saint-Godard
            </h2>
          </div>

          <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Main card — Start tour */}
            <button
              onClick={() => setShowFullMenu(false)}
              style={{
                position: "relative", width: "100%", height: 320, borderRadius: 26,
                overflow: "hidden", border: "none", cursor: "pointer", textAlign: "left",
                background: "#222",
                boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: "url(/vtour/panos/Entree.tiles/preview.jpg)",
                backgroundSize: "cover", backgroundPosition: "center",
              }} />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
              }} />
              <span style={{
                position: "absolute", top: 16, left: 18,
                background: "rgba(139,69,19,0.85)", color: "white",
                fontSize: 11, fontWeight: 600, padding: "5px 14px", borderRadius: 20,
                letterSpacing: 0.5,
              }}>
                Visite guidée interactive
              </span>
              <div style={{ position: "absolute", bottom: 20, left: 22, right: 70 }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: "white", margin: "0 0 4px", fontFamily: "'Inter', sans-serif" }}>
                  Découvrir la visite virtuelle
                </p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0 }}>
                  Cathédrale Saint-Godard
                </p>
              </div>
              <div style={{
                position: "absolute", bottom: 18, right: 18,
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: 18,
              }}>↗</div>
            </button>

            {/* Two flip cards row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Faire un Don — Flip Card */}
              <div onClick={() => setFlippedDon(!flippedDon)} style={{
                perspective: 800, height: 200, cursor: "pointer",
              }}>
                <div style={{
                  position: "relative", width: "100%", height: "100%",
                  transition: "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
                  transformStyle: "preserve-3d",
                  transform: flippedDon ? "rotateX(180deg)" : "rotateX(0deg)",
                }}>
                  {/* Front */}
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden",
                    backfaceVisibility: "hidden", boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                  }}>
                    <div style={{ position: "absolute", inset: 0, backgroundImage: "url(/vtour/panos/Autel.tiles/preview.jpg)", backgroundSize: "cover", backgroundPosition: "center" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%)" }} />
                    <span style={{ position: "absolute", top: 14, left: 14, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", color: "white", fontSize: 10, fontWeight: 600, padding: "4px 12px", borderRadius: 16 }}>Soutien</span>
                    <p style={{ position: "absolute", bottom: 16, left: 16, fontSize: 18, fontWeight: 700, color: "white", margin: 0 }}>Faire un Don</p>
                    <div style={{ position: "absolute", bottom: 14, right: 14, width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14 }}>↗</div>
                  </div>
                  {/* Back */}
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden",
                    backfaceVisibility: "hidden", transform: "rotateX(-180deg)",
                    background: "white", boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                    padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between",
                  }}>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>Soutenez-nous</p>
                      <p style={{ fontSize: 12, color: "#666", lineHeight: 1.5, margin: 0 }}>
                        30% de votre don est reversé à l&apos;Église Saint-Godard pour sa préservation.
                      </p>
                    </div>
                    <a href="https://visite.juumo.fr/fr/tour/z9y4gdmj" target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: "block", textAlign: "center", padding: "10px 16px", borderRadius: 14,
                        background: "#2D3E50", color: "white", textDecoration: "none",
                        fontSize: 13, fontWeight: 700,
                      }}>
                      Je fais un don
                    </a>
                  </div>
                </div>
              </div>

              {/* Informations — Flip Card */}
              <div onClick={() => setFlippedInfo(!flippedInfo)} style={{
                perspective: 800, height: 200, cursor: "pointer",
              }}>
                <div style={{
                  position: "relative", width: "100%", height: "100%",
                  transition: "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
                  transformStyle: "preserve-3d",
                  transform: flippedInfo ? "rotateX(180deg)" : "rotateX(0deg)",
                }}>
                  {/* Front */}
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden",
                    backfaceVisibility: "hidden", boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                  }}>
                    <div style={{ position: "absolute", inset: 0, backgroundImage: "url(/vtour/panos/Parvis_entree.tiles/preview.jpg)", backgroundSize: "cover", backgroundPosition: "center" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%)" }} />
                    <span style={{ position: "absolute", top: 14, left: 14, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", color: "white", fontSize: 10, fontWeight: 600, padding: "4px 12px", borderRadius: 16 }}>Horaires & Accès</span>
                    <p style={{ position: "absolute", bottom: 16, left: 16, fontSize: 18, fontWeight: 700, color: "white", margin: 0 }}>Informations</p>
                    <div style={{ position: "absolute", bottom: 14, right: 14, width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14 }}>↗</div>
                  </div>
                  {/* Back */}
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden",
                    backfaceVisibility: "hidden", transform: "rotateX(-180deg)",
                    background: "white", boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                    padding: 20, display: "flex", flexDirection: "column", gap: 10,
                  }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: 0 }}>Horaires & Accès</p>
                    <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>
                      <p style={{ margin: "0 0 6px" }}><strong>Horaires :</strong> Tous les jours, 9h - 18h</p>
                      <p style={{ margin: "0 0 6px" }}><strong>Messe :</strong> Dimanche à 10h30</p>
                      <p style={{ margin: 0 }}><strong>Adresse :</strong> Église Saint-Godard, Rouen</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visit other churches — expandable */}
            <div>
              <button
                onClick={() => setShowChurches(!showChurches)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "20px 24px", borderRadius: 22, border: "none",
                  background: "linear-gradient(135deg, #5a8fa8, #7ab5c9)",
                  cursor: "pointer",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                }}
              >
                <p style={{ fontSize: 18, fontWeight: 700, color: "white", margin: 0 }}>
                  Visitez d&apos;autres églises
                </p>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(255,255,255,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: 16,
                  transition: "transform 0.3s ease",
                  transform: showChurches ? "rotate(90deg)" : "none",
                }}>→</div>
              </button>
              {showChurches && (
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
                  marginTop: 12,
                }}>
                  {[
                    { name: "Église Saint-Maclou", url: "https://visite.juumo.fr" },
                    { name: "Cathédrale de Rouen", url: "https://visite.juumo.fr" },
                    { name: "Église Saint-Ouen", url: "https://visite.juumo.fr" },
                    { name: "Abbatiale de Fécamp", url: "https://visite.juumo.fr" },
                  ].map((church) => (
                    <a key={church.name} href={church.url} target="_blank" rel="noopener noreferrer" style={{
                      padding: "14px 16px", borderRadius: 16,
                      background: "#1a1a1a", color: "white", textDecoration: "none",
                      fontSize: 13, fontWeight: 600,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}>
                      {church.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <p style={{ textAlign: "center", fontSize: 12, color: "#999", margin: "10px 0 0", fontFamily: "'Inter', sans-serif" }}>
              Une réalisation de Juumo
            </p>
          </div>
        </div>
      )}

      {/* Audio player floating above nav bar */}
      {showAudio && currentScene?.data.audio_file?.url && (
        <div style={{
          position: "absolute", bottom: 160, left: "50%", transform: "translateX(-50%)", zIndex: 12,
          background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)",
          borderRadius: 16, padding: "12px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          minWidth: 300,
        }}>
          <audio ref={audioRef} controls autoPlay style={{ width: "100%", height: 36 }} src={currentScene.data.audio_file.url} />
        </div>
      )}

      {/* Chat answer card — above input bar */}
      {(chatAnswer || chatLoading) && (
        <div style={{
          position: "absolute", bottom: 148, left: "50%", transform: "translateX(-50%)",
          zIndex: 11, width: 460, maxWidth: "calc(100vw - 32px)",
          animation: "chat-fade-in 0.3s ease-out both",
        }}>
          <div style={{
            background: "rgba(255,252,248,0.92)", backdropFilter: "blur(20px)",
            borderRadius: 18, padding: "16px 20px",
            boxShadow: "0 12px 48px rgba(0,0,0,0.2)",
            border: "1px solid rgba(255,255,255,0.3)",
            maxHeight: 260, overflowY: "auto",
            position: "relative",
          }} ref={chatScrollRef}>
            {/* Close button */}
            <button
              onClick={() => { setChatAnswer(""); setChatLoading(false); }}
              style={{
                position: "absolute", top: 10, right: 10,
                width: 24, height: 24, borderRadius: "50%",
                background: "rgba(45,62,80,0.1)", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, color: "#6b7d8e",
              }}
            >
              ✕
            </button>
            {chatLoading && !chatAnswer ? (
              <div style={{
                display: "flex", gap: 6, padding: "8px 0",
                alignItems: "center",
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "#2D3E50", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                }}>J</div>
                <span style={{ color: "#6b7d8e", fontSize: 14, fontFamily: "'Inter', sans-serif" }}>
                  Réflexion en cours
                  <span style={{ animation: "jw-bounce 1.2s infinite", display: "inline-block" }}>.</span>
                  <span style={{ animation: "jw-bounce 1.2s infinite 0.2s", display: "inline-block" }}>.</span>
                  <span style={{ animation: "jw-bounce 1.2s infinite 0.4s", display: "inline-block" }}>.</span>
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "#2D3E50", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2,
                }}>J</div>
                <div
                  style={{
                    fontSize: 13, lineHeight: 1.7, color: "#2D3E50",
                    fontFamily: "'Inter', sans-serif", flex: 1, paddingRight: 20,
                  }}
                  dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(chatAnswer) }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Juumo chat bar — above nav */}
      {!chatOpen ? (
        <div
          onClick={() => {
            setChatOpen(true);
            setTimeout(() => chatInputRef.current?.focus(), 50);
          }}
          style={{
            position: "absolute", bottom: 102, left: "50%", transform: "translateX(-50%)", zIndex: 10,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: "rgba(255,252,248,0.88)",
            backdropFilter: "blur(16px)",
            borderRadius: 22,
            padding: "10px 20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            cursor: "pointer",
            transition: "all 0.3s ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(45,62,80,0.95)";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,252,248,0.88)";
            e.currentTarget.style.color = "#2D3E50";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}>
            Vous avez une question sur Saint-Godard ?
          </span>
        </div>
      ) : (
        <div style={{
          position: "absolute", bottom: 102, left: "50%", transform: "translateX(-50%)", zIndex: 10,
          display: "flex", alignItems: "center", gap: 0,
          background: "rgba(255,252,248,0.92)",
          backdropFilter: "blur(16px)",
          borderRadius: 22,
          padding: "4px 4px 4px 16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          width: 460, maxWidth: "calc(100vw - 32px)",
          border: "1.5px solid rgba(45,62,80,0.15)",
          transition: "all 0.3s ease",
        }}>
          <input
            ref={chatInputRef}
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendChatMessage(); }}
            placeholder="Posez votre question sur Saint-Godard..."
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent", fontSize: 13,
              fontFamily: "'Inter', sans-serif", color: "#2D3E50",
              padding: "8px 0",
            }}
          />
          {/* Close */}
          <button
            onClick={() => { setChatOpen(false); setChatAnswer(""); setChatInput(""); }}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(45,62,80,0.08)", border: "none",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "#6b7d8e", flexShrink: 0, marginRight: 4,
            }}
          >✕</button>
          {/* Send */}
          <button
            onClick={sendChatMessage}
            disabled={!chatInput.trim() || chatLoading}
            style={{
              width: 34, height: 34, borderRadius: "50%",
              background: chatInput.trim() && !chatLoading ? "#2D3E50" : "rgba(45,62,80,0.2)",
              border: "none", cursor: chatInput.trim() && !chatLoading ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.2s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      )}

      {/* Bottom navigation bar */}
      <div style={{
        position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 10,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 0,
          background: "rgba(255,252,248,0.88)",
          backdropFilter: "blur(16px)",
          borderRadius: 22,
          padding: "4px 6px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}>
          {/* Précédent */}
          <NavButton icon="←" label="Précédent" onClick={goPrev} />

          {/* Explorer */}
          <button
            onClick={() => { setShowHistoire(false); setShowMenu(false); }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "12px 20px", border: "none", borderRadius: 18,
              background: "#2D3E50", color: "white",
              cursor: "pointer", fontFamily: "'Inter', sans-serif",
              fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
              boxShadow: "0 4px 16px rgba(45,62,80,0.4)",
              transition: "all 0.3s ease",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
            </svg>
            Explorer
          </button>

          {/* Histoire */}
          <NavButton
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>}
            label="Histoire"
            onClick={() => { setShowHistoire(!showHistoire); setShowMenu(false); setShowAudio(false); if (audioRef.current) audioRef.current.pause(); }}
            active={showHistoire}
          />

          {/* Audio */}
          {currentScene?.data.audio_file?.url && (
            <NavButton
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}
              label="Audio"
              onClick={() => { setShowAudio(!showAudio); setShowHistoire(false); setShowMenu(false); if (showAudio && audioRef.current) audioRef.current.pause(); }}
              active={showAudio}
            />
          )}

          {/* Vidéo */}
          {currentScene?.data.video_url && (
            <NavButton
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
              label="Vidéo"
              onClick={() => { setShowVideo(true); setShowHistoire(false); setShowMenu(false); }}
            />
          )}

          {/* Suivant */}
          <NavButton icon="→" label="Suivant" onClick={goNext} />
        </div>
      </div>
    </div>
  );
}

function NavButton({ icon, label, onClick, active }: {
  icon: React.ReactNode; label: string; onClick: () => void; active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        padding: "10px 12px", border: "none", borderRadius: 14,
        background: active ? "rgba(45,62,80,0.12)" : hovered ? "rgba(45,62,80,0.06)" : "transparent",
        color: active ? "#2D3E50" : hovered ? "#3d5060" : "#6b7580",
        cursor: "pointer", fontFamily: "'Inter', sans-serif",
        fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
        transition: "all 0.25s ease",
        transform: hovered && !active ? "translateY(-1px)" : "none",
      }}
    >
      <span style={{ fontSize: 15 }}>{icon}</span>
      {label}
    </button>
  );
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

function getEmbedUrl(url: string): string {
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  return url;
}
