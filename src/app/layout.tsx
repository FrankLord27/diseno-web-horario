import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/lib/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Horarios Escolares RD",
  description:
    "Sistema de generación de horarios escolares para colegios de República Dominicana",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
