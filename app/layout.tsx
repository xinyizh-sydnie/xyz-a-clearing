import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'xyz / a clearing — Xinyi Zhang',
  description: 'Landscape research and design by Xinyi Zhang, PhD student at UC Berkeley. Wildfire risk, defensible space, and the places we inhabit.',
  icons: { icon: './favicon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return <html lang="en"><head><style>{`@font-face{font-family:Manrope;src:url('${base}/fonts/Manrope.ttf') format('truetype');font-weight:200 800;font-style:normal;font-display:swap}`}</style></head><body>{children}</body></html>;
}
