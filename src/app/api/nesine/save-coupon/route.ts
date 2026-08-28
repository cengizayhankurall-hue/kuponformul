process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs20.x';

import { NextResponse } from 'next/server';
import { saveNesineCouponWithSession } from '@/lib/nesineBot';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, username, password, captcha, couponName, columns } = body;

    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Lütfen Nesine Üye No / T.C. Kimlik ve Şifrenizi giriniz.' 
      }, { status: 400 });
    }

    if (!captcha) {
      return NextResponse.json({ 
        success: false, 
        error: 'Lütfen güvenlik kodunu (Captcha) giriniz.' 
      }, { status: 400 });
    }

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Kaydedilecek kolon bulunamadı.' 
      }, { status: 400 });
    }

    const result = await saveNesineCouponWithSession(
      sessionId,
      username,
      password,
      captcha,
      couponName,
      columns
    );

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error: any) {
    console.error('Nesine Save Coupon Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Nesine bağlantısı sırasında bir hata oluştu.' 
    }, { status: 500 });
  }
}
