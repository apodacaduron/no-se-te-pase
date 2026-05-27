import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "No se te pase",
  description:
    "Controla tus fechas de pago: tarjetas de crédito, servicios, seguros y suscripciones. Nunca vuelvas a pagar un recargo.",
  keywords: ["pagos", "recordatorio", "tarjetas", "vencimiento", "CFE", "agua", "finanzas personales"],
  authors: [{ name: "Daniel Apodaca" }],
  openGraph: {
    title: "No se te pase 🔔",
    description: "Todos tus pagos y fechas de vencimiento en un solo lugar.",
    type: "website",
    locale: "es_MX",
  },
  twitter: {
    card: "summary",
    title: "No se te pase 🔔",
    description: "Todos tus pagos y fechas de vencimiento en un solo lugar.",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔔</text></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
