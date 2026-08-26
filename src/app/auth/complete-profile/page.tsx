'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Phone, User, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    async function loadUser() {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        // Oturum yoksa girişe at
        router.push('/auth');
        return;
      }
      
      const userMeta = session.user.user_metadata;
      
      // Zaten telefon numarası varsa dashboard'a at
      if (userMeta?.phone) {
        router.push('/dashboard');
        return;
      }
      
      // Google'dan gelen ismi forma yerleştir (Eğer varsa)
      if (userMeta?.full_name || userMeta?.name) {
        setFullName(userMeta.full_name || userMeta.name || '');
      }
      
      setLoading(false);
    }
    
    loadUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Lütfen geçerli bir telefon numarası girin.');
      return;
    }
    
    setError(null);
    setSaving(true);
    
    try {
      if (!supabase) throw new Error('Veritabanı bağlantısı yok.');
      
      // Kullanıcının metadata bilgisini güncelle
      const { error: updateError, data: authData } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone
        }
      });
      
      if (updateError) throw updateError;
      
      // Aynı zamanda public.profiles tablosunu da güncelle
      if (authData?.user) {
        await supabase.from('profiles').update({ 
          full_name: fullName,
          phone: phone
        }).eq('id', authData.user.id);
      }
      
      // Başarılı ise dashboard'a yönlendir
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Bilgiler kaydedilirken bir hata oluştu.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center text-neutral-400">
        Profil yükleniyor...
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col justify-center py-12 sm:px-6 lg:px-8 bg-neutral-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
          Profilinizi Tamamlayın
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-400">
          Hoş geldiniz! Sistemimizi kullanmaya başlamadan önce lütfen eksik bilgilerinizi tamamlayın.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-neutral-900/60 backdrop-blur-md py-8 px-4 border border-neutral-800 shadow-2xl rounded-xl sm:px-10 relative overflow-hidden">
          
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {error && (
            <div className="mb-6 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start space-x-2 text-red-400 text-sm">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Ad Soyad
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="block w-full pl-10 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-green-500 transition sm:text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Google'dan alınan isminizi dilerseniz değiştirebilirsiniz.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Telefon Numarası
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxxxx"
                  className="block w-full pl-10 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-green-500 transition sm:text-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-semibold rounded-lg shadow-lg hover:shadow-green-500/25 transition disabled:opacity-50 cursor-pointer"
              >
                <span>{saving ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}</span>
                {!saving && <ShieldCheck className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
