"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SignOutButton, useAuth } from "@clerk/nextjs";

const api = "http://localhost:4000";
const ciudades = ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira", "Santa Marta"];
const vacio = { titulo: "", precio: "", area: "", ciudad: "Bogotá", direccion: "", descripcion: "" };
const maxFotos = 4;
const limpio = {
  titulo: /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 .,]/g,
  precio: /\D/g,
  area: /\D/g,
  direccion: /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 #.,-]/g,
  descripcion: /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 .,;:¿?¡!\n-]/g,
};

function plata(n) {
  return Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export default function Perfil() {
  const { getToken, isLoaded } = useAuth();
  const [yo, setYo] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [previews, setPreviews] = useState([]);
  const [actuales, setActuales] = useState([]);
  const archivos = useRef([]);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(vacio);
  const [edit, setEdit] = useState(null);
  const [mias, setMias] = useState([]);
  const [guardados, setGuardados] = useState([]);
  const [listo, setListo] = useState("");

  async function cargar(rol) {
    const token = await getToken();
    const headers = { Authorization: `Bearer ${token}` };
    const me = await fetch(`${api}/yo`, { headers }).then((r) => r.json());
    const es = (rol || me.rol) === "admin";
    setYo(me.rol ? { ...me, rol: rol || me.rol } : me);
    const data = await fetch(api + (es ? "/mis-propiedades" : "/guardados"), { headers }).then((r) => r.json());
    if (es) setMias(Array.isArray(data) ? data : []);
    else setGuardados(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    if (!isLoaded) return;
    const id = new URLSearchParams(window.location.search).get("checkout_id");
    if (!id) {
      cargar();
      return;
    }
    (async () => {
      const token = await getToken();
      const r = await fetch(`${api}/pagos/confirmar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ checkout_id: id }),
      });
      const data = await r.json();
      if (data.error) setMsg(data.error);
      else setListo("Tu inmueble quedó destacado");
      window.history.replaceState({}, "", "/perfil");
      cargar("admin");
    })();
  }, [isLoaded]);

  async function guardar(rol) {
    const token = await getToken();
    const r = await fetch(`${api}/rol`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ rol }),
    });
    const data = await r.json();
    if (data.error) return setMsg(data.error);
    setMsg("");
    cargar(rol);
  }

  function campo(e) {
    const regla = limpio[e.target.name];
    const value = regla ? e.target.value.replace(regla, "") : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  }

  function soltarNuevas() {
    previews.forEach((src) => URL.revokeObjectURL(src));
    setPreviews([]);
    archivos.current = [];
  }

  function abrirNuevo() {
    soltarNuevas();
    setActuales([]);
    setEdit(null);
    setForm(vacio);
    setError("");
    setAbierto(true);
  }

  function abrirEdit(p) {
    soltarNuevas();
    setError("");
    setEdit(p.id);
    setForm({ titulo: p.titulo, precio: String(p.precio), area: String(p.area), ciudad: p.ciudad, direccion: p.direccion, descripcion: p.descripcion });
    setActuales(String(p.fotos || p.foto || "").split(",").filter(Boolean).map((ruta) => `${api}/uploads/${ruta}`));
    setAbierto(true);
  }

  function verFotos(e) {
    const cupo = maxFotos - actuales.length;
    const files = [...e.target.files].slice(0, Math.max(cupo, 0));
    setError(e.target.files.length > cupo ? "Máximo 4 fotos por publicación" : "");
    soltarNuevas();
    archivos.current = files;
    setPreviews(files.map((file) => URL.createObjectURL(file)));
  }

  async function publicar(e) {
    e.preventDefault();
    const body = new FormData(e.target);
    const precio = String(body.get("precio") || "").replace(/\D/g, "");
    const area = String(body.get("area") || "").replace(/\D/g, "");
    if (!String(body.get("titulo") || "").trim() || !precio || !area || !body.get("ciudad") || !String(body.get("direccion") || "").trim() || !String(body.get("descripcion") || "").trim()) {
      setError("Completa todos los campos");
      return;
    }
    body.delete("fotos");
    for (const file of archivos.current) body.append("fotos", file);
    if (actuales.length + archivos.current.length > maxFotos) {
      setError("Máximo 4 fotos por publicación");
      return;
    }
    if (!edit && !archivos.current.length) {
      setError("Carga una foto");
      return;
    }
    try {
      const token = await getToken();
      const r = await fetch(edit ? `${api}/propiedades/${edit}` : `${api}/propiedades`, {
        method: edit ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || data.error) return setError(data.error || "No se pudo publicar");
      setError("");
      setAbierto(false);
      soltarNuevas();
      setActuales([]);
      setEdit(null);
      setForm(vacio);
      setListo(edit ? "Los cambios quedaron guardados" : "La publicación quedó lista");
      cargar("admin");
    } catch {
      setError("No se pudo publicar");
    }
  }

  async function borrar(id) {
    const token = await getToken();
    await fetch(`${api}/propiedades/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    cargar("admin");
  }

  async function destacar(id) {
    const token = await getToken();
    const r = await fetch(`${api}/pagos/checkout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ propiedad_id: id }),
    });
    const data = await r.json();
    if (data.url) window.location.href = data.url;
    else setMsg(data.error || "No se pudo abrir el pago");
  }

  if (!yo || yo.error) return <main className="mx-auto max-w-3xl px-4 py-10 text-sm">{yo ? "No se pudo cargar el perfil" : null}</main>;
  const dueno = yo.rol === "admin";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-xl">{yo.nombre}</h1>
      <p className="text-sm text-zinc-500">{yo.email}</p>
      <div className="mt-6 grid w-fit grid-cols-2 rounded-full border border-zinc-200 p-1 text-sm">
        <button type="button" onClick={() => guardar("client")} className={dueno ? "rounded-full px-4 py-2" : "rounded-full bg-zinc-900 px-4 py-2 text-white"}>Cliente</button>
        <button type="button" onClick={() => guardar("admin")} className={dueno ? "rounded-full bg-zinc-900 px-4 py-2 text-white" : "rounded-full px-4 py-2"}>Dueño</button>
      </div>
      {msg ? <p className="mt-3 text-sm text-zinc-500">{msg}</p> : null}
      {dueno ? (
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg">Mis inmuebles</h2>
            <button type="button" onClick={abrirNuevo} className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white">Crear publicación</button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {mias.map((p) => (
              <article key={p.id}>
                <Link href={`/inmueble/${p.id}`} className="block">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-zinc-100">
                    {p.foto ? <img src={`${api}/uploads/${p.foto}`} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-sm">{p.titulo}</p>
                    <span className={p.destacado ? "rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white" : "rounded-full border border-zinc-300 px-2 py-0.5 text-xs text-zinc-500"}>{p.destacado ? "Destacado" : "Sin destacar"}</span>
                  </div>
                  <p className="text-sm text-zinc-500">{plata(p.precio)}</p>
                </Link>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <button type="button" className="rounded-full border border-zinc-300 px-3 py-1" onClick={() => abrirEdit(p)}>Editar</button>
                  {p.destacado ? null : <button type="button" className="rounded-full border border-zinc-300 px-3 py-1" onClick={() => destacar(p.id)}>Destacar</button>}
                  <button type="button" className="rounded-full border border-zinc-300 px-3 py-1" onClick={() => borrar(p.id)}>Borrar</button>
                </div>
              </article>
            ))}
            {!mias.length ? <p className="text-sm text-zinc-500">Todavía no publicaste inmuebles</p> : null}
          </div>
        </section>
      ) : (
        <section className="mt-8">
          <h2 className="text-lg">Inmuebles guardados:</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {guardados.map((p) => (
            <Link key={p.id} href={`/inmueble/${p.id}`} className="block">
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-zinc-100">
                {p.foto ? <img src={`${api}/uploads/${p.foto}`} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-sm">{p.titulo}</p>
                {p.destacado ? <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white">Destacado</span> : null}
              </div>
              <p className="text-sm text-zinc-500">{plata(p.precio)}</p>
            </Link>
          ))}
          {!guardados.length ? <p className="text-sm text-zinc-500">Todavía no guardaste contactos</p> : null}
          </div>
        </section>
      )}
      <SignOutButton>
        <button type="button" className="mt-8 rounded-full bg-red-600 px-4 py-2 text-sm text-white">Cerrar sesión</button>
      </SignOutButton>
      {abierto ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4" onClick={() => { soltarNuevas(); setActuales([]); setAbierto(false); }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={publicar} noValidate className="grid max-h-[90vh] w-full max-w-md gap-2 overflow-auto rounded-2xl bg-white p-4">
            <input name="titulo" value={form.titulo} onChange={campo} required maxLength={80} placeholder="Título" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input name="precio" value={form.precio} onChange={campo} required maxLength={12} inputMode="numeric" placeholder="Precio" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
              <input name="area" value={form.area} onChange={campo} required maxLength={5} inputMode="numeric" placeholder="Área m²" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
            </div>
            <select name="ciudad" value={form.ciudad} onChange={campo} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">
              {ciudades.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input name="direccion" value={form.direccion} onChange={campo} required maxLength={120} placeholder="Dirección" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
            <textarea name="descripcion" value={form.descripcion} onChange={campo} required maxLength={500} placeholder="Descripción" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
            <label className="w-fit cursor-pointer rounded-full border border-zinc-300 px-4 py-2 text-sm">Elegir fotos
              <input name="fotos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={verFotos} className="hidden" />
            </label>
            {[...actuales, ...previews].length ? <div className="flex flex-wrap gap-2">{[...actuales, ...previews].map((src) => <img key={src} src={src} alt="" className="h-16 w-16 rounded-lg object-cover" />)}</div> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { soltarNuevas(); setActuales([]); setAbierto(false); }} className="rounded-full border border-zinc-300 px-4 py-2 text-sm">Cancelar</button>
              <button className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white">{edit ? "Guardar" : "Publicar"}</button>
            </div>
          </form>
        </div>
      ) : null}
      {listo ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-center">
            <p className="text-lg">{listo}</p>
            <button type="button" onClick={() => setListo("")} className="mt-4 rounded-full bg-zinc-900 px-4 py-2 text-sm text-white">Listo</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
