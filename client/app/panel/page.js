"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Panel() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/perfil" + window.location.search);
  }, []);
  return null;
}
