import Link from "next/link";

export default function Inicio() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl">Casas en Colombia</h1>
      <p className="mt-3 max-w-md text-sm text-zinc-500">Busca por ciudad, guarda el contacto o publica si eres el dueño.</p>
      <Link href="/inmuebles" className="mt-6 inline-block rounded-full bg-zinc-900 px-4 py-2 text-sm text-white">Ver inmuebles</Link>
    </main>
  );
}
