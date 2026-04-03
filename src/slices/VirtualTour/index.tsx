import dynamic from "next/dynamic";

const KrpanoViewer = dynamic(() => import("@/components/KrpanoViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <p className="text-white text-lg">Chargement de la visite virtuelle...</p>
    </div>
  ),
});

interface VirtualTourSliceProps {
  slice: {
    primary: {
      title?: string;
      description?: string;
      start_scene?: string;
    };
  };
}

export default function VirtualTourSlice({ slice }: VirtualTourSliceProps) {
  const { title, description, start_scene } = slice.primary;

  return (
    <section className="relative w-full">
      {title && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-6">
          <h2 className="text-white text-2xl font-bold">{title}</h2>
          {description && (
            <p className="text-white/80 mt-2">{description}</p>
          )}
        </div>
      )}
      <div className="w-full h-screen">
        <KrpanoViewer startScene={start_scene} />
      </div>
    </section>
  );
}
