import type { Metadata } from "next";
import "./globals.css";
import { comfortaa, flower, ibmMono } from './fonts';
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
    <html lang="en" className={`${comfortaa.variable} ${flower.variable} ${ibmMono.variable}`}>
      <head>
      <link href="https://fonts.googleapis.com/css2?family=Coming+Soon&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Shadows+Into+Light+Two&display=swap" rel="stylesheet" />



      </head>
      <body
        
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
