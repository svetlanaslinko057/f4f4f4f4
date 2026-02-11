/**
 * Farm Network Graph Page (Block 19)
 * 
 * Visualizes shared bot farm connections between influencers
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Network, RefreshCw, AlertTriangle, Users, Filter, Info, ChevronDown, ChevronUp, HelpCircle, Shield, Skull, Eye, ExternalLink } from 'lucide-react';
import { fetchFarmGraph, fetchActorDetails } from '../../api/blocks15-28.api';
import ActorDetailsModal from '../../components/connections/ActorDetailsModal';

// Twitter link component
function TwitterLink({ username, className = "" }) {
  return (
    <a
      href={`https://twitter.com/${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors ${className}`}
      onClick={(e) => e.stopPropagation()}
      title={`View @${username} on Twitter`}
    >
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

// How It Works explanatory section
function HowItWorksSection() {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-red-200 dark:border-red-800 mb-6">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">What is Farm Network?</h2>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      
      {expanded && (
        <div className="mt-4 space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            This tool detects <strong>coordinated bot networks</strong> by analyzing shared suspicious followers between Twitter accounts.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Skull className="w-5 h-5 text-red-500" />
                <h3 className="font-medium text-gray-900 dark:text-white">Bot Farms</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Groups of fake accounts used to artificially inflate followers and engagement. Often controlled by the same operator.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-orange-500" />
                <h3 className="font-medium text-gray-900 dark:text-white">How We Detect</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We analyze follower overlap between accounts. High overlap = likely using the same bot farm to inflate numbers.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-500" />
                <h3 className="font-medium text-gray-900 dark:text-white">Why It Matters</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Accounts using bot farms are less trustworthy. Their "influence" is artificial - avoid following their trading signals.
              </p>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-sm">
            <strong className="text-yellow-700 dark:text-yellow-400">How to read the graph:</strong>
            <ul className="text-yellow-600 dark:text-yellow-300 mt-1 space-y-1">
              <li>• <strong>Nodes</strong> = Twitter accounts suspected of using bot farms</li>
              <li>• <strong>Lines</strong> = Shared suspicious followers between accounts</li>
              <li>• <strong>Thicker lines</strong> = More shared bots (stronger connection)</li>
              <li>• <strong>Red lines</strong> = Very high overlap (70%+) - likely same bot farm</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple force-directed layout calculation
function calculateLayout(nodes, edges, width, height) {
  const nodeMap = new Map();
  
  // Initialize positions randomly
  nodes.forEach((node, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI;
    const radius = Math.min(width, height) * 0.35;
    nodeMap.set(node.id, {
      ...node,
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius,
      vx: 0,
      vy: 0
    });
  });

  // Simple force simulation (few iterations)
  for (let iter = 0; iter < 50; iter++) {
    // Repulsion between all nodes
    for (const [id1, n1] of nodeMap) {
      for (const [id2, n2] of nodeMap) {
        if (id1 >= id2) continue;
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 5000 / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        n1.vx -= fx;
        n1.vy -= fy;
        n2.vx += fx;
        n2.vy += fy;
      }
    }

    // Attraction along edges
    edges.forEach(edge => {
      const n1 = nodeMap.get(edge.a);
      const n2 = nodeMap.get(edge.b);
      if (!n1 || !n2) return;
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = dist * 0.01 * (edge.overlapScore || 0.5);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      n1.vx += fx;
      n1.vy += fy;
      n2.vx -= fx;
      n2.vy -= fy;
    });

    // Apply velocities with damping
    for (const node of nodeMap.values()) {
      node.x += node.vx * 0.1;
      node.y += node.vy * 0.1;
      node.vx *= 0.9;
      node.vy *= 0.9;
      // Keep in bounds
      node.x = Math.max(50, Math.min(width - 50, node.x));
      node.y = Math.max(50, Math.min(height - 50, node.y));
    }
  }

  return Array.from(nodeMap.values());
}

export default function FarmNetworkPage() {
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(0.35);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [layoutNodes, setLayoutNodes] = useState([]);
  const svgRef = useRef(null);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await fetchFarmGraph(minScore, 200);
    setData(result);
    setLoading(false);
  }, [minScore]);

  // Handle actor click - open modal with details
  const handleActorClick = useCallback(async (actorId) => {
    setModalLoading(true);
    setModalOpen(true);
    setSelectedActor(null);
    
    const details = await fetchActorDetails(actorId);
    setSelectedActor(details);
    setModalLoading(false);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedActor(null);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (data.nodes.length > 0) {
      const width = 900;
      const height = 600;
      const laid = calculateLayout(data.nodes, data.edges, width, height);
      setLayoutNodes(laid);
    }
  }, [data]);

  const getEdgeColor = (score) => {
    if (score >= 0.7) return '#EF4444';
    if (score >= 0.5) return '#F97316';
    return '#EAB308';
  };

  const getEdgeWidth = (score) => {
    return 1 + score * 4;
  };

  const nodeMap = new Map(layoutNodes.map(n => [n.id, n]));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Network className="w-6 h-6 text-purple-500" />
              Farm Network Graph
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Shared suspicious followers between influencers
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* How It Works */}
        <HowItWorksSection />

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <label className="text-sm text-gray-600 dark:text-gray-300">Min Score:</label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
                {minScore.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                Nodes: {data.nodes.length}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-6 h-0.5 bg-red-500" />
                Edges: {data.edges.length}
              </span>
            </div>
          </div>
        </div>

        {/* Graph */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="h-[600px] flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : data.nodes.length === 0 ? (
            <div className="h-[600px] flex flex-col items-center justify-center text-gray-500">
              <AlertTriangle className="w-12 h-12 mb-4 text-yellow-500" />
              <p>No farm connections found above threshold {minScore}</p>
              <p className="text-sm mt-1">Try lowering the minimum score</p>
            </div>
          ) : (
            <svg
              ref={svgRef}
              width="100%"
              height="600"
              viewBox="0 0 900 600"
              className="bg-gray-50 dark:bg-gray-900"
            >
              {/* Edges */}
              {data.edges.map((edge, i) => {
                const source = nodeMap.get(edge.a);
                const target = nodeMap.get(edge.b);
                if (!source || !target) return null;
                const isHovered = hoveredEdge === i;
                return (
                  <g key={`edge-${i}`}>
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={getEdgeColor(edge.overlapScore)}
                      strokeWidth={getEdgeWidth(edge.overlapScore)}
                      strokeOpacity={isHovered ? 1 : 0.6}
                      onMouseEnter={() => setHoveredEdge(i)}
                      onMouseLeave={() => setHoveredEdge(null)}
                      className="cursor-pointer"
                    />
                    {isHovered && (
                      <text
                        x={(source.x + target.x) / 2}
                        y={(source.y + target.y) / 2 - 10}
                        textAnchor="middle"
                        className="text-xs fill-gray-700 dark:fill-gray-300"
                      >
                        {edge.sharedSuspects} shared ({(edge.overlapScore * 100).toFixed(0)}%)
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
              {layoutNodes.map((node) => {
                const isHovered = hoveredNode === node.id;
                const connections = data.edges.filter(e => e.a === node.id || e.b === node.id).length;
                return (
                  <g
                    key={node.id}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => handleActorClick(node.id)}
                    className="cursor-pointer"
                    data-testid={`graph-node-${node.id}`}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isHovered ? 14 : 10 + connections}
                      fill={connections > 3 ? '#EF4444' : connections > 1 ? '#F97316' : '#8B5CF6'}
                      stroke={isHovered ? '#fff' : 'transparent'}
                      strokeWidth={2}
                      opacity={isHovered ? 1 : 0.8}
                    />
                    <text
                      x={node.x}
                      y={node.y + (isHovered ? 24 : 22)}
                      textAnchor="middle"
                      className={`text-xs ${isHovered ? 'font-medium fill-gray-900 dark:fill-white' : 'fill-gray-600 dark:fill-gray-400'}`}
                    >
                      {node.id.length > 12 ? node.id.slice(0, 12) + '...' : node.id}
                    </text>
                    {isHovered && (
                      <>
                        <text
                          x={node.x}
                          y={node.y - 18}
                          textAnchor="middle"
                          className="text-xs font-medium fill-purple-600 dark:fill-purple-400"
                        >
                          {connections} connections
                        </text>
                        <text
                          x={node.x}
                          y={node.y - 32}
                          textAnchor="middle"
                          className="text-[10px] fill-gray-500 dark:fill-gray-400"
                        >
                          Click for details
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Legend</h3>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500" />
              <span className="text-gray-600 dark:text-gray-400">1 connection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500" />
              <span className="text-gray-600 dark:text-gray-400">2-3 connections</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-gray-600 dark:text-gray-400">4+ connections</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 rounded bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500" />
              <span className="text-gray-600 dark:text-gray-400">Edge = overlap strength</span>
            </div>
          </div>
        </div>

        {/* Top Edges Table */}
        {data.edges.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                Top Shared Farm Connections
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor A</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor B</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Shared</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jaccard</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.edges.slice(0, 10).map((edge, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleActorClick(edge.a)}
                            className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:underline transition-colors"
                            data-testid={`table-actor-${edge.a}`}
                          >
                            @{edge.a}
                          </button>
                          <TwitterLink username={edge.a} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleActorClick(edge.b)}
                            className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:underline transition-colors"
                            data-testid={`table-actor-${edge.b}`}
                          >
                            @{edge.b}
                          </button>
                          <TwitterLink username={edge.b} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{edge.sharedSuspects}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{(edge.jaccard * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          edge.overlapScore >= 0.7 ? 'bg-red-100 text-red-700' :
                          edge.overlapScore >= 0.5 ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {(edge.overlapScore * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Actor Details Modal */}
      <ActorDetailsModal
        isOpen={modalOpen}
        onClose={closeModal}
        actor={selectedActor}
        loading={modalLoading}
        onActorClick={handleActorClick}
      />
    </div>
  );
}
