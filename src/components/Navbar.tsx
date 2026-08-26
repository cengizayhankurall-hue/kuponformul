'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { isMockMode, mockService, UserProfile, Subscription, supabase, dbService } from '@/lib/supabase';
import { Award, User, LogOut, ChevronDown, Layers, Sun, Moon, Play, Sparkles, CreditCard, HelpCircle, Sigma, Menu, X, Settings } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Oturum ve abonelik kontrolü
  useEffect(() => {
    async function checkAuth() {
      if (isMockMode) {
        const { data: { session } } = await mockService.getSession();
        if (session && session.user) {
          setUser(session.user);
          const activeSub = await mockService.getActiveSubscription(session.user.id);
          setSub(activeSub);
        } else {
          setUser(null);
          setSub(null);
        }
      } else {
        // Gerçek Supabase oturumu
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          let isAdmin = false;
          if (dbService && dbService.checkIsAdmin) {
            isAdmin = await dbService.checkIsAdmin(session.user.id);
          }
          
          setUser({
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name || 'Kullanıcı',
            is_admin: isAdmin
          });
          setSub(null);
        } else {
          setUser(null);
          setSub(null);
        }
      }
    }

    checkAuth();
    // Oturum değişikliklerini dinlemek için bir tetikleyici ekleyebiliriz
    const interval = setInterval(checkAuth, 3000); // 3 saniyede bir eşitle
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (isMockMode) {
      await mockService.signOut();
    } else {
      // Supabase logout
      if (supabase) await supabase.auth.signOut();
    }
    setUser(null);
    setSub(null);
    
    // Seçimlerin (selections) ve her şeyin sıfırlanması için tam sayfa yenilemesi yapıyoruz
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const navLinks = [
    { name: 'Nasıl Kullanılır?', href: '/nasil-kullanilir' },
    { name: 'Spor Toto Formül', href: '/spor-toto' },
    { name: 'İddaa & Yapay Zeka', href: '/iddaa' },
    ...(user ? [
      { name: 'Canlı Takip', href: '/kupon-takip' },
      { name: 'Hesabım', href: '/dashboard' }
    ] : []),
    ...(user?.is_admin ? [{ name: 'Yönetim', href: '/admin' }] : []),
  ];

  return (
    <nav className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="relative flex items-center justify-center h-10 w-10 bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-sky-500/30 mr-3 transition-transform group-hover:scale-105">
                <div className="absolute inset-0 bg-white/20 rounded-xl blur-[1px]"></div>
                <Sigma className="h-6 w-6 text-white relative z-10" strokeWidth={2.5} />
                <Sparkles className="h-3.5 w-3.5 text-yellow-300 absolute -top-1 -right-1 z-10 animate-pulse" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white drop-shadow-md hidden sm:block">
                Kupon <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">Formülü</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex space-x-6 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-white ${
                  pathname === link.href ? 'text-white font-semibold' : 'text-neutral-400'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop User Info & Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {sub ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Award className="h-3 w-3 text-sky-400" />
                    <span>{sub.package_name}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-400">
                    Ücretsiz Üye
                  </span>
                )}
                <div className="flex items-center space-x-1 text-sm text-neutral-200">
                  <User className="h-4 w-4 text-neutral-400" />
                  <span>{user.full_name}</span>
                </div>
                <Link
                  href="/auth/complete-profile"
                  className="p-1.5 text-neutral-400 hover:text-sky-400 hover:bg-neutral-900 rounded-lg transition"
                  title="Profilimi Güncelle"
                >
                  <Settings className="h-4 w-4" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition cursor-pointer"
                  title="Çıkış Yap"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth"
                  className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/auth?tab=register"
                  className="px-4 py-2 text-sm bg-gradient-to-r from-sky-400 to-blue-500 text-black hover:from-sky-350 hover:to-blue-450 rounded-lg transition font-extrabold shadow-[0_0_12px_rgba(56,189,248,0.25)]"
                >
                  Katıl
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-900 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-neutral-950 px-4 py-4 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition ${
                  pathname === link.href
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <hr className="border-neutral-800" />

          {/* Mobile User Info & Auth */}
          <div className="px-3">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-neutral-200">
                    <User className="h-5 w-5 text-neutral-400" />
                    <span className="font-medium text-sm">{user.full_name}</span>
                  </div>
                  {sub && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      <Award className="h-3 w-3 text-sky-400" />
                      <span>{sub.package_name}</span>
                    </span>
                  )}
                </div>
                <Link
                  href="/auth/complete-profile"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium bg-neutral-900 text-neutral-300 hover:bg-neutral-800 rounded-lg transition mb-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Profilimi Güncelle</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/auth"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 text-center text-sm font-medium text-neutral-300 hover:bg-neutral-900 rounded-lg transition"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/auth?tab=register"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 text-center text-sm font-semibold bg-gradient-to-r from-sky-400 to-blue-500 text-black rounded-lg transition font-extrabold"
                >
                  Katıl
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
