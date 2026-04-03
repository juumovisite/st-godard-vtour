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
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const changeScene = (sceneName: string) => {
    setActiveScene(sceneName);
    setShowHistoire(false);
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
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

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

      {/* Vignette overlay for text readability */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.3) 100%)",
      }} />
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: "linear-gradient(90deg, rgba(0,0,0,0.35) 0%, transparent 40%)",
      }} />

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
          margin: 0, fontSize: 44, fontWeight: 700, color: "white",
          fontFamily: "'Playfair Display', serif",
          lineHeight: 1.1, textShadow: "0 2px 20px rgba(0,0,0,0.4)",
        }}>
          {currentScene?.data.title || ""}
        </h1>

        {currentScene?.data.description?.[0]?.text && (
          <p style={{
            margin: "16px 0 0", fontSize: 15, lineHeight: 1.6,
            color: "rgba(255,255,255,0.8)",
            textShadow: "0 1px 8px rgba(0,0,0,0.3)",
            maxWidth: 420,
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
          width: 380, borderRadius: 24,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          padding: "28px 24px",
        }}>
          <button onClick={() => setShowHistoire(false)} style={{
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
            fontFamily: "'Playfair Display', serif", lineHeight: 1.15,
          }}>
            {currentScene.data.title}
          </h2>

          {currentScene.data.description?.[0]?.text && (
            <p style={{ fontSize: 14, lineHeight: 1.65, color: "#5a6577", marginBottom: 20 }}>
              {currentScene.data.description[0].text}
            </p>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {currentScene.data.epoque && (
              <InfoCard label="Époque" value={currentScene.data.epoque} />
            )}
            {currentScene.data.style_architectural && (
              <InfoCard label="Style" value={currentScene.data.style_architectural} />
            )}
            {currentScene.data.element_remarquable && (
              <InfoCard label="À voir" value={currentScene.data.element_remarquable} />
            )}
            {currentScene.data.categorie && (
              <InfoCard label="Zone" value={currentScene.data.categorie} />
            )}
          </div>
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
          borderRadius: 28,
          padding: "6px 8px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}>
          {/* Précédent */}
          <NavButton icon="←" label="Précédent" onClick={goPrev} />

          {/* Explorer */}
          <button
            onClick={() => { setShowHistoire(false); setShowMenu(false); }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "14px 28px", border: "none", borderRadius: 22,
              background: "#2D3E50", color: "white",
              cursor: "pointer", fontFamily: "'Inter', sans-serif",
              fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
              boxShadow: "0 4px 16px rgba(45,62,80,0.4)",
              transition: "all 0.3s ease",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
            </svg>
            Explorer
          </button>

          {/* Histoire */}
          <NavButton
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>}
            label="Histoire"
            onClick={() => { setShowHistoire(!showHistoire); setShowMenu(false); }}
            active={showHistoire}
          />

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
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        padding: "12px 20px", border: "none", borderRadius: 18,
        background: active ? "rgba(45,62,80,0.1)" : "transparent",
        color: active ? "#2D3E50" : "#6b7580",
        cursor: "pointer", fontFamily: "'Inter', sans-serif",
        fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
        transition: "all 0.3s ease",
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
    </button>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: "rgba(45,62,80,0.04)", border: "1px solid rgba(45,62,80,0.08)",
      borderRadius: 14, padding: 14, textAlign: "center",
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.8, color: "#2D3E50", textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2332" }}>
        {value}
      </div>
    </div>
  );
}
