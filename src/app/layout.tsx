import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SplashScreen from '@/components/SplashScreen';
import DesktopSidebar from '@/components/DesktopSidebar';
import { getStoreSettings } from '@/lib/db';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FFE600',
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
      <body className="min-h-screen flex flex-col bg-[#EBEBEB] text-[#333333] antialiased selection:bg-[#FFE600] selection:text-[#2D3277] md:pl-16">
        <SplashScreen />
        <DesktopSidebar />
        <Header storeName={settings.storeName} tagline={settings.tagline} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
