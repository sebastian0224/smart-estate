"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Guardar from "../guardar";

const api = "http://localhost:4000";
const ciudades = ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira", "Santa Marta"];

function plata(n) {
  return Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export default function Inmuebles() {
  const [ciudad, setCiudad] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [lista, setLista] = useState(null);
  const [falla, setFalla] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams();
    if (ciudad) q.set("ciudad", ciudad);
    if (precioMin) q.set("precioMin", precioMin);
    if (precioMax) q.set("precioMax", precioMax);
    if (areaMin) q.set("areaMin", areaMin);
    if (areaMax) q.set("areaMax", areaMax);
    fetch(`${api}/propiedades?${q}`)
      .then((r) => r.json())
      .then((data) => {
        setFalla(!Array.isArray(data));
        setLista(Array.isArray(data) ? data : []);
      })
      .catch(() => { setFalla(true); setLista([]); });
  }, [ciudad, precioMin, precioMax, areaMin, areaMax]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap gap-2" suppressHydrationWarning>
        <select value={ciudad} onChange={(e) => setCiudad(e.target.value)} className="rounded-full border border-zinc-200 px-4 py-2 text-sm">
          <option value="">Ciudad</option>
          {ciudades.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input value={precioMin} onChange={(e) => setPrecioMin(e.target.value)} placeholder="Precio mín" inputMode="numeric" className="w-32 rounded-full border border-zinc-200 px-4 py-2 text-sm" />
        <input value={precioMax} onChange={(e) => setPrecioMax(e.target.value)} placeholder="Precio máx" inputMode="numeric" className="w-32 rounded-full border border-zinc-200 px-4 py-2 text-sm" />
        <input value={areaMin} onChange={(e) => setAreaMin(e.target.value)} placeholder="Área mín" inputMode="numeric" className="w-28 rounded-full border border-zinc-200 px-4 py-2 text-sm" />
        <input value={areaMax} onChange={(e) => setAreaMax(e.target.value)} placeholder="Área máx" inputMode="numeric" className="w-28 rounded-full border border-zinc-200 px-4 py-2 text-sm" />
      </div>
      {falla && <p className="text-sm text-zinc-500">No se pudieron cargar los inmuebles.</p>}
      {lista && !lista.length && !falla && <p className="text-sm text-zinc-500">Nada con esos filtros</p>}
      <section className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {(lista || []).map((p) => (
          <article key={p.id}>
            <Link href={`/inmueble/${p.id}`}>
              <div className="aspect-square overflow-hidden rounded-xl bg-zinc-100">
                {p.foto && <img src={`${api}/uploads/${p.foto}`} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="mt-2 text-sm">
                <div className="flex justify-between gap-2">
                  <p className="font-medium">{p.ciudad}</p>
                  <span className={p.destacado ? "rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white" : "rounded-full border border-zinc-300 px-2 py-0.5 text-xs text-zinc-500"}>{p.destacado ? "Destacado" : "Sin destacar"}</span>
                </div>
                <p className="text-zinc-500">{p.titulo}</p>
                <p className="mt-1">{plata(p.precio)} · {p.area} m²</p>
              </div>
            </Link>
            <Guardar id={p.id} />
          </article>
        ))}
      </section>
    </main>
  );
}
