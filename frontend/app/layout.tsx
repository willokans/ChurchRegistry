import type { Metadata, Viewport } from 'next';
import { ParishProvider } from '@/context/ParishContext';
import { PWARegister } from '@/components/PWARegister';
import './globals.css';

export const metadata: Metadata = {
  title: 'Parish Registry',
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
        <ParishProvider>
          <PWARegister />
          {children}
        </ParishProvider>
      </body>
    </html>
  );
}
