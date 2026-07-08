import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AEFN - Asociación de Estudiantes de Física y Nanotecnología",
  description: "Sitio web oficial de la Asociación de Estudiantes de Física y Nanotecnología de Yachay Tech.",
  keywords: ["AEFN", "Yachay Tech", "Física", "Nanotecnología", "Asociación de Estudiantes"],
  authors: [{ name: "AEFN" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "AEFN - Asociación de Estudiantes de Física y Nanotecnología",
    description: "Sitio web oficial de la AEFN - Yachay Tech",
    siteName: "AEFN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AEFN - Yachay Tech",
    description: "Asociación de Estudiantes de Física y Nanotecnología",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
