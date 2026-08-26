import { NextResponse } from 'next/server';
import { isMockMode, mockService, supabase } from '@/lib/supabase';
import { generateFormula } from '@/lib/formulaHelper';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { predictions, filters, guarantee, userId, isMockPremium } = body;

    // Basit doğrulama
    if (!predictions || predictions.length !== 15 || !filters || !guarantee) {
      return NextResponse.json(
        { error: 'Geçersiz parametreler. 15 tahmin, filtreler ve garanti seviyesi gereklidir.' },
        { status: 400 }
      );
    }

    // 1. Olası tüm kombinasyonları kontrol et (Ön limit kontrolü)
    let baseComboCount = 1;
    for (const pred of predictions) {
      baseComboCount *= (pred.selected?.length || 1);
    }

    // Sınır kontrolü ve limit aşımı kontrolü (mevcut kodlar)...
    if (baseComboCount > 100000) {
      return NextResponse.json(
        { error: `Seçtiğiniz ihtimaller toplam ${baseComboCount.toLocaleString('tr-TR')} kombinasyon oluşturuyor. Sistem güvenliği için maksimum 100.000 kombinasyon hesaplanabilir. Lütfen banko maç ekleyin veya filtreleri daraltın.` },
        { status: 400 }
      );
    }

    const isFreeTrial = baseComboCount <= 12;
    const hasActiveSub = true; // Herkes premium gibi sınırsız işlem yapabilir

    /* 
    if (!isFreeTrial) {
      let hasActiveSub = false;

      if (isMockMode) {
        if (isMockPremium) {
          hasActiveSub = true;
        } else {
          if (!userId) {
            return NextResponse.json(
              { error: 'Lütfen işlem yapabilmek için giriş yapın.' },
              { status: 401 }
            );
          }
          const activeSub = await mockService.getActiveSubscription(userId);
          if (activeSub) {
            hasActiveSub = true;
          }
        }
      } else {
        // Gerçek Supabase üzerinden kontrol
        const authHeader = request.headers.get('authorization') || '';
        const token = authHeader.replace('Bearer ', '');
        
        if (!token || !supabase) {
          return NextResponse.json(
            { error: 'Yetkisiz erişim. Lütfen giriş yapın.' },
            { status: 401 }
          );
        }

        // Token ile kullanıcıyı doğrula
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) {
          return NextResponse.json(
            { error: 'Oturum doğrulanamadı.' },
            { status: 401 }
          );
        }

        // Aktif abonelik kontrolü
        const { data: subscriptions, error: subError } = await supabase
          .from('subscriptions')
          .select('id, end_date')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .gt('end_date', new Date().toISOString());

        if (!subError && subscriptions && subscriptions.length > 0) {
          hasActiveSub = true;
        }
      }

      if (!hasActiveSub) {
        return NextResponse.json(
          { 
            error: 'Premium Paket Gerekli', 
            code: 'PREMIUM_REQUIRED',
            message: `Hesaplamaya çalıştığınız kupon ${baseComboCount.toLocaleString('tr-TR')} kolon içeriyor. 12 kolondan büyük formülleri hesaplamak için aktif bir Gold veya Platinum üyeliğiniz olmalıdır.` 
          },
          { status: 403 }
        );
      }
    }
    */
    // 3. Formülü Hesapla
    const result = generateFormula(predictions, filters, guarantee);

    return NextResponse.json({
      success: true,
      columns: result.columns,
      totalBeforeFilters: result.totalBeforeFilters,
      totalAfterFilters: result.totalAfterFilters,
      columnCount: result.columns.length,
      probabilities: result.probabilities,
      isFreeTrial
    });

  } catch (error: any) {
    console.error('Formula Generation Error:', error);
    return NextResponse.json(
      { error: 'Hesaplama motorunda bir hata oluştu: ' + error.message },
      { status: 500 }
    );
  }
}
