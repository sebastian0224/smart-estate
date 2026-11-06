import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const privado = createRouteMatcher(["/panel(.*)", "/perfil(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (privado(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
