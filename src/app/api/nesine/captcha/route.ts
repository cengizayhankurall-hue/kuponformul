process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs20.x';

import { NextResponse } from 'next/server';
import { getNesineCaptchaSession } from '@/lib/nesineBot';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getNesineCaptchaSession();
    return NextResponse.json({
      success: true,
      sessionId: data.sessionId,
      captchaImage: data.captchaImage
    });
  } catch (error: any) {
    console.error('Nesine Captcha Session Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
