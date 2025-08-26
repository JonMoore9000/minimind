import { Indie_Flower, Comfortaa, IBM_Plex_Mono, Fredoka, Coming_Soon, Shadows_Into_Light_Two } from 'next/font/google';

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

export const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-fredoka',
});

export const comingSoon = Coming_Soon({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-coming-soon',
});

export const shadowsIntoLight = Shadows_Into_Light_Two({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-shadows',
});