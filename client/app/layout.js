import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import Bar from "./bar";
import "./globals.css";

export const metadata = { title: "Smart Estate" };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-white text-zinc-900">
        <ClerkProvider localization={esES}>
          <Bar />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
