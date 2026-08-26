import Link from 'next/link';
import { ShieldAlert, ArrowRight, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-950 text-center relative overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-500 mb-4 tracking-tighter">
          404
        </h1>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Aradığınız Sayfa Bulunamadı
        </h2>
        
        <p className="text-neutral-400 max-w-md mb-10 text-sm sm:text-base leading-relaxed">
          Görünüşe göre bu maçın sonucu iptal edilmiş. Ulaşmaya çalıştığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/"
            className="flex items-center justify-center space-x-2 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-bold rounded-xl shadow-lg transition"
          >
            <Home className="w-5 h-5" />
            <span>Ana Sayfaya Dön</span>
          </Link>
          
          <Link
            href="/dashboard"
            className="flex items-center justify-center space-x-2 py-3 px-6 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white font-medium rounded-xl transition"
          >
            <span>Hesabıma Git</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
