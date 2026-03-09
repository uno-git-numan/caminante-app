import Image from "next/image";

export default function MagazinePage() {
  return (
    <div>
      <div className="relative h-[70vh] w-full overflow-hidden">
        <Image
          src="/images/magazine.jpeg"
          alt="Magazine"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">Caminante</p>
          <h2 className="mt-3 text-5xl font-light tracking-wide">Magazine</h2>
          <p className="mt-4 text-sm text-white/70">Historias desde el territorio</p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm text-stone-400">Próximamente — contenido editorial en camino.</p>
      </div>
    </div>
  );
}
