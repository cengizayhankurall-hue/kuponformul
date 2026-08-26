'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isMockMode, mockService, supabase } from '@/lib/supabase';
import { Mail, Lock, User, ShieldAlert, ShieldCheck, ArrowRight, Phone } from 'lucide-react';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot_password'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // URL parametresi değiştikçe tabı güncelle
    const tab = searchParams.get('tab');
    if (tab === 'register') setActiveTab('register');
    else setActiveTab('login');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isMockMode) {
        // Mock Giriş/Kayıt Simülasyonu
        const { data, error: mockErr } = await mockService.signIn(email, activeTab === 'register' ? fullName : undefined);
        if (mockErr) throw new Error(mockErr);
        
        // Simülasyon başarılı, yönlendir
        router.push('/dashboard');
        router.refresh();
      } else {
        // Gerçek Supabase Auth
        if (!supabase) return;
        
        if (activeTab === 'login') {
          const { error: err } = await supabase.auth.signInWithPassword({ email, password });
          if (err) throw err;
          router.push('/dashboard');
          router.refresh();
        } else if (activeTab === 'forgot_password') {
          const { error: err } = await supabase.auth.resetPasswordForEmail(email);
          if (err) throw err;
          setSuccessMsg('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
          setActiveTab('login');
          setLoading(false);
          return;
        } else {
          const { error: err } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName, phone: phone }
            }
          });
          if (err) throw err;
          setSuccessMsg('Kayıt başarılı! Lütfen e-postanızı kontrol edip hesabınızı onaylayın.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    
    if (isMockMode) {
      // Test aşamasında olduğumuz için doğrudan giriş yapıyoruz (Simülasyon)
      await mockService.signIn('demo@stformul.com', 'Demo Kullanıcı');
      router.push('/dashboard');
      router.refresh();
    } else {
      try {
        if (!supabase) return;
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });
      } catch (e) {
        console.error(e);
        setError('Google girişi başlatılamadı. Lütfen Supabase ayarlarınızı kontrol edin.');
      }
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col justify-center py-12 sm:px-6 lg:px-8 bg-neutral-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
          {activeTab === 'login' ? 'Hesabınıza Giriş Yapın' : activeTab === 'register' ? 'Yeni Hesap Oluşturun' : 'Şifrenizi Sıfırlayın'}
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-400">
          Formüllü Spor Toto dünyasına adım atın
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-neutral-900/60 backdrop-blur-md py-8 px-4 border border-neutral-800 shadow-2xl rounded-xl sm:px-10 relative overflow-hidden">
          
          {/* Glowing gradient background element */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Tabs */}
          {activeTab !== 'forgot_password' ? (
            <div className="flex border-b border-neutral-800 mb-6">
              <button
                onClick={() => setActiveTab('login')}
                className={`w-1/2 pb-3 text-sm font-semibold text-center transition border-b-2 ${
                  activeTab === 'login'
                    ? 'border-green-500 text-white'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Giriş Yap
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`w-1/2 pb-3 text-sm font-semibold text-center transition border-b-2 ${
                  activeTab === 'register'
                    ? 'border-green-500 text-white'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Kayıt Ol
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-sm text-neutral-400 mb-4">
                Hesabınıza bağlı e-posta adresini girin. Size bir şifre sıfırlama bağlantısı göndereceğiz.
              </p>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg flex items-start space-x-2 text-green-400 text-sm">
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start space-x-2 text-red-400 text-sm">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {activeTab === 'register' && (
              <div className="space-y-5">
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
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                E-posta Adresi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="isim@domain.com"
                  className="block w-full pl-10 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-green-500 transition sm:text-sm"
                />
              </div>
            </div>

            {activeTab !== 'forgot_password' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-neutral-300">
                    Şifre
                  </label>
                  {activeTab === 'login' && (
                    <button type="button" onClick={() => setActiveTab('forgot_password')} className="text-xs text-sky-400 hover:text-sky-300 transition">
                      Şifremi unuttum
                    </button>
                  )}
                </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500">
                  <Lock className="h-4 w-4" />
                </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-green-500 transition sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-semibold rounded-lg shadow-lg hover:shadow-green-500/25 transition disabled:opacity-50 cursor-pointer"
                >
                  <span>{loading ? 'Bekleyin...' : activeTab === 'login' ? 'Giriş Yap' : activeTab === 'register' ? 'Kayıt Ol' : 'Bağlantı Gönder'}</span>
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
                
                {activeTab === 'forgot_password' && (
                  <button type="button" onClick={() => setActiveTab('login')} className="w-full text-center mt-4 text-xs text-neutral-500 hover:text-white transition">
                    Giriş sayfasına geri dön
                  </button>
                )}
            </div>
          </form>

          {activeTab !== 'forgot_password' && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-800" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-neutral-900 text-neutral-500">
                    Veya şununla devam edin
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-neutral-700 rounded-lg shadow-sm bg-neutral-950 text-sm font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition focus:outline-none cursor-pointer"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google ile Giriş Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[80vh] text-neutral-400">
        Yükleniyor...
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
