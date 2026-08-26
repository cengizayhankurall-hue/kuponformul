'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { isMockMode, mockService, dbService, UserProfile, SavedCoupon } from '@/lib/supabase';
import { ScrapedMatch } from '@/app/api/fetch-matches/route';
import { Play, Activity, Clock, ShieldCheck, AlertTriangle, FileText, Sparkles, ChevronLeft, Award } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function KuponTakipPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [coupons, setCoupons] = useState<SavedCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCoupon, setSelectedCoupon] = useState<SavedCoupon | null>(null);
  const [matches, setMatches] = useState<ScrapedMatch[]>([]);
  
  // User entered live results: array of 15 strings or null
  const [liveResults, setLiveResults] = useState<(string | null)[]>(Array(15).fill(null));
  const [activeFilter, setActiveFilter] = useState<number | null>(null);

  // Load User
  useEffect(() => {
    async function loadUser() {
      if (isMockMode) {
        const { data: { session } } = await mockService.getSession();
        if (session && session.user) {
          setUser(session.user);
          loadCoupons(session.user.id);
        } else {
          setLoading(false);
        }
      } else {
        const { supabase } = await import('@/lib/supabase');
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user) {
            const profile = {
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata?.full_name || 'Kullanıcı',
            };
            setUser(profile);
            loadCoupons(profile.id);
          } else {
            setLoading(false);
          }
        }
      }
    }
    loadUser();
  }, []);

  async function loadCoupons(userId: string) {
    setLoading(true);
    const res = await dbService.getSavedCoupons(userId);
    if (res.data) {
      setCoupons(res.data);
    }
    setLoading(false);
  }

  // When a coupon is selected, fetch the matches for that round
  useEffect(() => {
    if (!selectedCoupon) return;
    
    // Eğer kuponla birlikte maç isimleri kaydedilmişse doğrudan onu kullan
    if (selectedCoupon.matches_data && Array.isArray(selectedCoupon.matches_data) && selectedCoupon.matches_data.length > 0) {
      setMatches(selectedCoupon.matches_data);
      const initialResults = selectedCoupon.matches_data.map((m: any) => m.outcome || null);
      setLiveResults(initialResults);
      return;
    }

    async function loadMatchesForRound() {
      try {
        const res = await fetch(`/api/fetch-matches?roundId=${selectedCoupon?.round_id}`);
        const data = await res.json();
        if (data.success && data.matches) {
          setMatches(data.matches);
          // Initialize live results with actual outcomes if available
          const initialResults = data.matches.map((m: any) => m.outcome || null);
          setLiveResults(initialResults);
        }
      } catch (err) {
        console.error('Matches fetch error:', err);
      }
    }
    loadMatchesForRound();
  }, [selectedCoupon]);

  const handleSetResult = (index: number, result: string | null) => {
    const newResults = [...liveResults];
    if (newResults[index] === result) {
      newResults[index] = null; // unselect
    } else {
      newResults[index] = result;
    }
    setLiveResults(newResults);
  };

  // Calculate continuing columns
  const stats = useMemo(() => {
    if (!selectedCoupon || !selectedCoupon.generated_columns || selectedCoupon.generated_columns.length === 0) {
      return { c15: 0, c14: 0, c13: 0, c12: 0, total: selectedCoupon?.columns_count || 0, topColumns: [] };
    }
    
    const cols = selectedCoupon.generated_columns;
    let c15 = 0;
    let c14 = 0;
    let c13 = 0;
    let c12 = 0;

    const scoredCols = [];

    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];
      let mistakes = 0;
      
      // Compare only played matches
      for (let j = 0; j < 15; j++) {
        const playedResult = liveResults[j];
        if (playedResult && col[j] !== playedResult) {
          mistakes++;
        }
      }

      if (mistakes === 0) c15++;
      if (mistakes <= 1) c14++;
      if (mistakes <= 2) c13++;
      if (mistakes <= 3) c12++;

      scoredCols.push({ col, mistakes, index: i + 1 });
    }

    // Sort by mistakes ascending
    scoredCols.sort((a, b) => a.mistakes - b.mistakes);

    let filteredCols = scoredCols;
    if (activeFilter !== null) {
      filteredCols = scoredCols.filter(c => c.mistakes === (15 - activeFilter));
    }

    return {
      c15, c14, c13, c12, total: cols.length, topColumns: filteredCols.slice(0, 5)
    };
  }, [selectedCoupon, liveResults, activeFilter]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-white font-sans flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-sky-400">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-white font-sans flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Giriş Yapmanız Gerekiyor</h2>
          <p className="text-slate-400 mb-6">Kuponlarınızı takip etmek için lütfen giriş yapın veya kayıt olun.</p>
          <Link href="/auth/login" className="px-6 py-3 bg-sky-500 text-black font-bold rounded-lg hover:bg-sky-400 transition">
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0f172a] text-white font-sans flex flex-col">

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="h-8 w-8 text-sky-400" />
          <h1 className="text-3xl font-black text-white tracking-tight">Canlı Kupon Takibi</h1>
        </div>

        {!selectedCoupon ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-300">Kayıtlı Kuponlarınız</h2>
            
            {coupons.length === 0 ? (
              <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl text-center space-y-4">
                <FileText className="h-12 w-12 text-slate-600 mx-auto" />
                <p className="text-slate-400">Henüz kaydedilmiş bir formüllü kuponunuz bulunmuyor.</p>
                <Link href="/" className="inline-block px-5 py-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold rounded-xl hover:bg-sky-500/20 transition">
                  Formül Oluşturmaya Git
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-sky-500/50 transition cursor-pointer" onClick={() => setSelectedCoupon(coupon)}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-bold text-sky-500 uppercase tracking-wider">{coupon.round_id === 'Aktif' ? 'Güncel Hafta' : coupon.round_id}</span>
                        <h3 className="text-lg font-bold mt-1 text-slate-200">{coupon.columns_count} Kolon</h3>
                      </div>
                      <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs font-black text-slate-300 border border-slate-700">
                        {coupon.guarantee_level}G
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(coupon.created_at).toLocaleString('tr-TR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            <button onClick={() => setSelectedCoupon(null)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
              <ChevronLeft className="h-4 w-4" />
              Kupon Listesine Dön
            </button>
            
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Sol Taraf: Maç Sonuçları Girişi */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Play className="h-5 w-5 text-green-400" />
                        Canlı Maç Sonuçları
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">Oynanan maçların sonucunu işaretleyerek kuponunuzun durumunu canlı takip edin.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-3 px-2 w-8">No</th>
                          <th className="py-3 px-4">Ev Sahibi</th>
                          <th className="py-3 px-4">Deplasman</th>
                          <th className="py-3 px-4 text-center">Maç Sonucu</th>
                          {stats.topColumns.length > 0 && stats.topColumns.map((c, i) => (
                            <th key={i} className="py-3 px-1 text-center w-10 text-[10px] uppercase">
                              <div className={`rounded px-1 py-1 ${c.mistakes === 0 ? 'bg-green-500/20 text-green-400' : (c.mistakes === 1 ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-300')}`}>
                                <div className="font-black text-xs">{15 - c.mistakes}</div>
                                <div className="text-[8px] font-normal opacity-70">İhtimal</div>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {matches.length > 0 ? matches.map((match, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30 transition">
                            <td className="py-2 px-2 text-slate-500 font-bold">{idx + 1}</td>
                            <td className="py-2 px-4 font-semibold text-slate-200">{match.homeTeam}</td>
                            <td className="py-2 px-4 font-semibold text-slate-200">{match.awayTeam}</td>
                            <td className="py-2 px-4">
                              <div className="flex gap-1 justify-center">
                                {['1', 'X', '2'].map((res) => (
                                  <button
                                    key={res}
                                    onClick={() => handleSetResult(idx, res)}
                                    className={`w-10 h-8 rounded-md font-black text-xs transition border flex items-center justify-center ${
                                      liveResults[idx] === res 
                                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-600'
                                    }`}
                                  >
                                    {res}
                                  </button>
                                ))}
                              </div>
                            </td>
                            {stats.topColumns.length > 0 && stats.topColumns.map((c, colIdx) => {
                              const prediction = c.col[idx];
                              const actualResult = liveResults[idx];
                              
                              let bgColor = "bg-slate-800 text-slate-400 border-slate-700/50";
                              if (actualResult) {
                                if (prediction === actualResult) {
                                  bgColor = "bg-green-500/20 text-green-400 border-green-500/30";
                                } else {
                                  bgColor = "bg-red-500/20 text-red-400 border-red-500/30";
                                }
                              }

                              return (
                                <td key={colIdx} className="py-2 px-1 text-center">
                                  <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded border font-black text-xs ${bgColor}`}>
                                    {prediction}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        )) : (
                          <tr><td colSpan={4} className="py-8 text-center text-slate-500">Maçlar yükleniyor...</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sağ Taraf: Canlı Takip Panosu */}
              <div className="space-y-4">
                <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <ShieldCheck className="h-32 w-32" />
                  </div>
                  
                  <div className="relative z-10">
                    <span className="px-3 py-1 bg-sky-500/10 text-sky-400 font-bold text-[10px] uppercase tracking-wider rounded-lg border border-sky-500/20">
                      Sistem: {selectedCoupon.guarantee_level} Garantili
                    </span>
                    <h2 className="text-2xl font-black mt-4 mb-1">{stats.total} Kolon</h2>
                    <p className="text-xs text-slate-400 mb-6 border-b border-slate-800 pb-4">Toplam oynanan kolon sayısı</p>

                    <div className="space-y-3">
                      <button onClick={() => setActiveFilter(activeFilter === 15 ? null : 15)} className={`w-full text-left bg-slate-900/80 border ${activeFilter === 15 ? 'border-green-500 ring-1 ring-green-500' : 'border-slate-700/50 hover:border-slate-600'} rounded-xl p-4 flex items-center justify-between transition cursor-pointer`}>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-green-400" />
                          <span className="font-bold text-slate-200 text-sm">15 İhtimali Devam Eden</span>
                        </div>
                        <span className="text-xl font-black text-green-400">{stats.c15}</span>
                      </button>

                      <button onClick={() => setActiveFilter(activeFilter === 14 ? null : 14)} className={`w-full text-left bg-slate-900/80 border ${activeFilter === 14 ? 'border-sky-500 ring-1 ring-sky-500' : 'border-slate-800 hover:border-slate-700'} rounded-xl p-4 flex items-center justify-between transition cursor-pointer`}>
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-sky-400" />
                          <span className="font-bold text-slate-300 text-sm">14 İhtimali Devam Eden</span>
                        </div>
                        <span className="text-xl font-black text-sky-400">{stats.c14}</span>
                      </button>

                      <button onClick={() => setActiveFilter(activeFilter === 13 ? null : 13)} className={`w-full text-left bg-slate-900/80 border ${activeFilter === 13 ? 'border-yellow-500 ring-1 ring-yellow-500' : 'border-slate-800 hover:border-slate-700'} rounded-xl p-4 flex items-center justify-between transition cursor-pointer`}>
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-yellow-500" />
                          <span className="font-bold text-slate-400 text-sm">13 İhtimali Devam Eden</span>
                        </div>
                        <span className="text-xl font-black text-yellow-500">{stats.c13}</span>
                      </button>
                      
                      <button onClick={() => setActiveFilter(activeFilter === 12 ? null : 12)} className={`w-full text-left bg-slate-900/80 border ${activeFilter === 12 ? 'border-slate-400 ring-1 ring-slate-400' : 'border-slate-800 hover:border-slate-700'} rounded-xl p-4 flex items-center justify-between transition cursor-pointer`}>
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-slate-400" />
                          <span className="font-bold text-slate-500 text-sm">12 İhtimali Devam Eden</span>
                        </div>
                        <span className="text-xl font-black text-slate-400">{stats.c12}</span>
                      </button>

                      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-bold">Yatan Kolon Sayısı</span>
                        <span className="text-sm font-black text-red-500">
                          {stats.total - stats.c12}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {(!selectedCoupon.generated_columns || selectedCoupon.generated_columns.length === 0) && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3 text-yellow-500 text-sm">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <p>Bu kupon eski versiyonda kaydedildiği için detaylı kolon takibi yapılamamaktadır. Lütfen yeni bir kupon kaydedin.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
