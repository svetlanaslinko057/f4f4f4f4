/**
 * Reality API with Mock fallback
 * F1.2 - Mock-first guarantee
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Mock data for Reality Leaderboard
const MOCK_REALITY_ENTRIES = [
  { actorId: 'cobie', handle: 'cobie', name: 'Cobie', realityScore: 87, confirms: 24, contradicts: 3, noData: 2, level: 'ELITE' },
  { actorId: 'hsaka', handle: 'hsaka', name: 'Hsaka', realityScore: 82, confirms: 18, contradicts: 4, noData: 3, level: 'STRONG' },
  { actorId: 'punk6529', handle: 'punk6529', name: 'punk6529', realityScore: 91, confirms: 32, contradicts: 2, noData: 1, level: 'ELITE' },
  { actorId: 'thedefiedge', handle: 'thedefiedge', name: 'The DeFi Edge', realityScore: 79, confirms: 15, contradicts: 5, noData: 4, level: 'STRONG' },
  { actorId: 'pentosh1', handle: 'pentosh1', name: 'Pentoshi', realityScore: 85, confirms: 19, contradicts: 4, noData: 2, level: 'ELITE' },
  { actorId: 'inversebrah', handle: 'inversebrah', name: 'inversebrah', realityScore: 58, confirms: 12, contradicts: 9, noData: 6, level: 'MIXED' },
  { actorId: 'DefiIgnas', handle: 'DefiIgnas', name: 'Ignas | DeFi', realityScore: 76, confirms: 17, contradicts: 6, noData: 3, level: 'STRONG' },
  { actorId: 'route2fi', handle: 'route2fi', name: 'Route 2 FI', realityScore: 73, confirms: 16, contradicts: 7, noData: 2, level: 'STRONG' },
  { actorId: 'CryptoCapo_', handle: 'CryptoCapo_', name: 'Il Capo Of Crypto', realityScore: 32, confirms: 8, contradicts: 18, noData: 5, level: 'RISKY' },
  { actorId: 'farokh', handle: 'farokh', name: 'Farokh', realityScore: 81, confirms: 22, contradicts: 5, noData: 1, level: 'STRONG' },
  { actorId: 'taikimeda', handle: 'taikimeda', name: 'Taiki Maeda', realityScore: 68, confirms: 12, contradicts: 6, noData: 4, level: 'MIXED' },
  { actorId: 'TheCryptoDog', handle: 'TheCryptoDog', name: 'The Crypto Dog', realityScore: 54, confirms: 14, contradicts: 12, noData: 8, level: 'MIXED' },
];

const MOCK_GROUPS = [
  { key: 'INFLUENCE', title: 'Influence' },
  { key: 'SMART', title: 'Smart Money' },
  { key: 'MEDIA', title: 'Media' },
  { key: 'TRADING', title: 'Trading / Alpha' },
  { key: 'NFT', title: 'NFT' },
  { key: 'VC', title: 'VC' },
];

export async function fetchLeaderboard({ windowDays = 30, group, limit = 50, sort = 'score' } = {}) {
  try {
    const url = new URL(`${API_BASE}/api/connections/reality/leaderboard`);
    url.searchParams.set('window', String(windowDays));
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('sort', sort);
    if (group) url.searchParams.set('group', group);
    
    const res = await fetch(url.toString(), { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load leaderboard');
    return res.json();
  } catch (err) {
    // Mock fallback
    console.log('[Reality API] Using mock data');
    let data = [...MOCK_REALITY_ENTRIES];
    
    // Sort
    if (sort === 'score') data.sort((a, b) => b.realityScore - a.realityScore);
    else if (sort === 'confirms') data.sort((a, b) => b.confirms - a.confirms);
    else if (sort === 'contradicts') data.sort((a, b) => b.contradicts - a.contradicts);
    else if (sort === 'sample') data.sort((a, b) => (b.confirms + b.contradicts) - (a.confirms + a.contradicts));
    
    return { ok: true, data: data.slice(0, limit) };
  }
}

export async function fetchActorReality(actorId, windowDays = 30) {
  try {
    const url = new URL(`${API_BASE}/api/connections/reality/actor/${encodeURIComponent(actorId)}`);
    url.searchParams.set('window', String(windowDays));
    
    const res = await fetch(url.toString(), { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load actor reality');
    return res.json();
  } catch (err) {
    // Mock fallback
    const actor = MOCK_REALITY_ENTRIES.find(e => e.actorId === actorId);
    return { ok: true, data: actor || null };
  }
}

export async function fetchLeaderboardGroups() {
  try {
    const res = await fetch(`${API_BASE}/api/connections/reality/leaderboard/groups`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load groups');
    return res.json();
  } catch (err) {
    // Mock fallback
    return { ok: true, data: MOCK_GROUPS };
  }
}

export async function fetchLeaderboardExplain() {
  try {
    const res = await fetch(`${API_BASE}/api/connections/reality/leaderboard/explain`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load formula');
    return res.json();
  } catch (err) {
    // Mock fallback
    return { 
      ok: true, 
      data: {
        formula: 'realityScore = (confirms - contradicts) / total * 100',
        description: 'Measures alignment between public statements and on-chain behavior'
      }
    };
  }
}
