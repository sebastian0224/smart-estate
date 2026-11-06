"use client";
import { useEffect, useState } from "react";
import { SignInButton, useAuth } from "@clerk/nextjs";

const api = "http://localhost:4000";
let ids = null;
let pending = null;

function traer(token) {
  if (ids) return Promise.resolve(ids);
  if (!pending) {
    pending = fetch(`${api}/guardados`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("no");
        ids = data.map((p) => p.id);
        pending = null;
        return ids;
      })
      .catch(() => {
        pending = null;
        return [];
      });
  }
  return pending;
}

export default function Guardar({ id }) {
  const { isSignedIn, getToken } = useAuth();
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      ids = null;
      setOn(false);
      return;
    }
    getToken().then(async (token) => {
      const lista = await traer(token);
      setOn(lista.some((item) => String(item) === String(id)));
    });
  }, [isSignedIn, id]);

  async function click(e) {
    e.preventDefault();
    e.stopPropagation();
    const token = await getToken();
    const r = await fetch(`${api}/guardados`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ propiedad_id: id }),
    });
    const data = await r.json();
    setOn(!!data.guardado);
    if (ids) ids = data.guardado ? [...ids, Number(id)] : ids.filter((item) => String(item) !== String(id));
  }

  const clase = "mt-2 rounded-full border border-zinc-300 px-3 py-1 text-xs";
  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button type="button" className={clase}>Guardar contacto</button>
      </SignInButton>
    );
  }
  return <button type="button" onClick={click} className={clase}>{on ? "Guardado" : "Guardar contacto"}</button>;
}
