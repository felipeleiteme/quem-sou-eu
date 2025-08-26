import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quem Sou Eu? - Personagens Bíblicos",
  description: "Jogo para adivinhar personagens bíblicos através de dicas progressivas. Pontue mais usando menos dicas e mantenha sequência de acertos!",
  keywords: [
    "Quem Sou Eu",
    "Bíblia",
    "Personagens bíblicos",
    "Jogo",
    "Dicas",
    "Next.js",
    "React",
  ],
  authors: [{ name: "Quem Sou Eu" }],
  openGraph: {
    title: "Quem Sou Eu? - Personagens Bíblicos",
    description: "Adivinhe o personagem bíblico com base em dicas.",
    url: "http://localhost:3001",
    siteName: "Quem Sou Eu?",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quem Sou Eu? - Personagens Bíblicos",
    description: "Adivinhe o personagem bíblico com base em dicas.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
