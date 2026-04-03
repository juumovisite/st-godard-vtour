"use client";
import { useState, useRef, useEffect } from "react";

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

// Scènes par défaut si Prismic n'est pas encore configuré
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

const CATEGORIES = [
  { id: "all", label: "Tout", icon: "⊞" },
  { id: "Extérieur", label: "Extérieur", icon: "☀" },
  { id: "Intérieur", label: "Intérieur", icon: "⛪" },
  { id: "Crypte", label: "Crypte", icon: "🕳" },
];

export default function TourViewer({ scenes }: { scenes: SceneData[] }) {
  const allScenes = scenes.length > 0 ? scenes : DEFAULT_SCENES;
  const sortedScenes = [...allScenes].sort(
    (a, b) => (a.data.ordre || 99) - (b.data.ordre || 99)
  );

  const [activeScene, setActiveScene] = useState(
    sortedScenes[0]?.data?.nom_scene_krpano || "scene_parvis_entree"
  );
  const [showFiche, setShowFiche] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentScene = sortedScenes.find(
    (s) => s.data.nom_scene_krpano === activeScene
  );

  const filteredScenes =
    activeCategory === "all"
      ? sortedScenes
      : sortedScenes.filter((s) => s.data.categorie === activeCategory);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.action === "scenechanged" && event.data.scene) {
        setActiveScene(event.data.scene);
        setShowFiche(false);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const changeScene = (sceneName: string) => {
    setActiveScene(sceneName);
    setShowFiche(false);
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { action: "loadscene", scene: sceneName },
        "*"
      );
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

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

      {/* Cadre décoratif */}
      <div
        style={{
          position: "absolute",
          inset: 12,
          border: "2px solid rgba(255,255,255,0.12)",
          borderRadius: 20,
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* Titre en haut à gauche */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 800,
            color: "white",
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            letterSpacing: 0.5,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Cathédrale St Godard
        </h1>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 11,
            color: "rgba(255,255,255,0.7)",
            textShadow: "0 1px 4px rgba(0,0,0,0.4)",
            letterSpacing: 2,
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Visite virtuelle 360°
        </p>
      </div>

      {/* Menu catégories à gauche */}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          zIndex: 10,
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "14px 16px",
              background:
                activeCategory === cat.id
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(255,255,255,0.75)",
              color:
                activeCategory === cat.id ? "#2d1810" : "#6b7b8a",
              border: "none",
              borderRadius: 16,
              cursor: "pointer",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              minWidth: 72,
              boxShadow:
                activeCategory === cat.id
                  ? "0 4px 16px rgba(0,0,0,0.15)"
                  : "0 2px 8px rgba(0,0,0,0.08)",
              transition: "all 0.3s ease",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <span style={{ fontSize: 20, opacity: 0.7 }}>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Bouton info en haut à droite */}
      {!showFiche && (
        <button
          onClick={() => setShowFiche(true)}
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            width: 48,
            height: 48,
            borderRadius: 16,
            background: "rgba(255,255,255,0.9)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            backdropFilter: "blur(10px)",
            zIndex: 10,
            fontSize: 22,
            color: "#8B4513",
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
            transition: "all 0.3s ease",
          }}
        >
          i
        </button>
      )}

      {/* Fiche descriptive */}
      {showFiche && currentScene && (
        <div
          style={{
            position: "absolute",
            right: 30,
            top: "50%",
            transform: "translateY(-50%)",
            width: 380,
            maxHeight: "80vh",
            overflowY: "auto",
            borderRadius: 24,
            overflow: "hidden",
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(180deg, rgba(139, 69, 19, 0.12) 0%, rgba(139, 69, 19, 0.04) 30%, rgba(255, 255, 255, 0.95) 50%)",
              zIndex: 0,
            }}
          />

          <div style={{ position: "relative", zIndex: 1, padding: "28px 24px 24px" }}>
            <button
              onClick={() => setShowFiche(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 18,
                background: "none",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                color: "#999",
                lineHeight: 1,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              ✕
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              {currentScene.data.categorie && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    color: "#8B4513",
                    textTransform: "uppercase",
                  }}
                >
                  {currentScene.data.categorie}
                </span>
              )}
              {currentScene.data.badge && (
                <span
                  style={{
                    background: "#8B4513",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    padding: "6px 14px",
                    borderRadius: 20,
                    textTransform: "uppercase",
                  }}
                >
                  {currentScene.data.badge}
                </span>
              )}
            </div>

            <h2
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#1a2332",
                marginBottom: 14,
                lineHeight: 1.15,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {currentScene.data.title}
            </h2>

            {currentScene.data.description?.[0]?.text && (
              <p
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.65,
                  color: "#5a6577",
                  marginBottom: 24,
                }}
              >
                {currentScene.data.description[0].text}
              </p>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {currentScene.data.epoque && (
                <InfoCard
                  icon="🕰️"
                  label="Époque"
                  value={currentScene.data.epoque}
                />
              )}
              {currentScene.data.style_architectural && (
                <InfoCard
                  icon="🏛️"
                  label="Style"
                  value={currentScene.data.style_architectural}
                />
              )}
              {currentScene.data.element_remarquable && (
                <InfoCard
                  icon="✨"
                  label="À voir"
                  value={currentScene.data.element_remarquable}
                />
              )}
              {currentScene.data.categorie && (
                <InfoCard
                  icon="📍"
                  label="Zone"
                  value={currentScene.data.categorie}
                />
              )}
            </div>

            <button
              onClick={() => setShowFiche(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: 16,
                border: "none",
                borderRadius: 16,
                background: "linear-gradient(135deg, #8B4513, #A0522D)",
                color: "white",
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(139, 69, 19, 0.35)",
              }}
            >
              Continuer la visite →
            </button>
          </div>
        </div>
      )}

      {/* Barre de navigation en bas */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          textAlign: "center",
          maxWidth: "calc(100vw - 200px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background: "rgba(255,255,255,0.4)",
            }}
          />
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 10,
              letterSpacing: 4,
              textTransform: "uppercase",
              margin: 0,
              textShadow: "0 1px 3px rgba(0,0,0,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            Explorez à 360°
          </p>
          <div
            style={{
              flex: 1,
              height: 1,
              background: "rgba(255,255,255,0.4)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: 0,
            background: "rgba(255,252,248,0.92)",
            borderRadius: 16,
            overflow: "hidden",
            overflowX: "auto",
            backdropFilter: "blur(12px)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
            padding: "4px 8px",
            maxWidth: "100%",
          }}
        >
          {filteredScenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => changeScene(scene.data.nom_scene_krpano!)}
              style={{
                padding: "10px 20px",
                border: "none",
                background: "transparent",
                color:
                  activeScene === scene.data.nom_scene_krpano
                    ? "#8B4513"
                    : "#6b7580",
                fontSize: 13,
                fontWeight:
                  activeScene === scene.data.nom_scene_krpano ? 700 : 500,
                cursor: "pointer",
                letterSpacing: 0.3,
                transition: "all 0.3s ease",
                whiteSpace: "nowrap",
                borderBottom:
                  activeScene === scene.data.nom_scene_krpano
                    ? "2px solid #8B4513"
                    : "2px solid transparent",
                paddingBottom: 8,
                fontFamily: "'Inter', sans-serif",
                flexShrink: 0,
              }}
            >
              {scene.data.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.85)",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        borderRadius: 16,
        padding: 16,
        textAlign: "center",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 0.8,
          color: "#8B4513",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2332" }}>
        {value}
      </div>
    </div>
  );
}
