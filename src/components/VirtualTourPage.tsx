"use client";

import dynamic from "next/dynamic";

const KrpanoViewer = dynamic(() => import("@/components/KrpanoViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4" />
        <p className="text-white text-lg">
          Chargement de la visite virtuelle...
        </p>
      </div>
    </div>
  ),
});

interface VirtualTourPageProps {
  title?: string;
  description?: string;
  startScene?: string;
}

export default function VirtualTourPage({
  title,
  description,
  startScene,
}: VirtualTourPageProps) {
  return (
    <main className="h-screen w-full relative">
      {title && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-6 pointer-events-none">
          <h1 className="text-white text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-white/80 mt-2 text-lg">{description}</p>
          )}
        </div>
      )}
      <KrpanoViewer startScene={startScene} />
    </main>
  );
}
