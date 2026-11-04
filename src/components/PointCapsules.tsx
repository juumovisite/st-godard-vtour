"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Une capsule du panorama (id = clé de la fiche, position lue dans la fiche). */
/** `numero` : capsule secondaire d'une série (ex. un vitrail), affichée plus petite. */
export type Capsule = { id: string; ath: number; atv: number; titre: string; hasTexte: boolean; hasAudio: boolean; hasVideo: boolean; numero?: number };
export type CapsuleAction = "read" | "listen" | "watch";

export type Krpano = { get: (k: string) => unknown; call: (a: string) => void };

const ACCENT = "#8b1c1c";

const CSS = `
.pcaps{position:fixed;inset:0;z-index:8;pointer-events:none;user-select:none;-webkit-user-select:none;font-family:'Inter',sans-serif}
.pcap{position:absolute;left:0;top:0;display:none;transform:translate(-20px,-20px);pointer-events:auto;cursor:pointer}
.pcap-ring{position:relative;z-index:2;width:40px;height:40px;padding:0;border:0;border-radius:50%;background:${ACCENT};color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.3),0 0 0 3px rgba(255,255,255,.6);transition:transform .18s}
.pcap-ring svg{width:20px;height:20px}
.pcap:hover .pcap-ring{transform:scale(1.1)}
.pcap.sous{transform:translate(-16px,-16px)}
.pcap.sous .pcap-ring{width:32px;height:32px;font:700 14px 'Inter',sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.3),0 0 0 2px rgba(255,255,255,.8)}
.pcap.sous .pcap-ring svg{width:16px;height:16px}
.pcap.sous .pcap-corps{min-height:44px;padding-left:50px;border-radius:22px}
.pcap.sous.gauche .pcap-corps{padding:6px 50px 6px 8px}
.pcap.ouvert{z-index:5;filter:drop-shadow(0 6px 16px rgba(0,0,0,.34))}
.pcap.ouvert .pcap-ring{transform:rotate(45deg);box-shadow:none}
.pcap-corps{position:absolute;left:-6px;top:-6px;min-height:52px;display:flex;align-items:center;gap:8px;padding:6px 8px 6px 58px;border-radius:26px;background:#fff;color:#1b1b1b;pointer-events:none;clip-path:inset(0 100% 0 0 round 26px);transition:clip-path .24s cubic-bezier(.3,.8,.4,1)}
.pcap.ouvert .pcap-corps{pointer-events:auto;clip-path:inset(0 0 0 0 round 26px)}
.pcap-corps strong{width:max-content;max-width:190px;font-size:13px;font-weight:700;line-height:1.25;margin-right:4px}
.pcap.gauche .pcap-corps{left:auto;right:-6px;flex-direction:row-reverse;padding:6px 58px 6px 8px;clip-path:inset(0 0 0 100% round 26px)}
.pcap.gauche.ouvert .pcap-corps{clip-path:inset(0 0 0 0 round 26px)}
.pcap.gauche .pcap-corps strong{margin:0 0 0 4px;text-align:right}
.pcap-btn{flex:none;display:flex;align-items:center;gap:6px;border:0;border-radius:99px;padding:8px 11px;background:#F1ECE7;color:${ACCENT};font:700 12px 'Inter',sans-serif;cursor:pointer}
.pcap-btn svg{width:14px;height:14px}
@media(max-width:699px){.pcap-corps strong{display:none}}
`;

const IconPlus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 4v16M4 12h16" /></svg>;
const IconRead = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 6h14M5 12h14M5 18h9" /></svg>;
const IconListen = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></svg>;
const IconWatch = () => <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4" /></svg>;

/**
 * Capsules du panorama (plateformes églises) : le + s'ouvre au survol (au toucher sur mobile),
 * les boutons pilotent l'encart et les lecteurs de la visite, sans conteneur à part.
 * Masquées en mode modification : le panneau juumo-edit y manipule les tags du bridge.
 */
export function PointCapsules({ capsules, getKrpano, panoDocument, labels, onAction }: {
  capsules: Capsule[];
  getKrpano: () => Krpano | null | undefined;
  /** Document qui reçoit les clics sur le panorama (celui de l'iframe tour.html, sinon la page) */
  panoDocument: () => Document | null | undefined;
  labels: Record<CapsuleAction, string>;
  onAction: (id: string, action: CapsuleAction) => void;
}) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [actif, setActif] = useState(false);
  const els = useRef(new Map<string, HTMLDivElement>());
  const fermeture = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const edit = /[?&]edit=/.test(window.location.search) || !!sessionStorage.getItem("juumo_edit");
    setActif(!edit);
  }, []);

  useEffect(() => { setOuvert(null); }, [capsules]);

  // Position à chaque image : le panorama vit dans l'iframe tour.html
  useEffect(() => {
    if (!actif) return;
    let frame = 0;
    const suivre = () => {
      const k = getKrpano();
      if (k?.get) {
        const h = Number(k.get("view.hlookat")) || 0;
        capsules.forEach((c) => {
          const el = els.current.get(c.id);
          if (!el) return;
          const place = c;
          k.call(`spheretoscreen(${place.ath},${place.atv},pcap_x,pcap_y)`);
          const x = parseFloat(String(k.get("pcap_x")));
          const y = parseFloat(String(k.get("pcap_y")));
          const devant = Math.abs(((place.ath - h + 540) % 360 + 360) % 360 - 180);
          const visible = devant < 118 && isFinite(x) && isFinite(y) && x > -30 && y > -30 && x < window.innerWidth + 30 && y < window.innerHeight + 30;
          el.style.display = visible ? "block" : "none";
          if (visible) {
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            el.classList.toggle("gauche", x > window.innerWidth - 480);
          }
        });
      }
      frame = requestAnimationFrame(suivre);
    };
    frame = requestAnimationFrame(suivre);
    return () => cancelAnimationFrame(frame);
  }, [actif, capsules, getKrpano]);

  // Un clic sur le panorama (sans glisser) referme la capsule
  useEffect(() => {
    if (!actif) return;
    const doc = panoDocument();
    if (!doc) return;
    let dx = 0, dy = 0;
    const down = (e: PointerEvent) => { dx = e.clientX; dy = e.clientY; };
    const up = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.(".pcap")) return;
      if (Math.abs(e.clientX - dx) + Math.abs(e.clientY - dy) < 6) setOuvert(null);
    };
    doc.addEventListener("pointerdown", down, true);
    doc.addEventListener("pointerup", up, true);
    return () => { doc.removeEventListener("pointerdown", down, true); doc.removeEventListener("pointerup", up, true); };
  }, [actif, capsules, panoDocument]);

  if (!actif) return null;
  const agir = (id: string, action: CapsuleAction) => { setOuvert(null); onAction(id, action); };

  return createPortal(
    <div className="pcaps">
      <style>{CSS}</style>
      {capsules.map((c) => (
        <div
          key={c.id}
          ref={(el) => { if (el) els.current.set(c.id, el); else els.current.delete(c.id); }}
          className={`pcap${c.numero ? " sous" : ""}${ouvert === c.id ? " ouvert" : ""}`}
          onPointerEnter={(e) => {
            if (e.pointerType !== "mouse") return;
            if (fermeture.current) clearTimeout(fermeture.current);
            setOuvert(c.id);
          }}
          onPointerLeave={(e) => {
            if (e.pointerType !== "mouse") return;
            fermeture.current = setTimeout(() => setOuvert((o) => (o === c.id ? null : o)), 250);
          }}
        >
          <button className="pcap-ring" aria-label={c.titre} onClick={() => setOuvert((o) => (o === c.id ? null : c.id))}><IconPlus /></button>
          <div className="pcap-corps">
            <strong>{c.titre}</strong>
            {c.hasTexte && <button className="pcap-btn" onClick={() => agir(c.id, "read")}><IconRead />{labels.read}</button>}
            {c.hasAudio && <button className="pcap-btn" onClick={() => agir(c.id, "listen")}><IconListen />{labels.listen}</button>}
            {c.hasVideo && <button className="pcap-btn" onClick={() => agir(c.id, "watch")}><IconWatch />{labels.watch}</button>}
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
}
