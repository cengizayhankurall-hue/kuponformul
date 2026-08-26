'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, dbService } from '@/lib/supabase';
import { ShieldAlert, Users, Radio, ArrowLeft, Database } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdminAccess() {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        router.push('/auth');
        return;
      }

      const isAdmin = await dbService.checkIsAdmin(session.user.id);
      if (isAdmin) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    }
    
    checkAdminAccess();
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Yetki kontrol ediliyor...
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-4 text-center">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Yetkisiz Erişim</h1>
        <p className="text-neutral-400 mb-6 max-w-md">
          Bu sayfaya erişim yetkiniz bulunmamaktadır. Sadece sistem yöneticileri bu alanı görebilir.
        </p>
        <button 
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-neutral-950">
      {/* Sidebar (Desktop) & Top Navigation (Mobile) */}
      <div className="w-full md:w-64 bg-neutral-900 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col shrink-0">
        <div className="p-4 md:p-6 flex items-center justify-between md:block">
          <div>
            <h2 className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              ADMIN PANEL
            </h2>
            <p className="text-[11px] md:text-xs text-neutral-500 mt-0.5">Sistem Kontrol Merkezi</p>
          </div>
          <Link 
            href="/"
            className="md:hidden flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-800 text-neutral-300 text-xs rounded-lg hover:bg-neutral-700 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Siteye Dön</span>
          </Link>
        </div>
        
        {/* Navigation links: Horizontal on mobile, vertical list on desktop */}
        <div className="flex md:flex-col overflow-x-auto no-scrollbar px-3 md:px-4 pb-3 md:pb-0 gap-1.5 md:gap-2 md:flex-1">
          <Link 
            href="/admin" 
            className={`flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 md:py-3 rounded-xl whitespace-nowrap text-xs md:text-sm transition ${
              pathname === '/admin' ? 'bg-red-500/10 text-red-400 font-bold border border-red-500/20' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4 md:h-5 md:w-5" />
            <span className="font-medium">Üyeler</span>
          </Link>
          
          <Link 
            href="/admin/news" 
            className={`flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 md:py-3 rounded-xl whitespace-nowrap text-xs md:text-sm transition ${
              pathname === '/admin/news' ? 'bg-red-500/10 text-red-400 font-bold border border-red-500/20' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Radio className="h-4 w-4 md:h-5 md:w-5" />
            <span className="font-medium">Haberler (Slider)</span>
          </Link>

          <Link 
            href="/admin/data-import" 
            className={`flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 md:py-3 rounded-xl whitespace-nowrap text-xs md:text-sm transition ${
              pathname === '/admin/data-import' ? 'bg-red-500/10 text-red-400 font-bold border border-red-500/20' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Database className="h-4 w-4 md:h-5 md:w-5" />
            <span className="font-medium">Excel Yükleme</span>
          </Link>
        </div>

        <div className="hidden md:block p-4 border-t border-neutral-800">
          <Link 
            href="/"
            className="flex items-center justify-center space-x-2 w-full py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 hover:text-white transition text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Siteye Dön</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-hidden">
        <main className="flex-1 md:overflow-y-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
