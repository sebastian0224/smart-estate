"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";

const links = [
  ["/", "Inicio"],
  ["/inmuebles", "Inmuebles"],
  ["/contacto", "Contacto"],
];

function Avatar() {
  const { user } = useUser();
  return (
    <Link href="/perfil" className="block h-8 w-8 overflow-hidden rounded-full bg-zinc-200">
      {user?.imageUrl ? <img src={user.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
    </Link>
  );
}

export default function Bar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0 text-lg">smart estate</Link>
        <nav className="mx-auto flex gap-5 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={path === href ? "border-b border-zinc-900" : "text-zinc-500"}>{label}</Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2 text-sm">
          <SignedIn>
            <Avatar />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-full bg-zinc-900 px-4 py-2 text-white">Entrar</button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
