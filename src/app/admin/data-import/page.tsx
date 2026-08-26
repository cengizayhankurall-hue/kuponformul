'use client';

import React, { useState } from 'react';
import { RefreshCw, UploadCloud, Calendar, CheckCircle2, AlertCircle, Database } from 'lucide-react';

export default function DataImportPage() {
  // Excel State
  const [file, setFile] = useState<File | null>(null);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [excelMessage, setExcelMessage] = useState('');

  // Live Sync State
  const [syncDate, setSyncDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });
  const [loadingSync, setLoadingSync] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setExcelMessage('Lütfen bir dosya seçin.');
      return;
    }

    setLoadingExcel(true);
    setExcelMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setExcelMessage('✅ ' + data.message);
      } else {
        setExcelMessage('❌ Hata: ' + data.error);
      }
    } catch (err: any) {
      setExcelMessage('❌ Beklenmeyen bir hata oluştu: ' + err.message);
    } finally {
      setLoadingExcel(false);
    }
  };

  const handleLiveSync = async (days?: number) => {
    setLoadingSync(true);
    setSyncMessage('');

    try {
      const url = days ? `/api/cron/sync-results?days=${days}` : `/api/cron/sync-results?date=${syncDate}`;
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setSyncMessage(`✅ ${data.message}`);
      } else {
        setSyncMessage('❌ Hata: ' + (data.error || 'Sonuçlar çekilemedi.'));
      }
    } catch (err: any) {
      setSyncMessage('❌ Bağlantı hatası: ' + err.message);
    } finally {
      setLoadingSync(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto text-slate-100 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Database className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 shrink-0" />
          <span>Veri & Maç Sonuçları Yönetimi</span>
        </h1>
        <p className="text-neutral-400 text-xs sm:text-sm mt-1">
          Geçmiş Excel arşivlerini yükleyebilir veya biten maç sonuçlarını tek tıkla Maçkolik üzerinden veritabanına eşitleyebilirsiniz.
        </p>
      </div>

      {/* 1. CANLI MAÇKOLİK SONUÇ EŞİTLEME (TEK TIKLA GÜNCELLEME) */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-sky-400 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Biten Maç Sonuçlarını & Oranlarını Eşitle (Otomatik / Manuel)
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Canlıda bu işlem her gece otomatik çalışır. Dilerseniz buradan istediğiniz günün veya son günlerin tüm sonuç ve oranlarını tek tıkla veritabanına aktarabilirsiniz.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-400" />
              Tarih Seç (Tek Gün)
            </label>
            <input 
              type="date" 
              value={syncDate}
              onChange={(e) => setSyncDate(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleLiveSync()}
              disabled={loadingSync}
              className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSync ? 'animate-spin' : ''}`} />
              {loadingSync ? 'Eşitleniyor...' : 'Seçili Günü Çek'}
            </button>

            <button
              onClick={() => handleLiveSync(3)}
              disabled={loadingSync}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl border border-neutral-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="Bugün, Dün ve Önceki Günü Toplu Çeker"
            >
              Son 3 Günü Toplu Çek
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-2 ${
            syncMessage.includes('✅') 
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300' 
              : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
          }`}>
            {syncMessage.includes('✅') ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{syncMessage}</span>
          </div>
        )}
      </div>

      {/* 2. EXCEL DOSYASI YÜKLEME */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            <UploadCloud className="w-5 h-5" />
            Toplu Arşiv Excel Dosyası Yükleme
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Toplu maç arşivi Excel dosyanızı (.xlsx, .xls, .csv) yükleyerek veritabanını genişletebilirsiniz.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-neutral-300">Excel Dosyası Seç</label>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleFileChange}
            className="block w-full text-xs text-neutral-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30 bg-neutral-950 border border-neutral-700 rounded-xl p-2 cursor-pointer"
          />
        </div>

        <button 
          onClick={handleUpload}
          disabled={loadingExcel || !file}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          {loadingExcel ? 'Yükleniyor ve İşleniyor...' : 'Excel Verilerini İçe Aktar'}
        </button>

        {excelMessage && (
          <div className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-2 ${
            excelMessage.includes('✅') 
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300' 
              : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
          }`}>
            {excelMessage.includes('✅') ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{excelMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
