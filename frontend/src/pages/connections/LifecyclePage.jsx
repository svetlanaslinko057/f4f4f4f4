import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Activity, Layers, AlertTriangle, RefreshCw, 
  Eye, ArrowRight, BarChart3, Info, HelpCircle, Zap, DollarSign, 
  Users, Flame, Target, Shield, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Phase definitions with detailed formulas
const PHASE_CONFIG = {
  ACCUMULATION: { 
    color: '#3b82f6',
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-600',
    icon: Target,
    label: 'Accumulation',
    shortDesc: 'Smart money entering',
    fullDesc: 'Large players quietly building positions while price consolidates. This phase is characterized by low volatility, increasing volume and open interest without significant price movement.',
    signals: [
      'Price slope near zero (< 2%)',
      'Volume increasing',
      'Open Interest growing',
      'Funding rate neutral (~0%)',
      'Volatility compressed'
    ],
    formula: 'Score = 0.3×(flat_price) + 0.2×(vol↑) + 0.2×(OI↑) + 0.15×(funding~0) + 0.15×(low_vol)',
    tradingHint: '🎯 Best entry point for trend followers. Watch for breakout signals.'
  },
  IGNITION: { 
    color: '#22c55e',
    gradient: 'from-green-500 to-emerald-600',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-600',
    icon: Zap,
    label: 'Ignition',
    shortDesc: 'Breakout starting',
    fullDesc: 'The initial breakout phase. Price starts moving aggressively with volume confirmation. Short liquidations cascade as trapped bears exit.',
    signals: [
      'Price breaking out (> 5% slope)',
      'Volume spike (> 50% increase)',
      'Open Interest surging (> 30%)',
      'Volatility expanding',
      'Short liquidations dominating'
    ],
    formula: 'Score = 0.25×(price↑) + 0.25×(vol_spike) + 0.2×(OI_surge) + 0.15×(expanding_vol) + 0.15×(short_liqs)',
    tradingHint: '🚀 Momentum entry zone. Ride the trend with tight stops.'
  },
  EXPANSION: { 
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-600',
    icon: Users,
    label: 'Expansion',
    shortDesc: 'Crowd inside',
    fullDesc: 'Retail FOMO phase. Everyone is talking about the asset. High funding rates indicate overleveraged longs. Smart money starts taking profits.',
    signals: [
      'Strong uptrend (> 10% slope)',
      'Extreme volume (> 100% increase)',
      'High funding (> 2%)',
      'High participation breadth',
      'Media attention peak'
    ],
    formula: 'Score = 0.25×(price↑↑) + 0.2×(vol↑↑) + 0.2×(high_funding) + 0.2×(breadth) + 0.15×(expanding_vol)',
    tradingHint: '⚠️ Late stage - scale out positions. Watch for reversal signs.'
  },
  DISTRIBUTION: { 
    color: '#ef4444',
    gradient: 'from-red-500 to-rose-600',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-600',
    icon: TrendingDown,
    label: 'Distribution',
    shortDesc: 'Smart money exiting',
    fullDesc: 'Top formation. Smart money distributes to retail. Price fails to make new highs, long liquidations start cascading.',
    signals: [
      'Price stalling with declining volume',
      'Open Interest decreasing',
      'Extreme funding (> 5% or < -5%)',
      'Long liquidations dominating',
      'Multiple failed breakouts'
    ],
    formula: 'Score = 0.25×(stall+vol↓) + 0.2×(OI↓) + 0.2×(extreme_funding) + 0.2×(long_liqs) + 0.15×(failed_breaks)',
    tradingHint: '🛑 Exit zone - avoid new longs. Consider shorts on bounces.'
  },
};

const ERP_CONFIG = {
  IMMINENT: { 
    bg: 'bg-gradient-to-r from-red-500 to-rose-600', 
    text: 'text-white', 
    icon: Flame,
    desc: 'Rotation happening NOW. High confidence signal.'
  },
  BUILDING: { 
    bg: 'bg-gradient-to-r from-orange-500 to-amber-500', 
    text: 'text-white', 
    icon: Zap,
    desc: 'Rotation building momentum. Watch closely.'
  },
  WATCH: { 
    bg: 'bg-gradient-to-r from-yellow-400 to-amber-400', 
    text: 'text-gray-900', 
    icon: Eye,
    desc: 'Early rotation signals detected. Monitor development.'
  },
  IGNORE: { 
    bg: 'bg-gray-200', 
    text: 'text-gray-600', 
    icon: Shield,
    desc: 'No significant rotation detected.'
  },
};

// Tooltip component
const Tooltip = ({ content, children, position = 'top' }) => {
  const [show, setShow] = useState(false);
  
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className={`absolute z-50 ${positionClasses[position]} w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl`}>
          {content}
          <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
            position === 'top' ? 'top-full -translate-y-1 left-1/2 -translate-x-1/2' :
            position === 'bottom' ? 'bottom-full translate-y-1 left-1/2 -translate-x-1/2' : ''
          }`} />
        </div>
      )}
    </div>
  );
};

// Info card with expandable details
const InfoCard = ({ phase, count, total, expanded, onToggle }) => {
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div className={`rounded-xl border-2 ${config.border} overflow-hidden transition-all duration-300 ${expanded ? 'shadow-lg' : 'shadow-sm'}`}>
      {/* Header - always visible */}
      <div 
        className={`p-4 cursor-pointer bg-gradient-to-r ${config.gradient} text-white`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{config.label}</h3>
              <p className="text-white/80 text-sm">{config.shortDesc}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{count}</div>
            <div className="text-white/70 text-sm">assets</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white/60 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="mt-2 flex items-center justify-between text-white/80 text-xs">
          <span>{percentage.toFixed(1)}% of portfolio</span>
          <span className="flex items-center gap-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? 'Hide details' : 'Show formula'}
          </span>
        </div>
      </div>
      
      {/* Expandable details */}
      {expanded && (
        <div className="p-4 bg-white dark:bg-gray-800 space-y-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm">{config.fullDesc}</p>
          
          {/* Signals */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Detection Signals
            </h4>
            <ul className="space-y-1">
              {config.signals.map((signal, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                  {signal}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Formula */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Calculation Formula
            </h4>
            <code className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
              {config.formula}
            </code>
          </div>
          
          {/* Trading hint */}
          <div className={`rounded-lg p-3 ${config.bg}`}>
            <p className={`text-sm font-medium ${config.text}`}>{config.tradingHint}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Phase Bar with tooltip
const PhaseBar = ({ scores, showLabels = false }) => {
  const phases = ['accumulation', 'ignition', 'expansion', 'distribution'];
  
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 shadow-inner">
        {phases.map((phase) => {
          const config = PHASE_CONFIG[phase.toUpperCase()];
          const value = (scores[phase] || 0) * 100;
          return (
            <Tooltip
              key={phase}
              content={
                <div>
                  <div className="font-semibold mb-1">{config.label}: {value.toFixed(1)}%</div>
                  <div className="text-xs text-gray-300">{config.shortDesc}</div>
                </div>
              }
            >
              <div
                className="h-full transition-all duration-500 hover:opacity-80 cursor-help"
                style={{ 
                  width: `${value}%`,
                  backgroundColor: config.color,
                  minWidth: value > 0 ? '4px' : '0'
                }}
              />
            </Tooltip>
          );
        })}
      </div>
      {showLabels && (
        <div className="flex justify-between mt-1.5 text-xs">
          {phases.map((phase) => {
            const config = PHASE_CONFIG[phase.toUpperCase()];
            const value = (scores[phase] || 0) * 100;
            return (
              <span key={phase} className="font-medium" style={{ color: config.color }}>
                {config.label[0]}: {value.toFixed(0)}%
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Main page component
export default function LifecyclePage() {
  const [assetStates, setAssetStates] = useState([]);
  const [clusterStates, setClusterStates] = useState([]);
  const [earlyRotations, setEarlyRotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [showExplanation, setShowExplanation] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assetsRes, clustersRes, rotationsRes] = await Promise.all([
        fetch(`${API_URL}/api/connections/lifecycle`),
        fetch(`${API_URL}/api/connections/cluster-lifecycle`),
        fetch(`${API_URL}/api/connections/early-rotation/active`),
      ]);

      const assetsData = await assetsRes.json();
      const clustersData = await clustersRes.json();
      const rotationsData = await rotationsRes.json();

      if (assetsData.ok) setAssetStates(assetsData.data || []);
      if (clustersData.ok) setClusterStates(clustersData.data || []);
      if (rotationsData.ok) setEarlyRotations(rotationsData.data || []);
    } catch (err) {
      console.error('Failed to load lifecycle data:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    assets: assetStates.length,
    clusters: clusterStates.length,
    rotations: earlyRotations.length,
    igniting: assetStates.filter(a => a.state === 'IGNITION').length,
    distributing: assetStates.filter(a => a.state === 'DISTRIBUTION').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading lifecycle data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="lifecycle-page">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              Lifecycle Analytics
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Track asset and cluster lifecycle phases in real-time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content="Refresh data from exchange APIs">
              <button 
                onClick={loadData}
                className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* What is Lifecycle? - Collapsible explanation */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-gray-900 dark:text-white">What is Lifecycle Analysis?</span>
            </div>
            {showExplanation ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          
          {showExplanation && (
            <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700">
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">🎯 Purpose</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Lifecycle analysis detects which phase of the market cycle an asset is in, helping you time entries and exits. 
                    It analyzes exchange data (volume, open interest, funding, liquidations) to classify assets into 4 phases.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">📊 How It Works</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Each phase has a score (0-100%) calculated from multiple signals. The phase with the highest score is the current state. 
                    <strong> Confidence</strong> = how strongly the signals align with that phase.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">⚡ ERP Score</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Early Rotation Probability</strong> - predicts when capital will rotate from one cluster to another. 
                    High ERP ({">"} 70%) = imminent rotation opportunity.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">💡 Trading Application</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-blue-500 font-medium">Accumulation</span> = Buy. 
                    <span className="text-green-500 font-medium"> Ignition</span> = Hold/Add. 
                    <span className="text-amber-500 font-medium"> Expansion</span> = Scale out. 
                    <span className="text-red-500 font-medium"> Distribution</span> = Exit.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards - Enhanced */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Tooltip content="Total number of assets being tracked for lifecycle analysis">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition cursor-help">
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                Assets Tracked
                <Info className="w-3 h-3" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.assets}</div>
            </div>
          </Tooltip>
          
          <Tooltip content="Number of correlated asset groups (tokens that move together)">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition cursor-help">
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                Clusters
                <Info className="w-3 h-3" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.clusters}</div>
            </div>
          </Tooltip>
          
          <Tooltip content="Assets in IGNITION phase - best entry opportunities!">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white hover:shadow-lg hover:scale-[1.02] transition cursor-help">
              <div className="text-sm text-white/80 flex items-center gap-1">
                <Zap className="w-4 h-4" /> Igniting
              </div>
              <div className="text-3xl font-bold mt-1">{stats.igniting}</div>
            </div>
          </Tooltip>
          
          <Tooltip content="Assets in DISTRIBUTION phase - smart money exiting, be cautious">
            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-4 text-white hover:shadow-lg hover:scale-[1.02] transition cursor-help">
              <div className="text-sm text-white/80 flex items-center gap-1">
                <TrendingDown className="w-4 h-4" /> Distributing
              </div>
              <div className="text-3xl font-bold mt-1">{stats.distributing}</div>
            </div>
          </Tooltip>
          
          <Tooltip content="Active rotation signals - capital moving between sectors">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-4 text-white hover:shadow-lg hover:scale-[1.02] transition cursor-help">
              <div className="text-sm text-white/80 flex items-center gap-1">
                <ArrowRight className="w-4 h-4" /> Rotations
              </div>
              <div className="text-3xl font-bold mt-1">{stats.rotations}</div>
            </div>
          </Tooltip>
        </div>

        {/* Early Rotation Warnings - Enhanced */}
        {earlyRotations.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 p-5">
            <h2 className="text-lg font-bold text-orange-800 dark:text-orange-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Active Rotation Signals
              <Tooltip content="ERP (Early Rotation Probability) indicates when capital is likely to flow from one sector to another. Use this to front-run sector rotations.">
                <Info className="w-4 h-4 text-orange-400 cursor-help" />
              </Tooltip>
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {earlyRotations.map((rot, idx) => {
                const config = ERP_CONFIG[rot.class] || ERP_CONFIG.IGNORE;
                const Icon = config.icon;
                return (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border border-orange-100 dark:border-orange-900 p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <span className="font-medium text-lg">{rot.fromCluster}</span>
                        <ArrowRight className="w-5 h-5 text-orange-500" />
                        <span className="font-bold text-lg">{rot.toCluster}</span>
                      </div>
                      <Tooltip content={config.desc}>
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 ${config.bg} ${config.text}`}>
                          <Icon className="w-4 h-4" />
                          {rot.class}
                        </span>
                      </Tooltip>
                    </div>
                    
                    {/* ERP Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500 dark:text-gray-400">ERP Score</span>
                        <span className="font-bold text-orange-600">{(rot.erp * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${config.bg} transition-all duration-500`}
                          style={{ width: `${rot.erp * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Metrics */}
                    <div className="flex gap-4 text-sm">
                      <Tooltip content="Current volatility level of the rotation pair">
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 cursor-help">
                          <Activity className="w-3.5 h-3.5" />
                          Vol: {rot.notes?.volatility || 'N/A'}
                        </div>
                      </Tooltip>
                      <Tooltip content="Funding rate difference between clusters">
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 cursor-help">
                          <DollarSign className="w-3.5 h-3.5" />
                          Fund: {rot.notes?.funding || 'N/A'}
                        </div>
                      </Tooltip>
                      <Tooltip content="Growth opportunity in target cluster">
                        <div className="flex items-center gap-1 text-green-600 font-medium cursor-help">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {rot.notes?.opportunityGrowth || 'N/A'}
                        </div>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'assets', label: 'Assets', icon: TrendingUp },
            { id: 'clusters', label: 'Clusters', icon: Layers },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {['ACCUMULATION', 'IGNITION', 'EXPANSION', 'DISTRIBUTION'].map(phase => (
              <InfoCard
                key={phase}
                phase={phase}
                count={assetStates.filter(a => a.state === phase).length}
                total={assetStates.length}
                expanded={expandedPhase === phase}
                onToggle={() => setExpandedPhase(expandedPhase === phase ? null : phase)}
              />
            ))}
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asset</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Tooltip content="Current lifecycle phase based on exchange data analysis">
                        <span className="flex items-center gap-1 cursor-help">Phase <Info className="w-3 h-3" /></span>
                      </Tooltip>
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Tooltip content="How strongly the signals align with the detected phase (higher = more confident)">
                        <span className="flex items-center gap-1 cursor-help">Confidence <Info className="w-3 h-3" /></span>
                      </Tooltip>
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/3">
                      <Tooltip content="Score distribution across all 4 phases. Hover over segments for details.">
                        <span className="flex items-center gap-1 cursor-help">Distribution <Info className="w-3 h-3" /></span>
                      </Tooltip>
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Window</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {assetStates.map((asset) => {
                    const config = PHASE_CONFIG[asset.state] || PHASE_CONFIG.ACCUMULATION;
                    const Icon = config.icon;
                    return (
                      <tr key={asset.asset} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                        <td className="px-5 py-4">
                          <span className="font-bold text-gray-900 dark:text-white text-lg">{asset.asset}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r ${config.gradient} text-white shadow-sm`}>
                            <Icon className="w-4 h-4" /> {config.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${asset.confidence * 100}%`,
                                  backgroundColor: config.color
                                }}
                              />
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-300">{(asset.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <PhaseBar scores={asset.scores} showLabels />
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{asset.window}</td>
                      </tr>
                    );
                  })}
                  {assetStates.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">
                        No assets tracked yet. Data will appear when assets are analyzed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Clusters Tab */}
        {activeTab === 'clusters' && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {clusterStates.map((cluster) => {
              const config = PHASE_CONFIG[cluster.state] || PHASE_CONFIG.ACCUMULATION;
              const Icon = config.icon;
              return (
                <div
                  key={cluster.cluster}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border-2 ${config.border} p-5 shadow-sm hover:shadow-xl transition-all hover:scale-[1.02]`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{cluster.cluster}</h3>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 bg-gradient-to-r ${config.gradient} text-white`}>
                      <Icon className="w-4 h-4" /> {config.label}
                    </span>
                  </div>
                  
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-5xl font-bold" style={{ color: config.color }}>
                      {(cluster.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-2">confidence</span>
                  </div>
                  
                  <PhaseBar scores={cluster.scores} showLabels />
                  
                  <div className="flex justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                    <span>{cluster.assetCount} assets</span>
                    <span>{cluster.window} window</span>
                  </div>
                </div>
              );
            })}
            {clusterStates.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
                No clusters tracked yet. Data will appear when clusters are analyzed.
              </div>
            )}
          </div>
        )}

        {/* Formula Reference - Always visible at bottom */}
        <div className="mt-8 p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Phase Detection Logic
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['ACCUMULATION', 'IGNITION', 'EXPANSION', 'DISTRIBUTION'].map(phase => {
              const config = PHASE_CONFIG[phase];
              const Icon = config.icon;
              return (
                <div key={phase} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r ${config.gradient}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-white">{config.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{config.shortDesc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
