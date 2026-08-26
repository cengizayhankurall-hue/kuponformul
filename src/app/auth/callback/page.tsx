'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function checkProfile() {
      if (!supabase) {
        router.push('/dashboard');
        return;
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const phone = session.user.user_metadata?.phone;
          if (!phone) {
            router.push('/auth/complete-profile');
            return;
          }
        }
      } catch (err) {
        console.error('Session error:', err);
      }
      
      router.push('/dashboard');
    }

    const timer = setTimeout(() => {
      checkProfile();
    }, 500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[80vh] text-neutral-400">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <p>Giriş yapılıyor, yönlendiriliyorsunuz...</p>
      </div>
    </div>
  );
}
