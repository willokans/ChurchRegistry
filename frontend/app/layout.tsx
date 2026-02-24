import type { Metadata, Viewport } from 'next';
import { ParishProvider } from '@/context/ParishContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Church Registry',
  description: 'Sacramental records',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ParishProvider>{children}</ParishProvider>
      </body>
    </html>
  );
}
