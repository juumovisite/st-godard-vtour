"use client";

import { useEffect } from "react";

declare global {
  interface Window { _paq?: unknown[][]; }
}

// Matomo Cloud (juumo.matomo.cloud) — site 21. Pageviews + scènes + chatbot.
const MATOMO_SITE_ID = "21";

export function MatomoProvider() {
  useEffect(() => {
    if (typeof window === "undefined" || window._paq) return;
    const _paq: unknown[][] = (window._paq = window._paq || []);
    _paq.push(["trackPageView"]);
    _paq.push(["enableLinkTracking"]);
    _paq.push(["enableHeartBeatTimer"]);
    _paq.push(["setTrackerUrl", "https://juumo.matomo.cloud/matomo.php"]);
    _paq.push(["setSiteId", MATOMO_SITE_ID]);
    const g = document.createElement("script");
    g.async = true;
    g.src = "https://cdn.matomo.cloud/juumo.matomo.cloud/matomo.js";
    document.head.appendChild(g);
    // Scene tracking Matomo — virtual pageview a chaque changement de scene KRpano (topScenes espace client)
    const onMatomoScene = (e: MessageEvent) => {
      const d = e.data as { action?: string; scene?: string } | null;
      if (!d || d.action !== "scenechanged" || !d.scene) return;
      const q = window._paq;
      if (!q) return;
      q.push(["setCustomUrl", window.location.origin + "/scene/" + d.scene]);
      q.push(["setDocumentTitle", "Scene - " + d.scene]);
      q.push(["trackPageView"]);
    };
    window.addEventListener("message", onMatomoScene);
  }, []);
  return null;
}
