import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TelegramWebAppInit } from '@/components/TelegramWebAppInit';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Focus — Платформа обучения',
  description: 'Достигай целей с Focus. Focus Kids — английский для детей.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-background font-sans antialiased">
        <Script
          id="telegram-web-app"
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function r(){try{var t=window.Telegram&&window.Telegram.WebApp;if(t){t.ready();t.expand();return true;}return false;}catch(e){return false;} }if(r())return;var i=0;var h=setInterval(function(){if(r()||i++>60)clearInterval(h);},50);})();`,
          }}
        />
        <TelegramWebAppInit />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
