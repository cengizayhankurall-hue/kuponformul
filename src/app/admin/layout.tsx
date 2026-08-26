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
    <div className="flex min-h-screen bg-neutral-950">
      {/* Sidebar */}
      <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
            ADMIN PANEL
          </h2>
          <p className="text-xs text-neutral-500 mt-1">Sistem Kontrol Merkezi</p>
        </div>
        
        <div className="flex-1 px-4 space-y-2">
          <Link 
            href="/admin" 
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
              pathname === '/admin' ? 'bg-red-500/10 text-red-400' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="font-medium">Üyeler</span>
          </Link>
          
          <Link 
            href="/admin/news" 
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
              pathname === '/admin/news' ? 'bg-red-500/10 text-red-400' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Radio className="h-5 w-5" />
            <span className="font-medium">Haberler (Slider)</span>
          </Link>

          <Link 
            href="/admin/data-import" 
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
              pathname === '/admin/data-import' ? 'bg-red-500/10 text-red-400' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Database className="h-5 w-5" />
            <span className="font-medium">Excel Yükleme</span>
          </Link>
        </div>

        <div className="p-4 border-t border-neutral-800">
          <Link 
            href="/"
            className="flex items-center justify-center space-x-2 w-full py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Siteye Dön</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
