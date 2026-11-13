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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:grid sm:h-16 sm:grid-cols-[1fr_auto_1fr] sm:px-6 sm:py-0">
        <Link href="/" className="text-lg">Smart Estate</Link>
        <nav className="order-last flex w-full justify-center gap-4 text-sm sm:order-none sm:w-auto sm:gap-5">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={path === href ? "border-b border-zinc-900" : "text-zinc-500"}>{label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center justify-end gap-2 text-sm sm:ml-0">
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
