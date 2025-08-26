import type { Metadata } from "next";
import "./globals.css";
import { comfortaa, flower, ibmMono, fredoka, comingSoon, shadowsIntoLight } from './fonts';
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "MiniMind",
  description: "Big questions, little answers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${comfortaa.variable} ${flower.variable} ${ibmMono.variable} ${fredoka.variable} ${comingSoon.variable} ${shadowsIntoLight.variable}`}>

      <body
        
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
