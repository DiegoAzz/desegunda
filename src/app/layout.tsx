import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getStoreSettings } from '@/lib/db';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return {
    title: `${settings.storeName} — Cosas buenas para alguien más`,
    description: 'Tienda personal para artículos nuevos, usados y regalos directos sin comisiones ni intermediarios.',
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getStoreSettings();

  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-green-100 selection:text-green-900">
        <Header storeName={settings.storeName} tagline={settings.tagline} />
        <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
