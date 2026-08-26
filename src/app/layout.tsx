import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import AIChatBot from '@/components/AIChatBot';
import Link from 'next/link';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kupon Formülü - Spor Toto Akıllı Formül ve İddaa Yapay Zeka Platformu',
  description: 'Spor Toto kupon maliyetini en aza indiren 14-13-12 garantili formül ve gelişmiş filtreleme yazılımı.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0f172a] text-slate-100 selection:bg-sky-500 selection:text-black">
        <Navbar />
        <main className="flex-grow flex flex-col">{children}</main>
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0d1321] py-8 text-center text-xs text-slate-500 transition-colors">
          <div className="mx-auto max-w-7xl px-4 space-y-4">
            <div className="flex flex-wrap justify-center gap-4 text-slate-600 dark:text-slate-400 font-medium">
              <Link href="/nasil-kullanilir" className="hover:text-sky-500 transition-colors">Nasıl Kullanılır?</Link>
              <Link href="/kvkk" className="hover:text-sky-500 transition-colors">KVKK Aydınlatma Metni</Link>
              <Link href="/kullanim-kosullari" className="hover:text-sky-500 transition-colors">Kullanım Koşulları</Link>
              <Link href="/gizlilik-politikasi" className="hover:text-sky-500 transition-colors">Gizlilik Politikası</Link>
            </div>
            <p className="text-slate-400 dark:text-slate-500">
              © {new Date().getFullYear()} Kupon Formülü. Tüm hakları saklıdır. Bu platform bir şans oyunları analiz aracıdır.
            </p>
          </div>
        </footer>
        <AIChatBot />
      </body>
    </html>
  );
}
