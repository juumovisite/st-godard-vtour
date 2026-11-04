"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Krpano } from "@/components/PointCapsules";

type HotspotKrpano = {
  name: string;
  ath: number;
  atv: number;
  alpha: number;
  enabled: boolean;
  visible: boolean;
  linkedscene?: string;
  style?: string;
};
type KrpanoNav = Krpano & { get: (k: string) => unknown };
type Point = { name: string; scene: string; titre: string; thumb: string };

const DIAMETRE = 44;

const CSS = `
.navp{position:fixed;left:0;top:0;width:0;height:0;z-index:7;display:none}
.navp-corps{position:absolute;left:${-DIAMETRE / 2}px;top:${-DIAMETRE / 2}px;box-sizing:border-box;height:${DIAMETRE}px;width:${DIAMETRE}px;padding:3px;display:flex;align-items:center;background:#fff;border:0;border-radius:99px;overflow:hidden;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.42);color:#1a2332;font:600 13px Inter,system-ui,sans-serif;white-space:nowrap;transition:width .36s cubic-bezier(.22,.9,.3,1),box-shadow .36s ease;animation:navp-respire 3.2s ease-in-out infinite}
@keyframes navp-respire{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.navp-corps img{width:${DIAMETRE - 6}px;height:${DIAMETRE - 6}px;border-radius:50%;object-fit:cover;flex:none}
.navp-corps span{padding:0 14px 0 9px;opacity:0;transform:translateX(-8px);transition:opacity .22s ease,transform .36s cubic-bezier(.22,.9,.3,1)}
.navp.ouvert .navp-corps{width:var(--navp-w);animation:none;box-shadow:0 6px 20px rgba(0,0,0,.45)}
.navp.ouvert .navp-corps span{opacity:1;transform:none;transition-delay:.08s}
.navp.gauche .navp-corps{left:auto;right:${-DIAMETRE / 2}px;flex-direction:row-reverse}
.navp.gauche .navp-corps span{padding:0 9px 0 14px;transform:translateX(8px)}
.navp.gauche.ouvert .navp-corps span{transform:none}
@media (prefers-reduced-motion:reduce){.navp-corps{animation:none}}
`;

/** Points de navigation : la photo du lieu, qui se déplie en capsule avec son nom au survol. */
export function NavPoints({ getKrpano, titres, base }: {
  getKrpano: () => Krpano | null | undefined;
  /** id de scène krpano → titre stocké (Prismic) */
  titres: Record<string, string>;
  /** Dossier du tour.xml, pour les vignettes en chemin relatif */
  base: string;
}) {
  const [points, setPoints] = useState<Point[]>([]);
  const [actif, setActif] = useState(false);
  const els = useRef(new Map<string, HTMLDivElement>());
  const fermeture = useRef<ReturnType<typeof setTimeout> | null>(null);

  // En mode modification, les hotspots krpano restent ceux du panneau juumo-edit
  useEffect(() => {
    const edit = /[?&]edit=/.test(window.location.search) || !!sessionStorage.getItem("juumo_edit");
    setActif(!edit);
  }, []);

  // Les hotspots d'une scène arrivent après son chargement : on les reprend dès qu'ils sont là
  useEffect(() => {
    if (!actif) return;
    const relever = () => {
      const k = getKrpano() as KrpanoNav | null | undefined;
      if (!k?.get) return;
      const liste: HotspotKrpano[] = [];
      const n = Number(k.get("hotspot.count")) || 0;
      for (let i = 0; i < n; i++) {
        const h = k.get(`hotspot[${i}]`) as HotspotKrpano | null;
        if (h?.linkedscene && h.linkedscene !== "scene_taginfo" && !h.style?.includes("info") && h.visible) liste.push(h);
      }
      if (!liste.some((h) => h.alpha > 0)) return;
      liste.forEach((h) => { h.alpha = 0; h.enabled = false; });
      setPoints(liste.map((h) => ({
        name: h.name,
        scene: h.linkedscene as string,
        titre: titres[h.linkedscene as string] ?? String(k.get(`scene[${h.linkedscene}].title`) ?? ""),
        thumb: new URL(String(k.get(`scene[${h.linkedscene}].thumburl`) ?? ""), new URL(base, window.location.href)).href,
      })));
    };
    const minuteur = setInterval(relever, 300);
    return () => clearInterval(minuteur);
  }, [actif, base, getKrpano, titres]);

  // Position à chaque image
  useEffect(() => {
    if (!actif) return;
    let frame = 0;
    const suivre = () => {
      const k = getKrpano() as KrpanoNav | null | undefined;
      if (k?.get) {
        const vue = Number(k.get("view.hlookat")) || 0;
        points.forEach((p) => {
          const el = els.current.get(p.name);
          const h = k.get(`hotspot[${p.name}]`) as HotspotKrpano | null;
          if (!el) return;
          if (!h) { el.style.display = "none"; return; }
          k.call(`spheretoscreen(${h.ath},${h.atv},navp_x,navp_y)`);
          const x = parseFloat(String(k.get("navp_x")));
          const y = parseFloat(String(k.get("navp_y")));
          const devant = Math.abs(((h.ath - vue + 540) % 360 + 360) % 360 - 180);
          const visible = devant < 118 && isFinite(x) && isFinite(y) && x > -30 && y > -30 && x < window.innerWidth + 30 && y < window.innerHeight + 30;
          el.style.display = visible ? "block" : "none";
          if (visible) {
            el.style.transform = `translate(${x}px,${y}px)`;
            el.classList.toggle("gauche", x > window.innerWidth - 260);
          }
        });
      }
      frame = requestAnimationFrame(suivre);
    };
    frame = requestAnimationFrame(suivre);
    return () => cancelAnimationFrame(frame);
  }, [actif, getKrpano, points]);

  const ouvrir = (p: Point) => {
    const el = els.current.get(p.name);
    if (!el) return;
    if (fermeture.current) clearTimeout(fermeture.current);
    // Un seul point ouvert à la fois
    els.current.forEach((autre) => { if (autre !== el) autre.classList.remove("ouvert"); });
    const texte = el.querySelector("span");
    el.style.setProperty("--navp-w", `${DIAMETRE + (texte?.scrollWidth ?? 0) + 2}px`);
    el.classList.add("ouvert");
  };
  const fermer = (p: Point) => {
    fermeture.current = setTimeout(() => els.current.get(p.name)?.classList.remove("ouvert"), 120);
  };
  const aller = (p: Point) => {
    const k = getKrpano() as KrpanoNav | null | undefined;
    const h = k?.get(`hotspot[${p.name}]`) as HotspotKrpano | null | undefined;
    if (!k || !h) return;
    h.enabled = true;
    k.call(`callwith(hotspot[${p.name}],onclick)`);
  };

  if (!actif || !points.length) return null;
  return createPortal(
    <>
      <style>{CSS}</style>
      {points.map((p) => (
        <div
          key={`${p.scene}-${p.name}`}
          ref={(el) => { if (el) els.current.set(p.name, el); else els.current.delete(p.name); }}
          className="navp"
        >
          <button
            className="navp-corps"
            aria-label={p.titre}
            onPointerEnter={(e) => { if (e.pointerType === "mouse") ouvrir(p); }}
            onPointerLeave={(e) => { if (e.pointerType === "mouse") fermer(p); }}
            onClick={() => aller(p)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.thumb} alt="" />
            <span>{p.titre}</span>
          </button>
        </div>
      ))}
    </>,
    document.body,
  );
}
