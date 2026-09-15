import { NextResponse } from 'next/server';
import { TURNAROUND_MATCHES, getTurnaroundStats } from '@/lib/turnaroundMatchesData';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // '1/2', '2/1' or null
    const league = searchParams.get('league');
    const month = searchParams.get('month');
    const query = searchParams.get('q')?.toLowerCase();

    let list = [...TURNAROUND_MATCHES];

    if (type && type !== 'all' && (type === '1/2' || type === '2/1')) {
      list = list.filter(m => m.type === type);
    }

    if (league && league !== 'Tümü') {
      list = list.filter(m => m.league === league);
    }

    if (month && month !== 'Tümü') {
      list = list.filter(m => m.month === month);
    }

    if (query) {
      list = list.filter(m =>
        m.homeTeam.toLowerCase().includes(query) ||
        m.awayTeam.toLowerCase().includes(query) ||
        m.league.toLowerCase().includes(query)
      );
    }

    const stats = getTurnaroundStats();

    return NextResponse.json({
      success: true,
      data: list,
      stats: stats
    });
  } catch (error: any) {
    console.error('Turnaround Matches API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Veriler alınamadı.'
    }, { status: 500 });
  }
}
