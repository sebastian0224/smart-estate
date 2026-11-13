import Link from "next/link";

const fotos = ["1.jpg", "5.jpg", "9.jpg", "13.jpg"];

const puntos = [
  ["Buscar", "Casas y apartamentos en ocho ciudades. Filtra por precio y área."],
  ["Guardar", "Deja el contacto en tu perfil y vuelve cuando quieras."],
  ["Publicar", "Si eres el dueño, crea el anuncio y puedes destacarlo."],
];

export default function Inicio() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl">
        <img src="http://localhost:4000/uploads/2.jpg" alt="" className="h-60 w-full object-cover sm:h-[22rem]" />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/15 to-transparent p-6 text-white sm:p-10">
          <h1 className="text-3xl sm:text-4xl">Casas en Colombia</h1>
          <p className="mt-2 max-w-md text-sm text-white/90">Busca por ciudad, guarda el contacto o publica si eres el dueño.</p>
          <Link href="/inmuebles" className="mt-5 w-fit rounded-full bg-white px-5 py-2.5 text-sm text-zinc-900">Ver inmuebles</Link>
        </div>
      </div>
      <section className="mt-10">
        <h2 className="text-2xl">Qué puedes hacer</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {puntos.map(([titulo, texto]) => (
            <div key={titulo} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-lg">{titulo}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{texto}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {fotos.map((foto) => (
          <Link key={foto} href="/inmuebles">
            <img src={`http://localhost:4000/uploads/${foto}`} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />
          </Link>
        ))}
      </div>
    </main>
  );
}
