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
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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

      {/* Top left — Step counter + Scene title + Description */}
      <div style={{ position: "absolute", top: 32, left: 36, zIndex: 10, maxWidth: 500, pointerEvents: "none" }}>
        <div style={{
          display: "inline-block",
          padding: "6px 16px",
          borderRadius: 20,
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.2)",
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: "rgba(255,255,255,0.9)", textTransform: "uppercase" }}>
            Étape {currentIndex + 1} sur {totalScenes}
          </span>
        </div>

        <h1 style={{
          margin: 0, fontSize: 44, fontWeight: 600, color: "white",
          fontFamily: "'Cormorant Garamond', serif",
          lineHeight: 1.1, textShadow: "0 2px 20px rgba(0,0,0,0.5)",
          fontStyle: "italic",
        }}>
          {currentScene?.data.title || ""}
        </h1>

        {currentScene?.data.description?.[0]?.text && (
          <p style={{
            margin: "16px 0 0", fontSize: 14, lineHeight: 1.7,
            color: "rgba(255,255,255,0.8)",
            maxWidth: 400,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
          }}>
            {currentScene.data.description[0].text}
          </p>
        )}
      </div>

      {/* Top right — FR + Menu */}
      <div style={{ position: "absolute", top: 32, right: 36, zIndex: 10, display: "flex", gap: 10, alignItems: "center" }}>
        <button style={{
          width: 42, height: 42, borderRadius: "50%",
          background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "white", fontSize: 13, fontWeight: 600,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Inter', sans-serif",
        }}>
          FR
        </button>
        <button
          onClick={() => { setShowMenu(!showMenu); setShowHistoire(false); }}
          style={{
            width: 42, height: 42, borderRadius: "50%",
            background: showMenu ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: showMenu ? "#2D3E50" : "white",
            fontSize: 20, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.3s ease",
          }}
        >
          {showMenu ? "✕" : "≡"}
        </button>
      </div>

      {/* Menu overlay */}
      {showMenu && (
        <div style={{
          position: "absolute", top: 86, right: 36, zIndex: 20,
          width: 300, maxHeight: "70vh", overflowY: "auto",
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

      {/* Audio player floating above nav bar */}
      {showAudio && currentScene?.data.audio_file?.url && (
        <div style={{
          position: "absolute", bottom: 110, left: "50%", transform: "translateX(-50%)", zIndex: 12,
          background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)",
          borderRadius: 16, padding: "12px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          minWidth: 300,
        }}>
          <audio ref={audioRef} controls autoPlay style={{ width: "100%", height: 36 }} src={currentScene.data.audio_file.url} />
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
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        padding: "10px 12px", border: "none", borderRadius: 14,
        background: active ? "rgba(45,62,80,0.1)" : "transparent",
        color: active ? "#2D3E50" : "#6b7580",
        cursor: "pointer", fontFamily: "'Inter', sans-serif",
        fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
        transition: "all 0.3s ease",
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

function getEmbedUrl(url: string): string {
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  return url;
}
