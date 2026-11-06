"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Gallery from "../../gallery";
import Guardar from "../../guardar";

const api = "http://localhost:4000";

function plata(n) {
  return Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export default function Ficha() {
  const { id } = useParams();
  const [p, setP] = useState(null);

  useEffect(() => {
    fetch(`${api}/propiedades/${id}`)
      .then((r) => r.json())
      .then(setP)
      .catch(() => setP({ error: true }));
  }, [id]);

  if (!p) return null;
  if (p.error) return <main className="mx-auto max-w-5xl px-4 py-8 text-sm sm:px-6">No está</main>;

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-2">
      <Gallery images={(p.imagenes || []).map((img) => `${api}/uploads/${img.ruta}`)} />
      <div>
        <p className="text-sm text-zinc-500">{p.ciudad}</p>
        <h1 className="text-2xl">{p.titulo}</h1>
        <p className="mt-2">{plata(p.precio)}</p>
        <p className="text-sm text-zinc-500">{p.area} m² · {p.direccion}</p>
        <p className="mt-2 text-sm">{p.destacado ? "Destacado" : "Sin destacar"}</p>
        <p className="mt-4 text-sm">{p.descripcion}</p>
        <div className="mt-6 border-t border-zinc-200 pt-4 text-sm">
          <p className="font-medium">{p.agente}</p>
          <p className="text-zinc-500">{p.telefono}</p>
          <p className="text-zinc-500">{p.email}</p>
          <Guardar id={p.id} />
        </div>
      </div>
    </main>
  );
}
