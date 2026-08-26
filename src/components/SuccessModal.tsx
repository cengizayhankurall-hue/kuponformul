'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp, Calendar, CheckCircle2, RefreshCw } from 'lucide-react';

export default function SuccessModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/success-analysis?days=3')
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            setData(res);
          }
        })
        .catch(err => {
          console.warn('Success analysis fetch error (server offline/restarting):', err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-[#111827] border border-slate-800">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex justify-between items-center bg-[#1e293b]/40">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h3 className="font-black text-sm tracking-widest text-white uppercase">
              MAÇ DETAY ANALİZİ
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-16">
               <RefreshCw className="w-10 h-10 animate-spin mb-4 text-blue-500" />
               <p className="text-sm font-bold text-white mb-2">Başarı Oranları Hesaplanıyor...</p>
               <p className="text-xs text-slate-400 max-w-xs text-center">
                 Yapay zeka son 3 güne ait maçları analiz edip gerçek skorlarla kıyaslıyor. Bu işlem biraz zaman alabilir.
               </p>
             </div>
          ) : data ? (
            <>
              {/* Genel Başarı */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900 to-[#1e293b] border border-slate-800 text-center shadow-lg relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2 relative z-10">
                  Genel Başarı Oranı (Son 3 Gün)
                </h4>
                <div className="text-6xl font-black text-white tracking-tighter mb-3 relative z-10">
                  %{data.overallPercent}
                </div>
                <p className="text-xs font-semibold text-slate-400 relative z-10">
                  <span className="text-white">{data.overallTotal}</span> Yüksek Güvenli Tahminden <span className="text-emerald-400">{data.overallSuccess}</span> Başarı
                </p>
              </div>

              {/* Günlük Detaylar */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-0.5 h-3 bg-amber-500 rounded-full"></div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Günlük Detaylar
                  </h4>
                </div>
                
                <div className="space-y-3">
                  {data.dailyStats.map((stat: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between hover:bg-slate-800/60 transition">
                       <div>
                         <h5 className="font-black text-white text-sm mb-1">{stat.date}</h5>
                         <p className="text-xs font-medium text-slate-500">
                           {stat.total} Tahmin / <span className="text-emerald-400">{stat.success} Başarı</span>
                         </p>
                       </div>
                       <div className="text-right flex flex-col items-end">
                         <span className="text-2xl font-black text-amber-500">%{stat.percent}</span>
                         <span className="text-[8px] font-bold uppercase tracking-widest text-slate-600">Başarı</span>
                       </div>
                    </div>
                  ))}
                  
                  {data.dailyStats.length === 0 && (
                    <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
                      <p className="text-sm text-slate-500">Son 3 güne ait bitmiş maç bulunamadı.</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
                <p className="text-[10px] text-amber-500/80 font-medium italic">
                  * Bu analiz, geçmiş günlere ait maçlar için sistemin üreteceği %65+ güvenli tahminlerin gerçek maç sonuçlarıyla kıyaslanmasıdır.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-red-400 text-sm">Veriler alınırken bir hata oluştu.</p>
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
