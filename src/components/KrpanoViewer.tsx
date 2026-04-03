"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    embedpano: (config: Record<string, unknown>) => void;
    removepano: (id: string) => void;
  }
}

interface KrpanoViewerProps {
  xmlPath?: string;
  startScene?: string;
}

export default function KrpanoViewer({
  xmlPath = "/vtour/tour.xml",
  startScene,
}: KrpanoViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/vtour/tour.js";
    script.async = true;
    script.onload = () => {
      if (window.embedpano && containerRef.current) {
        window.embedpano({
          xml: xmlPath,
          target: containerRef.current,
          html5: "auto",
          mobilescale: 1.0,
          passQueryParameters: "startscene,startlookat",
          ...(startScene ? { vars: { startscene: `scene_${startScene}` } } : {}),
          id: "krpano_viewer",
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (window.removepano) {
        try {
          window.removepano("krpano_viewer");
        } catch {
          // viewer already removed
        }
      }
      script.remove();
    };
  }, [xmlPath, startScene]);

  return <div ref={containerRef} className="w-full h-full" />;
}
