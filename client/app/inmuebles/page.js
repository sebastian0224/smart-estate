"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Guardar from "../guardar";

const api = "http://localhost:4000";
const ciudades = ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira", "Santa Marta"];

function plata(n) {
  return Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function puntos(v) {
  return String(v).replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

const vacio = { ciudad: "", precioMin: "", precioMax: "", areaMin: "", areaMax: "" };

export default function Inmuebles() {
  const [f, setF] = useState(vacio);
  const [q, setQ] = useState(vacio);
  const [lista, setLista] = useState(null);
  const [falla, setFalla] = useState(false);
  const activo = Object.values(f).some(Boolean) || Object.values(q).some(Boolean);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q.ciudad) params.set("ciudad", q.ciudad);
    if (q.precioMin) params.set("precioMin", q.precioMin.replace(/\./g, ""));
    if (q.precioMax) params.set("precioMax", q.precioMax.replace(/\./g, ""));
    if (q.areaMin) params.set("areaMin", q.areaMin);
    if (q.areaMax) params.set("areaMax", q.areaMax);
    fetch(`${api}/propiedades?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setFalla(!Array.isArray(data));
        setLista(Array.isArray(data) ? data : []);
      })
      .catch(() => { setFalla(true); setLista([]); });
  }, [q]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 grid gap-4 rounded-2xl border border-zinc-200 p-4 sm:grid-cols-3" suppressHydrationWarning>
        <label className="grid gap-1 text-xs text-zinc-500">Ciudad
          <select value={f.ciudad} onChange={(e) => setF({ ...f, ciudad: e.target.value })} className="rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-900">
            <option value="">Todas</option>
            {ciudades.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <div className="grid gap-1 text-xs text-zinc-500">Precio
          <div className="flex gap-2">
            <input value={f.precioMin} onChange={(e) => setF({ ...f, precioMin: puntos(e.target.value) })} placeholder="Desde" inputMode="numeric" className="w-full rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-900" />
            <input value={f.precioMax} onChange={(e) => setF({ ...f, precioMax: puntos(e.target.value) })} placeholder="Hasta" inputMode="numeric" className="w-full rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-900" />
          </div>
        </div>
        <div className="grid gap-1 text-xs text-zinc-500">Área en m²
          <div className="flex gap-2">
            <input value={f.areaMin} onChange={(e) => setF({ ...f, areaMin: e.target.value.replace(/\D/g, "") })} placeholder="Desde" inputMode="numeric" className="w-full rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-900" />
            <input value={f.areaMax} onChange={(e) => setF({ ...f, areaMax: e.target.value.replace(/\D/g, "") })} placeholder="Hasta" inputMode="numeric" className="w-full rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-900" />
          </div>
        </div>
        <div className="flex items-center gap-3 sm:col-span-3">
          <button type="button" onClick={() => setQ({ ...f })} className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white">Aplicar</button>
          {activo ? <button type="button" onClick={() => { setF(vacio); setQ(vacio); }} className="text-sm text-zinc-500">Limpiar</button> : null}
        </div>
      </div>
      {lista && !falla ? <p className="mb-4 text-sm text-zinc-500">{lista.length} {lista.length === 1 ? "inmueble" : "inmuebles"}</p> : null}
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
                  {p.destacado ? <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white">Destacado</span> : null}
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
