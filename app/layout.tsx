import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'xyz / A Clearing — Sydnie Zhang',
  description: 'Xinyi (Sydnie) Zhang is a landscape architect and climate hazard researcher, and a PhD student at UC Berkeley. Research, landscape architecture, and drawings.',
  icons: { icon: './favicon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
