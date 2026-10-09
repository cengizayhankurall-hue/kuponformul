'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { isMockMode, mockService, UserProfile, Subscription, supabase, dbService } from '@/lib/supabase';
import { 
  Award, 
  User, 
  LogOut, 
  ChevronDown, 
  Layers, 
  Sparkles, 
  Sigma, 
  Menu, 
  X, 
  Settings, 
  Zap, 
  Target, 
  Flame, 
  HelpCircle,
  Clock
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    const interval = setInterval(checkAuth, 3000);
    return () => clearInterval(interval);
  }, []);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAnalysisOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (isMockMode) {
      await mockService.signOut();
    } else {
      if (supabase) await supabase.auth.signOut();
    }
    setUser(null);
    setSub(null);
    
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const analysisTools = [
    { name: '🎟️ Günün Kuponları', href: '/gunun-kuponlari', desc: '3.00 - 15.00 Oranlı Günlük Kuponlar', isNew: true },
    { name: '🎰 Günün Sistem Kuponları', href: '/sistem-kuponlari', desc: 'Sistem 3,4,5 ve 4,5,6 Vurgun Kuponları', isNew: true },
    { name: '⚡ İY / MS Analizi', href: '/iy-ms-analizi', desc: 'İlk Yarı & Maç Sonu 9 Olasılık' },
    { name: '🎯 Kombine & Skor', href: '/yuksek-oran-analizi', desc: 'MS + Gol/KG ve En Olası 2 Skor', isNew: true },
    { name: '💥 Patlayan Oranlar', href: '/patlayan-oranlar', desc: 'Favori Takım Oran Tuzakları' },
    { name: '🔥 4.5 & İki Yarı 1.5', href: '/gol-analizi', desc: 'Yüksek Oranlı Gol Korelasyonu' },
  ];

  const isAnalysisActive = analysisTools.some(tool => pathname === tool.href);

  return (
    <nav className="border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center group">
              <div className="relative flex items-center justify-center h-10 w-10 bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-sky-500/30 mr-3 transition-transform group-hover:scale-105">
                <div className="absolute inset-0 bg-white/20 rounded-xl blur-[1px]"></div>
                <Sigma className="h-6 w-6 text-white relative z-10" strokeWidth={2.5} />
                <Sparkles className="h-3.5 w-3.5 text-yellow-300 absolute -top-1 -right-1 z-10 animate-pulse" />
              </div>
              <span className="text-xl font-black tracking-tight text-white drop-shadow-md hidden sm:block whitespace-nowrap">
                Kupon <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">Formülü</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              href="/nasil-kullanilir"
              className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition whitespace-nowrap ${
                pathname === '/nasil-kullanilir' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              Nasıl Kullanılır?
            </Link>

            <Link
              href="/spor-toto"
              className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition whitespace-nowrap ${
                pathname === '/spor-toto' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              Spor Toto Formül
            </Link>

            <Link
              href="/iddaa"
              className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition whitespace-nowrap ${
                pathname === '/iddaa' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              İddaa & AI
            </Link>

            {/* Analiz Motorları Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAnalysisOpen(!analysisOpen)}
                className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isAnalysisActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <span>⚡ Analiz Motorları</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${analysisOpen ? 'rotate-180' : ''}`} />
              </button>

              {analysisOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-neutral-900 border border-neutral-800 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[10px] font-black uppercase text-neutral-500 px-3 py-1.5">
                    Özel Analiz Araçları
                  </div>
                  {analysisTools.map((tool) => {
                    const isActive = pathname === tool.href;
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        onClick={() => setAnalysisOpen(false)}
                        className={`flex flex-col p-2.5 rounded-xl transition ${
                          isActive
                            ? 'bg-neutral-800 text-white border border-neutral-700/50'
                            : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{tool.name}</span>
                          {tool.isNew && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              YENİ
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-500 mt-0.5">{tool.desc}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {user && (
              <Link
                href="/kupon-takip"
                className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition whitespace-nowrap ${
                  pathname === '/kupon-takip' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                Canlı Takip
              </Link>
            )}

            {user?.is_admin && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition whitespace-nowrap ${
                  pathname === '/admin' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                Yönetim
              </Link>
            )}
          </div>

          {/* Desktop User Info & Auth */}
          <div className="hidden md:flex items-center space-x-3 shrink-0">
            {user ? (
              <div className="flex items-center space-x-2">
                {sub ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 whitespace-nowrap">
                    <Award className="h-3.5 w-3.5 text-sky-400" />
                    <span>{sub.package_name}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-400 whitespace-nowrap">
                    Ücretsiz Üye
                  </span>
                )}
                
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-bold transition"
                  title="Hesabım"
                >
                  <User className="h-3.5 w-3.5 text-neutral-400" />
                  <span className="max-w-[100px] truncate">{user.full_name}</span>
                </Link>

                <Link
                  href="/auth/complete-profile"
                  className="p-2 text-neutral-400 hover:text-sky-400 hover:bg-neutral-900 rounded-xl transition"
                  title="Profil Ayarları"
                >
                  <Settings className="h-4 w-4" />
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-xl transition cursor-pointer"
                  title="Çıkış Yap"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth"
                  className="px-4 py-2 text-xs lg:text-sm font-semibold text-neutral-300 hover:text-white transition"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/auth?tab=register"
                  className="px-4 py-2 text-xs lg:text-sm bg-gradient-to-r from-sky-400 to-blue-500 text-black hover:from-sky-350 hover:to-blue-450 rounded-xl transition font-extrabold shadow-[0_0_12px_rgba(56,189,248,0.25)]"
                >
                  Katıl
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900"
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
            <Link
              href="/nasil-kullanilir"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-semibold transition ${
                pathname === '/nasil-kullanilir' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              Nasıl Kullanılır?
            </Link>

            <Link
              href="/spor-toto"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-semibold transition ${
                pathname === '/spor-toto' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              Spor Toto Formül
            </Link>

            <Link
              href="/iddaa"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-semibold transition ${
                pathname === '/iddaa' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              İddaa & AI
            </Link>

            <div className="pt-2 pb-1">
              <div className="text-[10px] font-black uppercase text-amber-400 px-3 mb-1">Analiz Motorları</div>
              {analysisTools.map(tool => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-xl text-sm font-semibold transition ${
                    pathname === tool.href ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  {tool.name}
                </Link>
              ))}
            </div>

            {user && (
              <Link
                href="/kupon-takip"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-semibold transition ${
                  pathname === '/kupon-takip' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                Canlı Takip
              </Link>
            )}

            {user?.is_admin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-semibold transition ${
                  pathname === '/admin' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                Yönetim
              </Link>
            )}
          </div>

          <hr className="border-neutral-800" />

          {/* Mobile User Info & Auth */}
          <div className="px-3">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-neutral-200">
                    <User className="h-5 w-5 text-neutral-400" />
                    <span className="font-semibold text-sm">{user.full_name}</span>
                  </div>
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
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 text-xs font-semibold bg-neutral-900 text-neutral-300 rounded-xl"
                  >
                    <User className="h-4 w-4" />
                    <span>Hesabım</span>
                  </Link>
                  <Link
                    href="/auth/complete-profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 text-xs font-semibold bg-neutral-900 text-neutral-300 rounded-xl"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Profil</span>
                  </Link>
                </div>

                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl cursor-pointer"
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
                  className="px-4 py-2.5 text-center text-sm font-semibold text-neutral-300 hover:bg-neutral-900 rounded-xl"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/auth?tab=register"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 text-center text-sm font-bold bg-gradient-to-r from-sky-400 to-blue-500 text-black rounded-xl"
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
