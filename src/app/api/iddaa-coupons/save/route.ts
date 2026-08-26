import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { matches, totalOdds, stake, potentialWin, email, userId } = await request.json();

    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json({ success: false, error: 'Maç seçimi yapılmadı.' }, { status: 400 });
    }
    
    if (matches.length > 40) {
      return NextResponse.json({ success: false, error: 'Bir iddaa kuponuna en fazla 40 maç ekleyebilirsiniz.' }, { status: 400 });
    }

    if (!userId || !email) {
      return NextResponse.json({ success: false, error: 'Oturum bilgisi eksik.' }, { status: 401 });
    }

    // Insert into Supabase
    const { data, error } = await supabase!
      .from('iddaa_saved_coupons')
      .insert([
        {
          user_id: userId,
          matches: matches,
          total_odds: parseFloat(totalOdds),
          stake: parseFloat(stake),
          potential_win: parseFloat(potentialWin),
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
