import { Indie_Flower, Comfortaa, IBM_Plex_Mono } from 'next/font/google';

export const flower = Indie_Flower({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-flower',
});

export const comfortaa = Comfortaa({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-comfortaa',
});

export const ibmMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-ibm',
});