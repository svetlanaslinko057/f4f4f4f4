/**
 * BackerDetailPage - Backer Network View (БЛОК 2)
 * 
 * Shows detailed backer info with influence network visualization.
 * Displays: portfolio projects, co-investors, and network graph.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { 
  Building2, 
  ArrowLeft,
  Network, 
  Briefcase,
  Users,
  ExternalLink,
  Shield,
  TrendingUp,
  RefreshCw,
  Globe,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import BackerNetworkPanel from '../components/backers/BackerNetworkPanel';

// E5 Components
import BackerInfluenceSummary from '../components/backers/BackerInfluenceSummary';
import BackerProjectImpactTable from '../components/backers/BackerProjectImpactTable';
import BackerInfluenceGraph from '../components/backers/BackerInfluenceGraph';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================================
// CATEGORY COLORS
// ============================================================

const CATEGORY_COLORS = {
  DEFI: 'bg-green-100 text-green-700',
  INFRA: 'bg-blue-100 text-blue-700',
  NFT: 'bg-purple-100 text-purple-700',
  TRADING: 'bg-yellow-100 text-yellow-700',
  GAMING: 'bg-pink-100 text-pink-700',
  LAYER1: 'bg-indigo-100 text-indigo-700',
  LAYER2: 'bg-cyan-100 text-cyan-700',
  SOCIAL: 'bg-orange-100 text-orange-700',
  ORACLE: 'bg-violet-100 text-violet-700',
};

const NODE_COLORS = {
  BACKER: '#10b981', // green
  PROJECT: '#3b82f6', // blue
  TWITTER: '#8b5cf6', // purple
  WALLET: '#f59e0b', // amber
  CENTER: '#ef4444', // red (current backer)
};

// ============================================================
// COMPONENTS
// ============================================================

const AuthorityBar = ({ value, max = 100, size = 'default' }) => {
  const percentage = Math.min(100, (value / max) * 100);
  const getColor = (val) => {
    if (val >= 80) return 'bg-green-500';
    if (val >= 60) return 'bg-blue-500';
    if (val >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={`${size === 'large' ? 'w-32 h-3' : 'w-20 h-2'} bg-gray-200 rounded-full overflow-hidden`}>
        <div 
          className={`h-full ${getColor(value)} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`font-bold ${size === 'large' ? 'text-2xl' : 'text-sm'} text-gray-900`}>{value}</span>
    </div>
  );
};

const ProjectCard = ({ project }) => (
  <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-gray-900">{project.project?.name || project.projectId}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {project.round && <span className="mr-2">{project.round}</span>}
          {project.project?.categories?.slice(0, 2).join(', ')}
        </div>
      </div>
      {project.project?.stage && (
        <Badge variant="outline" className="text-xs">
          {project.project.stage}
        </Badge>
      )}
    </div>
  </div>
);

const CoInvestorCard = ({ investor, onSelect }) => (
  <button
    onClick={() => onSelect(investor.backerId || investor._id?.coBackerId || investor.id)}
    className="w-full p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors text-left"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <div className="font-medium text-gray-900">
            {investor.name || investor.backerId || investor._id?.coBackerId || 'Unknown'}
          </div>
          <div className="text-xs text-gray-500">
            {investor.sharedCount || investor.shared} shared projects
          </div>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </div>
  </button>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function BackerDetailPage() {
  const { slug } = useParams();
  const [backer, setBacker] = useState(null);
  const [network, setNetwork] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [coInvestors, setCoInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // E5: Influence data
  const [influenceData, setInfluenceData] = useState(null);

  // Fetch backer data
  const fetchData = useCallback(async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch backer details
      const backerRes = await fetch(`${BACKEND_URL}/api/connections/backers/${slug}`);
      const backerData = await backerRes.json();
      
      if (backerData.ok) {
        // Extract backer from nested structure
        const backerInfo = backerData.data?.backer || backerData.data || backerData.backer;
        setBacker(backerInfo);
      } else {
        setError(backerData.error || 'Failed to load backer');
        return;
      }
      
      // Fetch network graph
      const networkRes = await fetch(`${BACKEND_URL}/api/connections/backers/${slug}/network`);
      const networkData = await networkRes.json();
      
      if (networkData.ok && networkData.data) {
        // Transform network data for ForceGraph
        const nodes = (networkData.data.nodes || []).map(n => ({
          ...n,
          id: n.id,
          name: n.name || n.id,
          color: n.id === slug ? NODE_COLORS.CENTER : NODE_COLORS[n.type] || NODE_COLORS.BACKER,
          val: n.id === slug ? 15 : (n.authority || 5),
        }));
        
        const links = (networkData.data.edges || []).map(e => ({
          ...e,
          source: e.from,
          target: e.to,
          value: e.weight || 0.5,
        }));
        
        setNetwork({ nodes, links, stats: networkData.data.stats });
      }
      
      // Fetch co-investors
      const coInvestRes = await fetch(`${BACKEND_URL}/api/connections/backers/${slug}/coinvestors?limit=20`);
      const coInvestData = await coInvestRes.json();
      
      if (coInvestData.ok && coInvestData.data) {
        setCoInvestors(coInvestData.data.coinvestors || []);
      }
      
      // Fetch portfolio (investments)
      const portfolioRes = await fetch(`${BACKEND_URL}/api/connections/backers/${slug}/investments?limit=50`);
      const portfolioData = await portfolioRes.json();
      
      if (portfolioData.ok && portfolioData.data) {
        setPortfolio(portfolioData.data.investments || []);
      }
      
      // E5: Fetch influence data (combined endpoint)
      const influenceRes = await fetch(`${BACKEND_URL}/api/connections/backers/${slug}/influence`);
      const influenceDataResult = await influenceRes.json();
      
      if (influenceDataResult.ok && influenceDataResult.data) {
        setInfluenceData(influenceDataResult.data);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigate to another backer
  const handleSelectBacker = (backerId) => {
    window.location.href = `/connections/backers/${backerId}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link to="/connections/backers" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Backers
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div>
              <h2 className="font-semibold text-red-900">Error loading backer</h2>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="backer-detail-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Back Link */}
          <Link 
            to="/connections/backers" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Backers
          </Link>
          
          {/* Backer Info */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{backer?.name || slug}</h1>
                <p className="text-gray-500 mt-1">{backer?.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {backer?.type || 'FUND'}
                  </Badge>
                  {backer?.categories?.map(cat => (
                    <span 
                      key={cat}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Seed Authority</div>
              <AuthorityBar value={backer?.seedAuthority || 0} size="large" />
              <div className="text-sm text-gray-500 mt-2">
                Confidence: {((backer?.confidence || 0) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          
          {/* External Links */}
          {backer?.externalRefs?.website && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <a
                href={backer.externalRefs.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
              >
                <Globe className="w-4 h-4" />
                {backer.externalRefs.website}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Network Graph */}
          <div className="lg:col-span-2">
            <BackerNetworkPanel backerId={slug} />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Co-Investors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4 text-green-600" />
                  Top Co-Investors
                  <Badge variant="secondary" className="ml-auto">{coInvestors.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                {coInvestors.length > 0 ? (
                  coInvestors.slice(0, 10).map((inv, idx) => (
                    <CoInvestorCard 
                      key={idx} 
                      investor={inv} 
                      onSelect={handleSelectBacker}
                    />
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No co-investors found
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Portfolio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Portfolio Projects
                  <Badge variant="secondary" className="ml-auto">{portfolio.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                {portfolio.length > 0 ? (
                  portfolio.map((p, idx) => (
                    <ProjectCard key={idx} project={p} />
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No investments found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Network Insight */}
        <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Network v2+ Insight</h3>
              <p className="text-sm text-gray-600">
                This backer has <strong>{coInvestors.length}</strong> co-investors and <strong>{portfolio.length}</strong> portfolio projects.
                {coInvestors.length > 0 && (
                  <> The strongest connection is with <strong>{coInvestors[0]?.name || coInvestors[0]?._id?.coBackerId || 'Unknown'}</strong> ({coInvestors[0]?.sharedCount || coInvestors[0]?.shared || 0} shared projects).</>
                )}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Co-investment links are the strongest signal in Network v2 — they represent real capital allocation, not just Twitter follows.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* ================================================================ */}
      {/* E5: INFLUENCE NETWORK SECTION */}
      {/* ================================================================ */}
      {influenceData && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Network className="w-6 h-6 text-purple-500" />
              Influence Network — E5
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Shows where capital, network, and influence actually go.
            </p>
          </div>
          
          {/* E5.1: Influence Summary */}
          <div className="mb-6">
            <BackerInfluenceSummary summary={influenceData.summary} />
          </div>
          
          {/* E5.2: Influence Graph */}
          <div className="mb-6">
            <BackerInfluenceGraph graph={influenceData.graph} />
          </div>
          
          {/* E5.3: Project Impact Table */}
          <div className="mb-6">
            <BackerProjectImpactTable impact={influenceData.projectImpact} />
          </div>
          
          {/* Footer */}
          <div className="text-center text-xs text-gray-400 pt-4">
            Backer Influence Network — E5 Phase — FREEZE v2
          </div>
        </div>
      )}
    </div>
  );
}
