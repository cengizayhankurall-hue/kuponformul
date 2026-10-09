import { NextResponse } from 'next/server';
import { supabase, isMockMode } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { matches, totalOdds, stake, potentialWin, email, userId } = await request.json();

    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json({ success: false, error: 'Maç seçimi yapılmadı.' }, { status: 400 });
    }
    
    if (matches.length > 40) {
      return NextResponse.json({ success: false, error: 'Bir iddaa kuponuna en fazla 40 maç ekleyebilirsiniz.' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Kupon kaydetmek için lütfen önce giriş yapın.' }, { status: 401 });
    }

    if (isMockMode || !supabase) {
      const mockCoupon = {
        id: 'iddaa-' + Date.now(),
        user_id: userId,
        matches: matches,
        total_odds: parseFloat(totalOdds || '1'),
        stake: parseFloat(stake || '50'),
        potential_win: parseFloat(potentialWin || '0'),
        status: 'pending',
        created_at: new Date().toISOString()
      };
      return NextResponse.json({ success: true, coupon: mockCoupon });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('iddaa_saved_coupons')
      .insert([
        {
          user_id: userId,
          matches: matches,
          total_odds: parseFloat(totalOdds || '1'),
          stake: parseFloat(stake || '50'),
          potential_win: parseFloat(potentialWin || '0'),
          status: 'pending'
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error saving iddaa coupon:', error);
      throw error;
    }

    return NextResponse.json({ success: true, coupon: data[0] });

  } catch (error: any) {
    console.error('Save iddaa coupon error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Kupon kaydedilirken bir hata oluştu.' }, { status: 500 });
  }
}
