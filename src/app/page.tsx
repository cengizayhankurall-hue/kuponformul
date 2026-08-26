'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Trophy, BrainCircuit, Target, ArrowRight, Zap, TrendingUp, Cpu, Activity, BarChart2, Sun, Moon } from 'lucide-react';

export default function LandingPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const isDark = theme === 'dark';

  if (!mounted) return null;

  return (
    <div className={`min-h-[calc(100vh-64px)] overflow-x-hidden relative flex flex-col justify-center transition-colors duration-300 ${isDark ? 'bg-[#05050a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* --- BACKGROUND ELEMENTS --- */}
      {isDark ? (
        <>
          <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/20 blur-[150px] animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[150px] animate-pulse pointer-events-none" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </>
      ) : (
        <>
          <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-200/50 blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/50 blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </>
      )}

      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-50">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-full border transition duration-300 shadow-lg flex items-center justify-center cursor-pointer ${
            isDark
              ? 'bg-slate-900/80 border-slate-700 text-yellow-400 hover:text-yellow-300 hover:bg-slate-800'
              : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-sky-600'
          }`}
          title={isDark ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 z-10">
        
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16 space-y-5">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold tracking-wide mb-2 backdrop-blur-md transition-colors ${
            isDark 
              ? 'bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border-sky-500/20 text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.15)]' 
              : 'bg-white border-sky-200 text-sky-600 shadow-md shadow-sky-100'
          }`}>
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Kazanmanın Yeni Nesil Formülü</span>
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight px-2">
            <span className={isDark ? "text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-neutral-400" : "text-slate-900"}>
              Yapay Zeka Destekli
            </span>
            <br />
            <span className={`text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 ${isDark ? 'drop-shadow-[0_0_30px_rgba(56,189,248,0.3)]' : ''}`}>
              Tahmin & Analiz Platformu
            </span>
          </h1>
          
          <p className={`text-base sm:text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed pt-2 px-4 ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
            Spor Toto formülleriyle maliyetinizi optimize edin, <span className={isDark ? "text-white font-bold" : "text-slate-900 font-bold"}>50.000 maçlık</span> İddaa veritabanıyla kazanma şansınızı zirveye taşıyın.
          </p>
        </div>

        {/* Portals Grid */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 max-w-5xl mx-auto px-2">
          
          {/* Spor Toto Card */}
          <Link href="/spor-toto" className="group relative block flex-1 w-full min-w-0">
            {isDark && <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-400 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-60 transition duration-500" />}
            
            <div className={`relative h-full border rounded-3xl p-6 sm:p-8 transition-all duration-300 overflow-hidden group-hover:-translate-y-1 ${
              isDark 
                ? 'bg-neutral-950 border-neutral-800' 
                : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-sky-100'
            }`}>
              {isDark && <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sky-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20 group-hover:from-sky-500/20 transition-all duration-500" />}
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 p-[1px] shadow-lg transition-shadow ${isDark ? 'shadow-sky-500/30 group-hover:shadow-sky-500/50' : 'shadow-sky-300/50 group-hover:shadow-sky-400/50'}`}>
                    <div className={`w-full h-full rounded-2xl flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-neutral-950 group-hover:bg-transparent' : 'bg-white group-hover:bg-transparent'}`}>
                      <Trophy className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${isDark ? 'text-sky-400 group-hover:text-white' : 'text-sky-500 group-hover:text-white'}`} strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                    isDark ? 'bg-neutral-900 border-neutral-800 group-hover:border-sky-500/50' : 'bg-slate-50 border-slate-200 group-hover:border-sky-400/50 group-hover:bg-sky-50'
                  }`}>
                    <ArrowRight className={`w-5 h-5 transition-all duration-300 group-hover:-rotate-45 ${isDark ? 'text-neutral-400 group-hover:text-sky-400' : 'text-slate-400 group-hover:text-sky-600'}`} />
                  </div>
                </div>
                
                <h2 className={`text-2xl sm:text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Spor Toto Sihirbazı
                </h2>
                
                <p className={`text-sm sm:text-base mb-8 flex-grow leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  Akıllı filtreler ve algoritmayla 15, 14 ve 13 garantili kuponlar oluşturun. Gereksiz kolonları eleyerek bütçenizi koruyun.
                </p>
                
                <div className="space-y-3 mb-8">
                  {[
                    { icon: Target, text: 'Garantili Sistem Kuponları' },
                    { icon: TrendingUp, text: 'Sıralı İhtimal Filtreleri' },
                    { icon: Zap, text: 'Saniye İçinde Optimizasyon' }
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-neutral-900/50 border-neutral-800/50 group-hover:border-sky-500/20' 
                        : 'bg-slate-50 border-slate-100 group-hover:border-sky-200 group-hover:bg-sky-50/50'
                    }`}>
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-sky-500/10' : 'bg-sky-100'}`}>
                        <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                      </div>
                      <span className={`font-medium text-xs sm:text-sm ${isDark ? 'text-neutral-200' : 'text-slate-700'}`}>{item.text}</span>
                    </div>
                  ))}
                </div>

                <div className={`mt-auto pt-4 border-t transition-colors ${isDark ? 'border-neutral-800 group-hover:border-sky-500/30' : 'border-slate-100 group-hover:border-sky-200'}`}>
                  <div className={`flex items-center justify-between font-semibold transition-colors ${isDark ? 'text-sky-400 group-hover:text-sky-300' : 'text-sky-600 group-hover:text-sky-700'}`}>
                    <span className="text-sm sm:text-base">Hemen Kupon Oluştur</span>
                    <span className={`text-xs sm:text-sm font-normal px-2 py-1 rounded ${isDark ? 'bg-sky-500/10' : 'bg-sky-100 text-sky-700'}`}>Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Iddaa AI Card */}
          <Link href="/iddaa" className="group relative block flex-1 w-full min-w-0 mt-6 lg:mt-0">
            {isDark && <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-60 transition duration-500" />}
            
            <div className={`relative h-full border rounded-3xl p-6 sm:p-8 transition-all duration-300 overflow-hidden group-hover:-translate-y-1 ${
              isDark 
                ? 'bg-neutral-950 border-neutral-800' 
                : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100'
            }`}>
              {isDark && <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20 group-hover:from-indigo-500/20 transition-all duration-500" />}
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 p-[1px] shadow-lg transition-shadow ${isDark ? 'shadow-indigo-500/30 group-hover:shadow-indigo-500/50' : 'shadow-indigo-300/50 group-hover:shadow-indigo-400/50'}`}>
                    <div className={`w-full h-full rounded-2xl flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-neutral-950 group-hover:bg-transparent' : 'bg-white group-hover:bg-transparent'}`}>
                      <BrainCircuit className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${isDark ? 'text-indigo-400 group-hover:text-white' : 'text-indigo-500 group-hover:text-white'}`} strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                    isDark ? 'bg-neutral-900 border-neutral-800 group-hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 group-hover:border-indigo-400/50 group-hover:bg-indigo-50'
                  }`}>
                    <ArrowRight className={`w-5 h-5 transition-all duration-300 group-hover:-rotate-45 ${isDark ? 'text-neutral-400 group-hover:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                  </div>
                </div>
                
                <h2 className={`text-2xl sm:text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  İddaa Yapay Zeka
                </h2>
                
                <p className={`text-sm sm:text-base mb-8 flex-grow leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  Geçmiş 50.000 maçlık İddaa veritabanı analizini canlı olarak yapan AI asistanı ile sürprizleri ve bankoları kaçırmayın.
                </p>
                
                <div className="space-y-3 mb-8">
                  {[
                    { icon: Cpu, text: '50.000+ Maçlık Derin Analiz' },
                    { icon: Activity, text: 'Canlı Sohbet Asistanı' },
                    { icon: BarChart2, text: 'Günün Banko Tahminleri' }
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-neutral-900/50 border-neutral-800/50 group-hover:border-indigo-500/20' 
                        : 'bg-slate-50 border-slate-100 group-hover:border-indigo-200 group-hover:bg-indigo-50/50'
                    }`}>
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-100'}`}>
                        <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      </div>
                      <span className={`font-medium text-xs sm:text-sm ${isDark ? 'text-neutral-200' : 'text-slate-700'}`}>{item.text}</span>
                    </div>
                  ))}
                </div>

                <div className={`mt-auto pt-4 border-t transition-colors ${isDark ? 'border-neutral-800 group-hover:border-indigo-500/30' : 'border-slate-100 group-hover:border-indigo-200'}`}>
                  <div className={`flex items-center justify-between font-semibold transition-colors ${isDark ? 'text-indigo-400 group-hover:text-indigo-300' : 'text-indigo-600 group-hover:text-indigo-700'}`}>
                    <span className="text-sm sm:text-base">Analizlere Göz At</span>
                    <span className={`text-xs sm:text-sm font-normal px-2 py-1 rounded flex items-center gap-1 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-100 text-indigo-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-indigo-400' : 'bg-indigo-500'}`}></span> Yeni
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

        </div>
        
        {/* Stats Section */}
        <div className={`mt-12 sm:mt-16 lg:mt-20 border-t pt-8 flex flex-wrap justify-center gap-6 sm:gap-10 md:gap-24 opacity-80 ${isDark ? 'border-neutral-800/50' : 'border-slate-200'}`}>
          <div className="text-center px-4">
            <div className={`text-3xl sm:text-4xl font-black mb-1 ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400' : 'text-slate-800'}`}>50K+</div>
            <div className={`text-xs sm:text-sm font-medium uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Analiz Edilen Maç</div>
          </div>
          <div className="text-center px-4">
            <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500 mb-1">%85</div>
            <div className={`text-xs sm:text-sm font-medium uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Ortalama Başarı</div>
          </div>
          <div className="text-center px-4">
            <div className={`text-3xl sm:text-4xl font-black mb-1 ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400' : 'text-slate-800'}`}>15/15</div>
            <div className={`text-xs sm:text-sm font-medium uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Garanti Formüller</div>
          </div>
        </div>

      </div>
    </div>
  );
}
