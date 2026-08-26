import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isMockMode = !supabaseUrl || !supabaseAnonKey;

if (isMockMode && typeof window !== 'undefined') {
  console.warn('⚠️ Supabase URL ve Anon Key bulunamadı. Uygulama MOCK (Simüle) modunda çalışıyor.');
}

// Gerçek Supabase İstemcisi
export const supabase = !isMockMode ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Mock Veri Tipleri
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  is_admin?: boolean;
}

export interface NewsAnnouncement {
  id: string;
  title: string;
  description: string;
  badge_text: string;
  button_text: string;
  button_action: string;
  bg_image_url?: string;
  is_active: boolean;
  sort_order: number;
  target_page?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  package_id: string;
  package_name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired';
}

export interface Package {
  id: string;
  name: string;
  description: string;
  price_try: number;
  duration_days: number;
}

// Varsayılan Paketler (Mock ve Gerçek için Ortak Referans)
export const DEFAULT_PACKAGES: Package[] = [
  {
    id: 'pkg-weekly-gold',
    name: 'Haftalık Gold',
    description: '1 haftalık sınırsız formül hesaplama ve gelişmiş filtreler',
    price_try: 150.00,
    duration_days: 7
  },
  {
    id: 'pkg-monthly-platinum',
    name: 'Aylık Platinum',
    description: '1 aylık sınırsız formül hesaplama, canlı oran analizleri ve gelişmiş filtreler',
    price_try: 450.00,
    duration_days: 30
  },
  {
    id: 'pkg-season-vip',
    name: 'Sezonluk VIP',
    description: 'Tüm sezon boyunca sınırsız erişim ve özel kupon paylaşım grubu erişimi',
    price_try: 1900.00,
    duration_days: 300
  }
];

// Mock Servis Arayüzü (Yerel Hafıza ile Çalışır)
class MockService {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  }

  private setStorageItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Kullanıcı Giriş/Kayıt Simülasyonu
  async signIn(email: string, full_name?: string) {
    const user: UserProfile = {
      id: 'mock-user-123',
      email: email,
      full_name: full_name || email.split('@')[0]
    };
    this.setStorageItem('mock_user', user);
    return { data: { user }, error: null };
  }

  async signOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_user');
      localStorage.removeItem('mock_subscription');
    }
    return { error: null };
  }

  async getSession() {
    const user = this.getStorageItem<UserProfile | null>('mock_user', null);
    return { data: { session: user ? { user } : null }, error: null };
  }

  // Abonelik Sorgulama
  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    const sub = this.getStorageItem<Subscription | null>('mock_subscription', null);
    if (!sub) return null;
    
    // Süre kontrolü
    if (new Date(sub.end_date) < new Date()) {
      sub.status = 'expired';
      this.setStorageItem('mock_subscription', sub);
      return null;
    }
    return sub;
  }

  // Paket Satın Alma (Mock Ödeme)
  async purchasePackage(userId: string, packageId: string): Promise<Subscription> {
    const selectedPkg = DEFAULT_PACKAGES.find(p => p.id === packageId) || DEFAULT_PACKAGES[1];
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + selectedPkg.duration_days);

    const subscription: Subscription = {
      id: 'mock-sub-' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      package_id: selectedPkg.id,
      package_name: selectedPkg.name,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: 'active'
    };

    this.setStorageItem('mock_subscription', subscription);
    
    // İşlem kaydı simülasyonu
    const txs = this.getStorageItem<any[]>('mock_transactions', []);
    txs.push({
      id: 'mock-tx-' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      package_id: packageId,
      amount: selectedPkg.price_try,
      status: 'success',
      created_at: startDate.toISOString()
    });
    this.setStorageItem('mock_transactions', txs);

    return subscription;
  }

  async getTransactions(userId: string) {
    return this.getStorageItem<any[]>('mock_transactions', []);
  }

  // Kupon Kaydetme
  async saveCoupon(userId: string, email: string, roundId: string, predictions: string[][], columnsCount: number, guaranteeLevel: number, generatedColumns?: string[][], matchesData?: any[]): Promise<{ data: SavedCoupon | null; error: any }> {
    const coupons = this.getStorageItem<SavedCoupon[]>('mock_saved_coupons', []);
    const newCoupon: SavedCoupon = {
      id: 'mock-coupon-' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      email: email,
      round_id: roundId,
      predictions: predictions,
      columns_count: columnsCount,
      guarantee_level: guaranteeLevel,
      generated_columns: generatedColumns || [],
      matches_data: matchesData,
      created_at: new Date().toISOString()
    };
    coupons.push(newCoupon);
    this.setStorageItem('mock_saved_coupons', coupons);
    return { data: newCoupon, error: null };
  }

  // Üyenin Kayıtlı Kuponlarını Getir
  async getSavedCoupons(userId: string): Promise<SavedCoupon[]> {
    const coupons = this.getStorageItem<SavedCoupon[]>('mock_saved_coupons', []);
    return coupons.filter(c => c.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Üyenin Kuponunu Sil
  async deleteCoupon(couponId: string): Promise<boolean> {
    const coupons = this.getStorageItem<SavedCoupon[]>('mock_saved_coupons', []);
    const filtered = coupons.filter(c => c.id !== couponId);
    this.setStorageItem('mock_saved_coupons', filtered);
    return true;
  }

  // Liderlik Tablosunu Hesapla / Getir
  async getLeaderboard(roundId: string, matches: any[]): Promise<any[]> {
    const coupons = this.getStorageItem<SavedCoupon[]>('mock_saved_coupons', []);
    let roundCoupons = coupons.filter(c => c.round_id === roundId);

    // Eğer o hafta için veritabanında yeterli kupon yoksa, test amaçlı gerçekçi mock kuponlar üretelim (Sosyal Kanıt Simülasyonu)
    if (roundCoupons.length < 5) {
      const mockNames = ['ahmet', 'mehmet', 'hakan', 'kubilay', 'emre', 'yusuf', 'can', 'oguz', 'serkan', 'volkan'];
      const mockCouponsList: SavedCoupon[] = mockNames.map((name, i) => {
        // Maçların sonuçlarına göre gerçekçi bir tahmin listesi üretelim
        const mockPredictions = matches.map((m) => {
          const outcome = m.outcome;
          // %80 olasılıkla doğru sonucu tahmin etmiş olsunlar
          if (outcome && Math.random() < 0.8) {
            return [outcome];
          } else {
            // Yanlış tahmin veya çifte şans
            return [outcome === '1' ? 'X' : '1'];
          }
        });

        // Rastgele garanti seviyesi ve kolon adedi
        const guarantee = [15, 14, 13, 12][Math.floor(Math.random() * 4)];
        const cols = [16, 32, 64, 128, 256, 512][Math.floor(Math.random() * 6)];

        return {
          id: `mock-leader-${roundId}-${i}`,
          user_id: `mock-user-${name}`,
          email: `${name}@stformul.com`,
          round_id: roundId,
          predictions: mockPredictions,
          columns_count: cols,
          guarantee_level: guarantee,
          created_at: new Date(Date.now() - i * 3600000).toISOString()
        };
      });

      // Mevcut kuponlarla birleştir
      roundCoupons = [...roundCoupons, ...mockCouponsList];
    }

    // Her kuponun başarısını hesapla
    const scoredCoupons = roundCoupons.map((c) => {
      let correctCount = 0;
      matches.forEach((m, idx) => {
        const outcome = m.outcome;
        const pred = c.predictions[idx] || [];
        if (outcome && pred.includes(outcome)) {
          correctCount++;
        }
      });

      // Formül garanti seviyesine göre nihai başarıyı hesapla
      let payoutTierWon = null;
      if (correctCount === 15) {
        payoutTierWon = c.guarantee_level;
      } else if (correctCount === 14 && c.guarantee_level <= 14) {
        payoutTierWon = c.guarantee_level;
      } else if (correctCount === 13 && c.guarantee_level <= 13) {
        payoutTierWon = c.guarantee_level;
      } else if (correctCount === 12 && c.guarantee_level <= 12) {
        payoutTierWon = c.guarantee_level;
      } else if (correctCount < 12) {
        payoutTierWon = null; // Hiçbir kategoriye giremedi
      } else {
        payoutTierWon = correctCount;
      }

      // Kullanıcı adını maskele (örn: ahmet@stformul.com -> ahm****)
      const username = c.email.split('@')[0];
      const maskedName = username.substring(0, Math.min(4, username.length)) + '****';

      return {
        id: c.id,
        email: c.email,
        maskedName,
        columns_count: c.columns_count,
        guarantee_level: c.guarantee_level,
        correctCount,
        payoutTierWon,
        created_at: c.created_at
      };
    });

    // Sıralama kriteri:
    // 1. payoutTierWon (15, 14, 13, 12 - en yüksek olan üstte)
    // 2. correctCount (en çok doğru bilen üstte)
    // 3. columns_count (daha az kolon oynayan üstte - maliyet başarısı!)
    return scoredCoupons.sort((a, b) => {
      const aTier = a.payoutTierWon || 0;
      const bTier = b.payoutTierWon || 0;
      if (bTier !== aTier) return bTier - aTier;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return a.columns_count - b.columns_count;
    }).slice(0, 10); // Top 10 listesi
  }
}

export interface SavedCoupon {
  id: string;
  user_id: string;
  email: string;
  round_id: string;
  predictions: string[][];
  columns_count: number;
  guarantee_level: number;
  payout_tier_won?: number | null;
  generated_columns?: string[][];
  matches_data?: any[];
  created_at: string;
}

export const mockService = new MockService();

function cleanWord(w: string): string {
  return w.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/i/g, 'i').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

function wordsMatch(w1: string, w2: string): boolean {
  if (w1 === w2) return true;
  if (w1.length >= 4 && w2.length >= 4) {
    if (w1.startsWith(w2) || w2.startsWith(w1)) return true;
    if (w1.includes(w2) || w2.includes(w1)) return true;
  }
  const s1 = w1.replace(/sh/g, 's');
  const s2 = w2.replace(/sh/g, 's');
  if (s1 === s2) return true;
  if (s1.length >= 4 && s2.length >= 4 && (s1.startsWith(s2) || s2.startsWith(s1))) return true;
  return false;
}

const ALIASES: [string, string][] = [
  ['dac', 'dunajska streda'],
  ['dac 1904', 'dunajska streda']
];

function isTeamMatch(teamA: string, teamB: string): boolean {
  if (!teamA || !teamB) return false;

  const rawA = teamA.toLowerCase();
  const rawB = teamB.toLowerCase();

  for (const [a1, a2] of ALIASES) {
    if ((rawA.includes(a1) && rawB.includes(a2)) || (rawA.includes(a2) && rawB.includes(a1))) {
      return true;
    }
  }

  const ignoreWords = new Set(['fc', 'nk', 'kf', 'ask', 'nsi', 'hb', 'fk', 'sk', 'jk', 'cd', 'sc']);

  const wordsA = teamA.split(/[\s\-\.\/]+/).map(cleanWord).filter(w => w.length > 0 && !ignoreWords.has(w));
  const wordsB = teamB.split(/[\s\-\.\/]+/).map(cleanWord).filter(w => w.length > 0 && !ignoreWords.has(w));

  for (const wa of wordsA) {
    for (const wb of wordsB) {
      if (wordsMatch(wa, wb)) return true;
    }
  }

  return false;
}

function evaluatePick(
  rawPickLabel: string,
  homeGoals: number,
  awayGoals: number,
  iyHomeGoals: number | null,
  iyAwayGoals: number | null
): { isEvaluated: boolean; won: boolean } {
  if (!rawPickLabel) return { isEvaluated: false, won: false };

  // Normalize label
  let label = rawPickLabel
    .toUpperCase()
    .replace(/,/g, '.')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/İ/g, 'I')
    .replace(/I/g, 'I')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .replace(/OST/g, 'UST')
    .replace(/\uFFFD/g, 'U')
    .trim();

  const totalGoals = homeGoals + awayGoals;

  // 1. İLK YARI (İY)
  if (label.includes('IY') || label.includes('ILK YARI')) {
    if (iyHomeGoals === null || iyAwayGoals === null || isNaN(iyHomeGoals) || isNaN(iyAwayGoals)) {
      return { isEvaluated: false, won: false };
    }
    if (label.endsWith(' 1') || label.endsWith('- 1') || label.endsWith('1') || label.includes(' 1 ') || label.includes(' MS 1')) {
      return { isEvaluated: true, won: iyHomeGoals > iyAwayGoals };
    }
    if (label.endsWith(' X') || label.endsWith('- X') || label.endsWith('X') || label.endsWith(' 0') || label.endsWith('- 0') || label.endsWith('0')) {
      return { isEvaluated: true, won: iyHomeGoals === iyAwayGoals };
    }
    if (label.endsWith(' 2') || label.endsWith('- 2') || label.endsWith('2') || label.includes(' 2 ') || label.includes(' MS 2')) {
      return { isEvaluated: true, won: iyHomeGoals < iyAwayGoals };
    }
  }

  // 2. KARŞILIKLI GOL (KG)
  if (label.includes('KG') || label.includes('KARSILIKLI')) {
    if (label.includes('YOK') || label.includes('NO')) {
      return { isEvaluated: true, won: homeGoals === 0 || awayGoals === 0 };
    }
    if (label.includes('VAR') || label.includes('YES')) {
      return { isEvaluated: true, won: homeGoals > 0 && awayGoals > 0 };
    }
  }

  // 3. ALT / ÜST
  if (label.includes('ALT') || label.includes('UST')) {
    const isUst = label.includes('UST');

    if (label.includes('0.5')) {
      return { isEvaluated: true, won: isUst ? totalGoals > 0.5 : totalGoals < 0.5 };
    }
    if (label.includes('1.5')) {
      return { isEvaluated: true, won: isUst ? totalGoals > 1.5 : totalGoals < 1.5 };
    }
    if (label.includes('2.5')) {
      return { isEvaluated: true, won: isUst ? totalGoals > 2.5 : totalGoals < 2.5 };
    }
    if (label.includes('3.5')) {
      return { isEvaluated: true, won: isUst ? totalGoals > 3.5 : totalGoals < 3.5 };
    }
    if (label.includes('4.5')) {
      return { isEvaluated: true, won: isUst ? totalGoals > 4.5 : totalGoals < 4.5 };
    }
  }

  // 4. ÇİFTE ŞANS (CS / CIFTE)
  if (label.includes('CIFTE') || label.includes('CS') || label.includes('1X') || label.includes('X2') || label.includes('12')) {
    if (label.includes('1X') || label.includes('1-X') || label.includes('1/X') || label.includes('1 OR X')) {
      return { isEvaluated: true, won: homeGoals >= awayGoals };
    }
    if (label.includes('X2') || label.includes('X-2') || label.includes('X/2') || label.includes('X OR 2')) {
      return { isEvaluated: true, won: homeGoals <= awayGoals };
    }
    if (label.includes('12') || label.includes('1-2') || label.includes('1/2') || label.includes('1 OR 2')) {
      return { isEvaluated: true, won: homeGoals !== awayGoals };
    }
  }

  // 5. MAÇ SONUCU (MS)
  if (label === 'MS 1' || label === '1' || label.endsWith('- 1') || label.endsWith(' 1') || label.includes('MAC SONUCU - 1')) {
    return { isEvaluated: true, won: homeGoals > awayGoals };
  }
  if (label === 'MS X' || label === 'MS 0' || label === 'X' || label === '0' || label.endsWith('- X') || label.endsWith(' X') || label.includes('MAC SONUCU - X')) {
    return { isEvaluated: true, won: homeGoals === awayGoals };
  }
  if (label === 'MS 2' || label === '2' || label.endsWith('- 2') || label.endsWith(' 2') || label.includes('MAC SONUCU - 2')) {
    return { isEvaluated: true, won: homeGoals < awayGoals };
  }

  // Generic MS fallback
  if (label.includes('MS') || label.includes('MAC SONUCU')) {
    if (label.includes('1')) return { isEvaluated: true, won: homeGoals > awayGoals };
    if (label.includes('X') || label.includes('0')) return { isEvaluated: true, won: homeGoals === awayGoals };
    if (label.includes('2')) return { isEvaluated: true, won: homeGoals < awayGoals };
  }

  return { isEvaluated: false, won: false };
}

// Gerçek Supabase Veri Erişim Fonksiyonları
export const dbService = {
  async saveCoupon(userId: string, email: string, roundId: string, predictions: string[][], columnsCount: number, guaranteeLevel: number, generatedColumns?: string[][], matchesData?: any[]) {
    if (isMockMode) {
      return mockService.saveCoupon(userId, email, roundId, predictions, columnsCount, guaranteeLevel, generatedColumns, matchesData);
    }

    const payload: any = {
      user_id: userId,
      email,
      round_id: roundId,
      predictions,
      columns_count: columnsCount,
      guarantee_level: guaranteeLevel,
      generated_columns: generatedColumns || []
    };

    if (matchesData && matchesData.length > 0) {
      payload.matches_data = matchesData;
    }

    const { data, error } = await supabase!
      .from('saved_coupons')
      .insert([payload])
      .select()
      .single();

    if (error && (error.message?.includes('matches_data') || error.code === 'PGRST204')) {
      delete payload.matches_data;
      const retry = await supabase!
        .from('saved_coupons')
        .insert([payload])
        .select()
        .single();
      return retry;
    }

    return { data, error };
  },

  async getSavedCoupons(userId: string) {
    if (isMockMode) {
      return { data: await mockService.getSavedCoupons(userId), error: null };
    }
    const { data, error } = await supabase!
      .from('saved_coupons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getIddaaSavedCoupons(userId: string) {
    if (isMockMode) {
      return { data: [], error: null };
    }
    const { data, error } = await supabase!
      .from('iddaa_saved_coupons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async deleteCoupon(couponId: string) {
    if (isMockMode) {
      const success = await mockService.deleteCoupon(couponId);
      return { error: success ? null : new Error('Silinemedi') };
    }
    const { error } = await supabase!
      .from('saved_coupons')
      .delete()
      .eq('id', couponId);
    return { error };
  },

  async deleteIddaaCoupon(couponId: string) {
    if (isMockMode) {
      return { error: null };
    }
    const { error } = await supabase!
      .from('iddaa_saved_coupons')
      .delete()
      .eq('id', couponId);
    return { error };
  },

  async evaluateIddaaCoupons(userId?: string) {
    if (isMockMode || !supabase) return { error: null };
    
    // Fetch pending coupons
    let query = supabase
      .from('iddaa_saved_coupons')
      .select('*')
      .eq('status', 'pending');
      
    if (userId) {
      query = query.eq('user_id', userId);
    }
      
    const { data: pendingCoupons, error: fetchErr } = await query;
      
    if (fetchErr || !pendingCoupons || pendingCoupons.length === 0) return { error: fetchErr };

    // Fetch past matches specifically for the dates of the pending coupon matches
    const dates = new Set<string>();
    pendingCoupons.forEach((c: any) => {
      if (Array.isArray(c.matches)) {
        c.matches.forEach((m: any) => {
          if (m.date) {
            const parts = m.date.split('.');
            if (parts.length === 3) {
              dates.add(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else if (m.date.includes('-')) {
              dates.add(m.date);
            }
          }
        });
      }
    });

    const targetDates = Array.from(dates);
    let pastMatches: any[] = [];

    if (targetDates.length > 0) {
      const { data: dateMatches } = await supabase
        .from('past_matches')
        .select('home_team, away_team, ms_score, iy_score, match_date')
        .in('match_date', targetDates);
      if (dateMatches) pastMatches = dateMatches;
    }

    if (pastMatches.length === 0) {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
      const { data: recentMatches } = await supabase
        .from('past_matches')
        .select('home_team, away_team, ms_score, iy_score, match_date')
        .gte('match_date', fourteenDaysAgo);
      if (recentMatches) pastMatches = recentMatches;
    }

    const updatePromises = pendingCoupons.map(async (coupon) => {
      let allWon = true;
      let anyPending = false;
      let matchesChanged = false;
      let hasLost = false;
      
      const updatedMatches = coupon.matches.map((m: any) => {
        const matchResult = pastMatches.find(p => isTeamMatch(p.home_team, m.homeTeam) && isTeamMatch(p.away_team, m.awayTeam));
        
        if (matchResult && matchResult.ms_score) {
          const scores = matchResult.ms_score.split('-').map(Number);
          const iyScores = matchResult.iy_score ? matchResult.iy_score.split('-').map(Number) : [null, null];
          
          if (scores.length === 2 && !isNaN(scores[0]) && !isNaN(scores[1])) {
            const homeGoals = scores[0];
            const awayGoals = scores[1];
            const iyHomeGoals = (iyScores.length === 2 && iyScores[0] !== null && !isNaN(iyScores[0])) ? iyScores[0] : null;
            const iyAwayGoals = (iyScores.length === 2 && iyScores[1] !== null && !isNaN(iyScores[1])) ? iyScores[1] : null;

            const { isEvaluated, won } = evaluatePick(m.pickLabel, homeGoals, awayGoals, iyHomeGoals, iyAwayGoals);

            if (isEvaluated) {
              const oldResult = m.result;
              m.msScore = matchResult.ms_score;
              m.iyScore = matchResult.iy_score;
              if (won) {
                m.result = 'won';
              } else {
                m.result = 'lost';
                allWon = false;
                hasLost = true;
              }
              if (oldResult !== m.result) {
                matchesChanged = true;
              }
            } else {
              anyPending = true;
            }
          } else {
            anyPending = true;
          }
        } else {
          anyPending = true;
        }

        if (m.result === 'lost') {
          allWon = false;
          hasLost = true;
        }

        return m;
      });
      
      const newStatus = hasLost ? 'lost' : (anyPending ? 'pending' : 'won');
      
      if (newStatus !== coupon.status || matchesChanged) {
        const { error: updateErr } = await supabase
          .from('iddaa_saved_coupons')
          .update({ status: newStatus, matches: updatedMatches })
          .eq('id', coupon.id);

        if (updateErr) {
          console.error('[evaluateIddaaCoupons] Failed to update coupon:', coupon.id, updateErr);
        } else {
          console.log('[evaluateIddaaCoupons] Updated coupon:', coupon.id, '-> newStatus:', newStatus);
        }
      }
      return null;
    });

    await Promise.all(updatePromises.filter(p => p !== null));
    return { error: null };
  },

  async getLeaderboard(roundId: string, matches: any[]) {
    if (isMockMode) {
      return mockService.getLeaderboard(roundId, matches);
    }
    try {
      const { data, error } = await supabase!
        .from('saved_coupons')
        .select('*')
        .eq('round_id', roundId);
      
      if (error || !data) return [];
      
      const scoredCoupons = data.map((c) => {
        let correctCount = 0;
        matches.forEach((m, idx) => {
          const outcome = m.outcome;
          const pred = c.predictions[idx] || [];
          if (outcome && pred.includes(outcome)) {
            correctCount++;
          }
        });

        let payoutTierWon = null;
        if (correctCount === 15) {
          payoutTierWon = c.guarantee_level;
        } else if (correctCount === 14 && c.guarantee_level <= 14) {
          payoutTierWon = c.guarantee_level;
        } else if (correctCount === 13 && c.guarantee_level <= 13) {
          payoutTierWon = c.guarantee_level;
        } else if (correctCount === 12 && c.guarantee_level <= 12) {
          payoutTierWon = c.guarantee_level;
        } else if (correctCount < 12) {
          payoutTierWon = null;
        } else {
          payoutTierWon = correctCount;
        }

        const username = c.email.split('@')[0];
        const maskedName = username.substring(0, Math.min(4, username.length)) + '****';

        return {
          id: c.id,
          email: c.email,
          maskedName,
          columns_count: c.columns_count,
          guarantee_level: c.guarantee_level,
          correctCount,
          payoutTierWon,
          created_at: c.created_at
        };
      });

      return scoredCoupons.sort((a, b) => {
        const aTier = a.payoutTierWon || 0;
        const bTier = b.payoutTierWon || 0;
        if (bTier !== aTier) return bTier - aTier;
        if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
        return a.columns_count - b.columns_count;
      }).slice(0, 10);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  // --- ADMIN & NEWS FUNCTIONS ---
  checkIsAdmin: async (userId: string) => {
    if (isMockMode) return false;
    try {
      const { data, error } = await supabase!.from('profiles').select('is_admin').eq('id', userId).single();
      if (error) return false;
      return data?.is_admin || false;
    } catch (e) {
      return false;
    }
  },

  getAllProfiles: async () => {
    if (isMockMode) return { data: [], error: null };
    return await supabase!.from('profiles').select('*').order('created_at', { ascending: false });
  },

  getActiveNews: async (page?: string) => {
    if (isMockMode) return { data: [], error: null };
    let query = supabase!.from('news_announcements')
      .select('*')
      .eq('is_active', true);
      
    if (page) {
      query = query.in('target_page', [page, 'all', null]);
    }
      
    return await query.order('sort_order', { ascending: true });
  },

  getAllNews: async () => {
    if (isMockMode) return { data: [], error: null };
    return await supabase!.from('news_announcements')
      .select('*')
      .order('sort_order', { ascending: true });
  },

  // --- ORAN ANALİZ MOTORU ---
  insertPastMatches: async (matches: PastMatch[]) => {
    if (isMockMode) {
      console.log('Mock insert', matches.length, 'matches');
      return { data: matches, error: null };
    }
    const { data, error } = await supabase!
      .from('past_matches')
      .upsert(matches, { onConflict: 'home_team, away_team, match_date' });
    return { data, error };
  },

  getPastMatchesForAnalysis: async () => {
    if (isMockMode) return { data: [], error: null };
    // Fetch past matches to do odds analysis (increase limit and make sort deterministic)
    const { data, error } = await supabase!
      .from('past_matches')
      .select('*')
      .order('match_date', { ascending: false })
      .order('id', { ascending: true }) // Deterministic tiebreaker
      .limit(10000);
    return { data, error };
  }
};

export interface PastMatch {
  id?: string;
  match_date: string; // YYYY-MM-DD
  match_time?: string;
  home_team: string;
  away_team: string;
  league?: string;
  ms_score?: string;
  iy_score?: string;
  ms_1_odd?: number | null;
  ms_0_odd?: number | null;
  ms_2_odd?: number | null;
  iy_1_odd?: number | null;
  iy_0_odd?: number | null;
  iy_2_odd?: number | null;
  alt_25_odd?: number | null;
  ust_25_odd?: number | null;
  kg_var_odd?: number | null;
  kg_yok_odd?: number | null;
  cs_1x_odd?: number | null;
  cs_12_odd?: number | null;
  cs_x2_odd?: number | null;
  alt_15_odd?: number | null;
  ust_15_odd?: number | null;
  alt_35_odd?: number | null;
  ust_35_odd?: number | null;
  iy_15_alt_odd?: number | null;
  iy_15_ust_odd?: number | null;
  created_at?: string;
}
