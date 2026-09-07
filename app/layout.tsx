import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'xyz / a clearing — Xinyi Zhang',
  description: 'Landscape research and design by Xinyi Zhang, PhD student at UC Berkeley. Wildfire risk, defensible space, and the places we inhabit.',
  icons: { icon: './favicon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
