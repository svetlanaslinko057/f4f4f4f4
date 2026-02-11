/**
 * Reality Leaderboard Page - LIGHT THEME
 * 
 * PHASE E4: Ranking of "truth" vs "talking books"
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, Info, Trophy, TrendingUp, TrendingDown, BarChart3, Users, Network, Radio, Building2, Search, HelpCircle } from 'lucide-react';
import { RealityLeaderboardTable } from './RealityLeaderboardTable';
import { fetchLeaderboard, fetchLeaderboardGroups } from './reality.api';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

const WINDOWS = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

const SORTS = [
  { value: 'score', label: 'Reality Score', icon: Trophy },
  { value: 'confirms', label: 'Most Confirms', icon: TrendingUp },
  { value: 'contradicts', label: 'Talking Books', icon: TrendingDown },
  { value: 'sample', label: 'Most Data', icon: BarChart3 },
];

export default function RealityLeaderboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [entries, setEntries] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const windowDays = parseInt(searchParams.get('window') || '30');
  const group = searchParams.get('group') || '';
  const sort = searchParams.get('sort') || 'score';
  
  // Load groups on mount
  useEffect(() => {
    fetchLeaderboardGroups()
      .then(res => setGroups(res.data || []))
      .catch(() => {});
  }, []);
  
  // Load leaderboard
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLeaderboard({
        windowDays,
        group: group || undefined,
        sort,
        limit: 100,
      });
      setEntries(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [windowDays, group, sort]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const updateParams = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };
  
  const handleSelect = (entry) => {
    navigate(`/connections/${encodeURIComponent(entry.actorId)}`);
  };
  
  // Stats
  const totalConfirms = entries.reduce((s, e) => s + e.confirms, 0);
  const totalContradicts = entries.reduce((s, e) => s + e.contradicts, 0);
  const avgScore = entries.length > 0 
    ? Math.round(entries.reduce((s, e) => s + e.realityScore, 0) / entries.length)
    : 0;
  
  // Filtered entries by search
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(e => 
      e.name?.toLowerCase().includes(q) ||
      e.username?.toLowerCase().includes(q) ||
      e.actorId?.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);
  
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        color: '#111827',
      }}
      data-testid="reality-leaderboard-page"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Navigation Tabs - Same as other Connections pages */}
        <div className="flex items-center gap-2 mb-4">
          <Link
            to="/connections"
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Influencers
          </Link>
          <Link
            to="/connections/graph"
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Network className="w-4 h-4" />
            Graph
          </Link>
          <Link
            to="/connections/radar"
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Radio className="w-4 h-4" />
            Radar
          </Link>
          <Link
            to="/connections/backers"
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            Backers
          </Link>
          <span className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Leaderboard
          </span>
        </div>
        
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Trophy size={20} className="text-amber-600" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                Reality Leaderboard
              </h1>
              <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
                Who speaks truth? vs Talking books — ranked by on-chain verification
              </p>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '16px',
          marginBottom: '24px',
        }}>
          <StatCard label="Actors" value={entries.length} color="#6366f1" />
          <StatCard label="Total Confirms" value={totalConfirms} color="#10b981" />
          <StatCard label="Total Contradicts" value={totalContradicts} color="#ef4444" />
          <StatCard label="Avg Score" value={avgScore} color="#f59e0b" />
        </div>
        
        {/* Filters */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '20px',
            alignItems: 'center',
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          {/* Search */}
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Search</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 h-9 px-3 bg-white"
                data-testid="leaderboard-search"
              />
            </div>
          </div>
          
          {/* Window selector */}
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Time Window</label>
            <Select 
              value={String(windowDays)} 
              onValueChange={(val) => updateParams('window', val)}
            >
              <SelectTrigger className="w-32 h-9 bg-white" data-testid="window-selector">
                <SelectValue placeholder="Select window" />
              </SelectTrigger>
              <SelectContent>
                {WINDOWS.map(w => (
                  <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Group selector */}
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Group Filter</label>
            <Select 
              value={group || 'all'} 
              onValueChange={(val) => updateParams('group', val === 'all' ? '' : val)}
            >
              <SelectTrigger className="w-36 h-9 bg-white" data-testid="group-selector">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map(g => (
                  <SelectItem key={g.key} value={g.key}>{g.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Sort selector */}
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Sort By</label>
            <Select 
              value={sort} 
              onValueChange={(val) => updateParams('sort', val)}
            >
              <SelectTrigger className="w-40 h-9 bg-white" data-testid="sort-selector">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Refresh */}
          <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
            <button
              onClick={loadData}
              disabled={loading}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 500,
                fontSize: '13px',
              }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Error */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              color: '#991b1b',
            }}
          >
            {error}
          </div>
        )}
        
        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #6366f1',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
              }}
            />
          </div>
        )}
        
        {/* Table */}
        {!loading && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <RealityLeaderboardTable entries={filteredEntries} onSelect={handleSelect} lightTheme />
          </div>
        )}
        
        {/* Legend - Compact with Tooltip */}
        <div
          style={{
            marginTop: '24px',
            padding: '12px 16px',
            background: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #bbf7d0',
            fontSize: '13px',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span><span style={{ color: '#10b981', fontWeight: 600 }}>●</span> CONFIRMS = Matched on-chain</span>
            <span><span style={{ color: '#ef4444', fontWeight: 600 }}>●</span> CONTRADICTS = Opposed on-chain</span>
            <span style={{ color: '#6b7280' }}>ELITE (85+) → STRONG (70-84) → MIXED (40-69) → RISKY (0-39)</span>
          </div>
          <div className="relative group">
            <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
              <HelpCircle size={16} />
              How it works
            </button>
            <div className="absolute bottom-full right-0 mb-2 w-80 p-4 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <p className="font-semibold mb-2">Reality Score Formula</p>
              <p>Score = ((confirms - contradicts) / total_checks) × 100</p>
              <p className="mt-2">Measures alignment between public statements and actual on-chain behavior over time.</p>
              <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats Card with Tooltip
const STAT_TOOLTIPS = {
  'Actors': 'Total number of accounts being tracked for Reality verification',
  'Total Confirms': 'Sum of all confirmed statements across all actors. On-chain activity matched public statements.',
  'Total Contradicts': 'Sum of all contradicted statements. On-chain activity opposed public narrative.',
  'Avg Score': 'Average Reality Score across all tracked actors. Formula: sum(reality_scores) / count',
};

function StatCard({ label, value, color }) {
  return (
    <div 
      style={{
        padding: '16px',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        cursor: 'help',
        position: 'relative',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
      title={STAT_TOOLTIPS[label] || label}
    >
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

// selectStyle removed - using Radix Select component
