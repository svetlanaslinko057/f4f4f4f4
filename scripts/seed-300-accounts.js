#!/usr/bin/env node
/**
 * Complete seed script for FOMO Connections Module
 * Creates 300 influencer accounts with full data for all tabs
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = 'connections_db';

// Categories and their weights
const CATEGORIES = {
  VC: { weight: 0.15, avgFollowers: 200000, trustMultiplier: 1.3 },
  KOL: { weight: 0.25, avgFollowers: 400000, trustMultiplier: 1.0 },
  FOUNDER: { weight: 0.15, avgFollowers: 800000, trustMultiplier: 1.2 },
  ANALYST: { weight: 0.15, avgFollowers: 150000, trustMultiplier: 1.1 },
  DEGEN: { weight: 0.1, avgFollowers: 50000, trustMultiplier: 0.7 },
  TRADER: { weight: 0.1, avgFollowers: 80000, trustMultiplier: 0.8 },
  NFT: { weight: 0.05, avgFollowers: 60000, trustMultiplier: 0.6 },
  GAMING: { weight: 0.05, avgFollowers: 40000, trustMultiplier: 0.5 },
};

const TIERS = ['S', 'A', 'B', 'C'];
const TIER_WEIGHTS = { S: 0.1, A: 0.25, B: 0.35, C: 0.3 };

// Realistic influencer base data
const BASE_INFLUENCERS = [
  // S-Tier VCs
  { username: 'a16z', name: 'Andreessen Horowitz', category: 'VC', tier: 'S', followers: 892000 },
  { username: 'paradigm', name: 'Paradigm', category: 'VC', tier: 'S', followers: 456000 },
  { username: 'sequoia', name: 'Sequoia Capital', category: 'VC', tier: 'S', followers: 1200000 },
  { username: 'binancelabs', name: 'Binance Labs', category: 'VC', tier: 'S', followers: 567000 },
  { username: 'polychain', name: 'Polychain Capital', category: 'VC', tier: 'A', followers: 189000 },
  { username: 'multicoin', name: 'Multicoin Capital', category: 'VC', tier: 'A', followers: 145000 },
  { username: 'pantera', name: 'Pantera Capital', category: 'VC', tier: 'A', followers: 234000 },
  { username: 'coinbase_ventures', name: 'Coinbase Ventures', category: 'VC', tier: 'A', followers: 123000 },
  { username: 'dragonfly', name: 'Dragonfly Capital', category: 'VC', tier: 'A', followers: 98000 },
  { username: 'hashkey', name: 'HashKey Capital', category: 'VC', tier: 'B', followers: 67000 },
  
  // S-Tier KOLs
  { username: 'cobie', name: 'Cobie', category: 'KOL', tier: 'S', followers: 789000 },
  { username: 'hsaka', name: 'Hsaka', category: 'KOL', tier: 'S', followers: 567000 },
  { username: 'pentoshi', name: 'Pentoshi', category: 'KOL', tier: 'S', followers: 678000 },
  { username: 'inversebrah', name: 'InverseBrah', category: 'KOL', tier: 'S', followers: 456000 },
  { username: 'cryptohayes', name: 'Arthur Hayes', category: 'KOL', tier: 'S', followers: 567000 },
  { username: 'raoulpal', name: 'Raoul Pal', category: 'KOL', tier: 'S', followers: 890000 },
  { username: 'willywoo', name: 'Willy Woo', category: 'KOL', tier: 'S', followers: 1100000 },
  { username: 'planb', name: 'PlanB', category: 'KOL', tier: 'S', followers: 1800000 },
  { username: 'thecryptodog', name: 'The Crypto Dog', category: 'KOL', tier: 'S', followers: 567000 },
  { username: 'cryptokaleo', name: 'Kaleo', category: 'KOL', tier: 'S', followers: 678000 },
  { username: 'ansem', name: 'Ansem', category: 'KOL', tier: 'S', followers: 567000 },
  { username: 'loomdart', name: 'Loomdart', category: 'KOL', tier: 'A', followers: 234000 },
  { username: 'lightcrypto', name: 'Light', category: 'KOL', tier: 'A', followers: 345000 },
  { username: 'blknoiz06', name: 'Blknoiz06', category: 'KOL', tier: 'A', followers: 345000 },
  { username: 'gameoftrades', name: 'GameOfTrades', category: 'KOL', tier: 'S', followers: 456000 },
  
  // S-Tier Founders
  { username: 'vitalikbuterin', name: 'Vitalik Buterin', category: 'FOUNDER', tier: 'S', followers: 5200000 },
  { username: 'cz_binance', name: 'CZ Binance', category: 'FOUNDER', tier: 'S', followers: 8900000 },
  { username: 'brian_armstrong', name: 'Brian Armstrong', category: 'FOUNDER', tier: 'S', followers: 1200000 },
  { username: 'aeyakovenko', name: 'Anatoly Yakovenko', category: 'FOUNDER', tier: 'S', followers: 567000 },
  { username: 'hayden_adams', name: 'Hayden Adams', category: 'FOUNDER', tier: 'A', followers: 345000 },
  { username: 'staboratoryani_kulechov', name: 'Stani Kulechov', category: 'FOUNDER', tier: 'A', followers: 234000 },
  { username: 'andrecronje', name: 'Andre Cronje', category: 'FOUNDER', tier: 'S', followers: 456000 },
  { username: 'cdixon', name: 'Chris Dixon', category: 'FOUNDER', tier: 'S', followers: 890000 },
  { username: 'balajis', name: 'Balaji S', category: 'FOUNDER', tier: 'S', followers: 890000 },
  { username: 'saylor', name: 'Michael Saylor', category: 'FOUNDER', tier: 'S', followers: 3200000 },
  { username: 'APompliano', name: 'Anthony Pompliano', category: 'FOUNDER', tier: 'S', followers: 1700000 },
  
  // S-Tier Analysts
  { username: 'lookonchain', name: 'Lookonchain', category: 'ANALYST', tier: 'S', followers: 456000 },
  { username: 'coindesk', name: 'CoinDesk', category: 'ANALYST', tier: 'S', followers: 2300000 },
  { username: 'cointelegraph', name: 'CoinTelegraph', category: 'ANALYST', tier: 'S', followers: 2100000 },
  { username: 'coingecko', name: 'CoinGecko', category: 'ANALYST', tier: 'S', followers: 890000 },
  { username: 'coinmarketcap', name: 'CoinMarketCap', category: 'ANALYST', tier: 'S', followers: 2800000 },
  { username: 'bankless', name: 'Bankless', category: 'ANALYST', tier: 'S', followers: 567000 },
  { username: 'nansen_ai', name: 'Nansen AI', category: 'ANALYST', tier: 'A', followers: 234000 },
  { username: 'glassnode', name: 'Glassnode', category: 'ANALYST', tier: 'A', followers: 345000 },
  { username: 'defillama', name: 'DeFi Llama', category: 'ANALYST', tier: 'A', followers: 345000 },
  { username: 'messari', name: 'Messari', category: 'ANALYST', tier: 'A', followers: 234000 },
];

// Tokens for mentions
const TOKENS = [
  { symbol: 'BTC', name: 'Bitcoin', cluster: 'BTC' },
  { symbol: 'ETH', name: 'Ethereum', cluster: 'L1' },
  { symbol: 'SOL', name: 'Solana', cluster: 'L1' },
  { symbol: 'AVAX', name: 'Avalanche', cluster: 'L1' },
  { symbol: 'MATIC', name: 'Polygon', cluster: 'L2' },
  { symbol: 'ARB', name: 'Arbitrum', cluster: 'L2' },
  { symbol: 'OP', name: 'Optimism', cluster: 'L2' },
  { symbol: 'LINK', name: 'Chainlink', cluster: 'INFRA' },
  { symbol: 'UNI', name: 'Uniswap', cluster: 'DEFI' },
  { symbol: 'AAVE', name: 'Aave', cluster: 'DEFI' },
  { symbol: 'MKR', name: 'Maker', cluster: 'DEFI' },
  { symbol: 'CRV', name: 'Curve', cluster: 'DEFI' },
  { symbol: 'ONDO', name: 'Ondo', cluster: 'RWA' },
  { symbol: 'RNDR', name: 'Render', cluster: 'AI' },
  { symbol: 'FET', name: 'Fetch.ai', cluster: 'AI' },
  { symbol: 'AGIX', name: 'SingularityNET', cluster: 'AI' },
  { symbol: 'TAO', name: 'Bittensor', cluster: 'AI' },
  { symbol: 'WLD', name: 'Worldcoin', cluster: 'AI' },
  { symbol: 'PEPE', name: 'Pepe', cluster: 'MEME' },
  { symbol: 'SHIB', name: 'Shiba Inu', cluster: 'MEME' },
  { symbol: 'DOGE', name: 'Dogecoin', cluster: 'MEME' },
  { symbol: 'BONK', name: 'Bonk', cluster: 'MEME' },
  { symbol: 'WIF', name: 'dogwifhat', cluster: 'MEME' },
  { symbol: 'IMX', name: 'Immutable X', cluster: 'GAMING' },
  { symbol: 'GALA', name: 'Gala Games', cluster: 'GAMING' },
  { symbol: 'AXS', name: 'Axie Infinity', cluster: 'GAMING' },
  { symbol: 'PENDLE', name: 'Pendle', cluster: 'DEFI' },
  { symbol: 'JUP', name: 'Jupiter', cluster: 'DEFI' },
  { symbol: 'INJ', name: 'Injective', cluster: 'L1' },
  { symbol: 'TIA', name: 'Celestia', cluster: 'INFRA' },
];

const CLUSTERS = ['AI', 'MEME', 'DEFI', 'L2', 'RWA', 'GAMING', 'L1', 'INFRA', 'BTC'];

// Helper functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUsername(index, category) {
  const prefixes = ['crypto', 'defi', 'alpha', 'whale', 'trade', 'moon', 'degen', 'nft', 'web3', 'onchain'];
  const suffixes = ['trader', 'hunter', 'whale', 'maxi', 'degen', 'pro', 'king', 'master', 'guru', 'wizard'];
  return `${randomChoice(prefixes)}_${randomChoice(suffixes)}_${index}`;
}

function generateInfluencerAccount(index, baseData = null) {
  const now = new Date();
  const category = baseData?.category || randomChoice(Object.keys(CATEGORIES));
  const catConfig = CATEGORIES[category];
  const tier = baseData?.tier || (Math.random() < 0.1 ? 'S' : Math.random() < 0.35 ? 'A' : Math.random() < 0.7 ? 'B' : 'C');
  
  const tierMultiplier = { S: 3, A: 1.5, B: 1, C: 0.5 }[tier];
  const baseFollowers = baseData?.followers || Math.floor(catConfig.avgFollowers * tierMultiplier * (0.5 + Math.random()));
  
  const username = baseData?.username || generateUsername(index, category);
  const name = baseData?.name || `${category} Account ${index}`;
  
  // Calculate scores
  const trustScore = Math.min(1, catConfig.trustMultiplier * (0.4 + Math.random() * 0.5) * (tier === 'S' ? 1.2 : tier === 'A' ? 1.1 : 1));
  const influenceScore = Math.floor(300 + (baseFollowers / 10000) * 50 + trustScore * 200 + Math.random() * 100);
  const xScore = Math.floor(influenceScore * (0.7 + Math.random() * 0.3));
  
  return {
    _id: new ObjectId(),
    twitterId: `${1000000000 + index}`,
    username,
    name,
    bio: `${category} | Crypto since ${2017 + randomInt(0, 6)} | ${tier}-Tier`,
    followers: baseFollowers,
    following: Math.floor(baseFollowers * (0.05 + Math.random() * 0.15)),
    tweets: randomInt(500, 50000),
    listed: Math.floor(baseFollowers / 1000),
    verified: tier === 'S' || (tier === 'A' && Math.random() > 0.5),
    
    category,
    tier,
    
    // Scores
    influenceScore,
    xScore,
    trustScore: Number(trustScore.toFixed(3)),
    signalNoiseRatio: randomFloat(4, 9, 1),
    
    // Profile metrics
    profileWeights: {
      views: 0.35,
      quality: 0.25,
      reach: 0.20,
      authority: 0.10,
      engagement: 0.10,
    },
    
    // Activity
    avgDailyTweets: randomFloat(1, 15, 1),
    avgEngagement: randomFloat(0.5, 5, 2),
    mentionedTokens: TOKENS.slice(0, randomInt(3, 12)).map(t => t.symbol),
    
    // Risk assessment
    riskLevel: tier === 'S' ? 'LOW' : tier === 'A' ? 'LOW' : tier === 'B' ? 'MEDIUM' : 'HIGH',
    botProbability: randomFloat(0, tier === 'S' ? 0.05 : tier === 'A' ? 0.1 : 0.25, 3),
    
    // Timestamps
    createdAt: new Date(now - randomInt(30, 365) * 24 * 60 * 60 * 1000),
    updatedAt: now,
    lastParsedAt: new Date(now - randomInt(1, 7) * 24 * 60 * 60 * 1000),
    
    // Metadata
    source: 'SEED',
    status: 'ACTIVE',
  };
}

function generateFollowGraph(accounts) {
  const edges = [];
  const accountMap = new Map(accounts.map(a => [a.username, a._id]));
  
  // S and A tier accounts follow each other more
  const tierGroups = {
    S: accounts.filter(a => a.tier === 'S'),
    A: accounts.filter(a => a.tier === 'A'),
    B: accounts.filter(a => a.tier === 'B'),
    C: accounts.filter(a => a.tier === 'C'),
  };
  
  // Create follow relationships
  accounts.forEach(account => {
    const numFollowing = account.tier === 'S' ? randomInt(30, 60) : 
                         account.tier === 'A' ? randomInt(20, 40) :
                         account.tier === 'B' ? randomInt(10, 25) : randomInt(5, 15);
    
    const targets = new Set();
    
    // Higher tier accounts preferentially follow other high tier accounts
    if (account.tier === 'S' || account.tier === 'A') {
      tierGroups.S.forEach(t => {
        if (t.username !== account.username && Math.random() > 0.3) targets.add(t.username);
      });
      tierGroups.A.forEach(t => {
        if (t.username !== account.username && Math.random() > 0.5) targets.add(t.username);
      });
    }
    
    // Fill remaining with random
    while (targets.size < numFollowing) {
      const target = randomChoice(accounts);
      if (target.username !== account.username) {
        targets.add(target.username);
      }
    }
    
    targets.forEach(targetUsername => {
      const targetId = accountMap.get(targetUsername);
      if (targetId) {
        edges.push({
          _id: new ObjectId(),
          source: account._id,
          target: targetId,
          sourceUsername: account.username,
          targetUsername,
          edgeType: 'FOLLOW',
          weight: randomFloat(0.3, 1, 2),
          createdAt: new Date(),
        });
      }
    });
  });
  
  return edges;
}

function generateClusters(accounts) {
  const clusters = [];
  const clusterNames = ['VC_ELITE', 'KOL_ALPHA', 'DEGEN_ARMY', 'FOUNDER_CIRCLE', 'ANALYST_HUB'];
  
  // Group accounts by category and tier
  const vcAccounts = accounts.filter(a => a.category === 'VC' && (a.tier === 'S' || a.tier === 'A'));
  const kolAccounts = accounts.filter(a => a.category === 'KOL' && (a.tier === 'S' || a.tier === 'A'));
  const founderAccounts = accounts.filter(a => a.category === 'FOUNDER' && (a.tier === 'S' || a.tier === 'A'));
  const analystAccounts = accounts.filter(a => a.category === 'ANALYST');
  const degenAccounts = accounts.filter(a => a.category === 'DEGEN' || a.category === 'TRADER');
  
  const clusterData = [
    { name: 'VC_ELITE', members: vcAccounts.slice(0, 15).map(a => a.username) },
    { name: 'KOL_ALPHA', members: kolAccounts.slice(0, 20).map(a => a.username) },
    { name: 'FOUNDER_CIRCLE', members: founderAccounts.slice(0, 12).map(a => a.username) },
    { name: 'ANALYST_HUB', members: analystAccounts.slice(0, 10).map(a => a.username) },
    { name: 'DEGEN_ARMY', members: degenAccounts.slice(0, 25).map(a => a.username) },
  ];
  
  clusterData.forEach((data, idx) => {
    clusters.push({
      _id: new ObjectId(),
      id: idx,
      name: data.name,
      members: data.members,
      metrics: {
        size: data.members.length,
        cohesion: randomFloat(0.5, 0.9, 2),
        authority: randomFloat(5, 15, 1),
        avgTrust: randomFloat(0.6, 0.9, 2),
      },
      tokens: TOKENS.slice(0, randomInt(5, 10)).map(t => t.symbol),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
  
  return clusters;
}

function generateTokenMomentum() {
  const momentum = [];
  
  TOKENS.forEach(token => {
    const score = randomFloat(0.2, 4.5, 2);
    let classification = 'ATTENTION';
    if (score > 3.5) classification = 'PUMP_LIKE';
    else if (score > 2) classification = 'MOMENTUM';
    else if (score > 1) classification = 'BUILDING';
    
    momentum.push({
      _id: new ObjectId(),
      token: token.symbol,
      tokenName: token.name,
      cluster: token.cluster,
      score,
      classification,
      mentions24h: randomInt(10, 500),
      uniqueMentioners: randomInt(5, 100),
      sentimentScore: randomFloat(-0.5, 1, 2),
      volumeChange24h: randomFloat(-50, 200, 1),
      priceChange24h: randomFloat(-20, 50, 1),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
  
  return momentum;
}

function generateLifecycleData() {
  const assets = TOKENS.slice(0, 15).map((token, idx) => {
    const phases = ['ACCUMULATION', 'IGNITION', 'EXPANSION', 'DISTRIBUTION'];
    const phase = randomChoice(phases);
    const confidence = randomFloat(0.4, 0.95, 2);
    
    return {
      _id: new ObjectId(),
      symbol: token.symbol,
      name: token.name,
      cluster: token.cluster,
      phase,
      confidence,
      scores: {
        accumulation: randomFloat(0.1, 0.9, 2),
        ignition: randomFloat(0.1, 0.9, 2),
        expansion: randomFloat(0.1, 0.9, 2),
        distribution: randomFloat(0.1, 0.9, 2),
      },
      signals: {
        volumeTrend: randomChoice(['INCREASING', 'STABLE', 'DECREASING']),
        oiTrend: randomChoice(['GROWING', 'STABLE', 'SHRINKING']),
        fundingRate: randomFloat(-0.05, 0.05, 4),
        volatility: randomChoice(['COMPRESSED', 'NORMAL', 'EXPANDING']),
      },
      window: '4h',
      updatedAt: new Date(),
    };
  });
  
  return assets;
}

function generateClusterLifecycle() {
  return CLUSTERS.map(cluster => ({
    _id: new ObjectId(),
    cluster,
    phase: randomChoice(['ACCUMULATION', 'IGNITION', 'EXPANSION', 'DISTRIBUTION']),
    confidence: randomFloat(0.4, 0.9, 2),
    assetCount: randomInt(3, 15),
    dominantPhase: randomChoice(['ACCUMULATION', 'IGNITION', 'EXPANSION', 'DISTRIBUTION']),
    portfolioShare: randomFloat(0.05, 0.3, 2),
    updatedAt: new Date(),
  }));
}

function generateEarlyRotations() {
  const rotations = [];
  const pairs = [
    ['GAMING', 'AI'],
    ['DEFI', 'RWA'],
    ['MEME', 'L2'],
    ['L1', 'INFRA'],
  ];
  
  pairs.forEach(([from, to]) => {
    const erp = randomFloat(0.35, 0.85, 2);
    let erpClass = 'IGNORE';
    if (erp > 0.7) erpClass = 'BUILDING';
    else if (erp > 0.5) erpClass = 'WATCH';
    
    rotations.push({
      _id: new ObjectId(),
      fromCluster: from,
      toCluster: to,
      erp,
      class: erpClass,
      notes: {
        volatility: randomChoice(['compressed', 'normal', 'expanding']),
        funding: randomChoice(['negative_extreme', 'neutral', 'positive_extreme']),
        opportunityGrowth: `+${randomInt(15, 50)}%`,
      },
      detectedAt: new Date(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
    });
  });
  
  return rotations;
}

function generateAudienceQuality(accounts) {
  return accounts.slice(0, 50).map(account => ({
    _id: new ObjectId(),
    accountId: account._id,
    username: account.username,
    aqi: randomFloat(0.4, 0.95, 2),
    breakdown: {
      humanPercent: randomFloat(60, 95, 1),
      botPercent: randomFloat(2, 25, 1),
      suspiciousPercent: randomFloat(1, 15, 1),
    },
    sampleSize: randomInt(1000, 10000),
    analyzedAt: new Date(),
  }));
}

function generateFarmOverlapEdges(accounts) {
  const edges = [];
  const susAccounts = accounts.filter(a => a.botProbability > 0.15).slice(0, 30);
  
  for (let i = 0; i < susAccounts.length; i++) {
    for (let j = i + 1; j < susAccounts.length; j++) {
      if (Math.random() > 0.7) {
        edges.push({
          _id: new ObjectId(),
          source: susAccounts[i].username,
          target: susAccounts[j].username,
          overlapScore: randomFloat(0.3, 0.9, 2),
          sharedFollowers: randomInt(100, 5000),
          farmId: `farm_${randomInt(1, 10)}`,
          detectedAt: new Date(),
        });
      }
    }
  }
  
  return edges;
}

function generateUnifiedAccounts(accounts) {
  // Select interesting accounts for radar
  const selected = [
    ...accounts.filter(a => a.tier === 'S').slice(0, 10),
    ...accounts.filter(a => a.tier === 'A').slice(0, 15),
    ...accounts.filter(a => a.tier === 'B' && a.influenceScore > 500).slice(0, 10),
  ];
  
  return selected.map(account => ({
    _id: new ObjectId(),
    accountId: account._id,
    username: account.username,
    name: account.name,
    tier: account.tier,
    category: account.category,
    
    influenceScore: account.influenceScore,
    xScore: account.xScore,
    trustScore: account.trustScore,
    
    velocity: randomFloat(-0.5, 0.5, 2),
    acceleration: randomFloat(-0.2, 0.5, 2),
    
    trend: randomChoice(['RISING', 'STABLE', 'DECLINING', 'BREAKOUT']),
    isBreakout: Math.random() > 0.85,
    
    followers: account.followers,
    growth30d: randomFloat(-5, 25, 1),
    
    updatedAt: new Date(),
  }));
}

function generateTweets(accounts) {
  const tweets = [];
  const selectedAccounts = accounts.filter(a => a.tier === 'S' || a.tier === 'A').slice(0, 50);
  
  selectedAccounts.forEach(account => {
    const numTweets = randomInt(3, 10);
    for (let i = 0; i < numTweets; i++) {
      const mentionedTokens = TOKENS.slice(0, randomInt(1, 3));
      
      tweets.push({
        _id: new ObjectId(),
        tweetId: `${Date.now()}${randomInt(1000, 9999)}`,
        accountId: account._id,
        username: account.username,
        text: `${randomChoice(['Bullish on', 'Watching', 'Loading up', 'Big moves coming for'])} $${mentionedTokens[0]?.symbol || 'BTC'}. ${randomChoice(['DYOR', 'NFA', 'Looks strong', 'Chart looking good'])}`,
        tokens: mentionedTokens.map(t => t.symbol),
        sentiment: randomFloat(0.3, 1, 2),
        engagement: {
          likes: randomInt(100, 50000),
          retweets: randomInt(10, 5000),
          replies: randomInt(5, 1000),
        },
        createdAt: new Date(Date.now() - randomInt(1, 48) * 60 * 60 * 1000),
        parsedAt: new Date(),
      });
    }
  });
  
  return tweets;
}

async function seed() {
  const client = new MongoClient(MONGO_URL);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Generate accounts
    console.log('Generating 300 influencer accounts...');
    const accounts = [];
    
    // First add base influencers
    BASE_INFLUENCERS.forEach((base, idx) => {
      accounts.push(generateInfluencerAccount(idx, base));
    });
    
    // Generate remaining accounts
    for (let i = BASE_INFLUENCERS.length; i < 300; i++) {
      accounts.push(generateInfluencerAccount(i));
    }
    
    console.log(`Generated ${accounts.length} accounts`);
    
    // Clear existing data
    console.log('Clearing existing collections...');
    const collections = [
      'twitter_accounts',
      'connections_follow_graph',
      'influencer_clusters',
      'cluster_token_momentum',
      'lifecycle_assets',
      'lifecycle_clusters',
      'early_rotations',
      'audience_quality_reports',
      'farm_overlap_edges',
      'connections_unified_accounts',
      'twitter_parsed_tweets',
    ];
    
    for (const coll of collections) {
      await db.collection(coll).deleteMany({});
    }
    
    // Insert accounts
    console.log('Inserting twitter_accounts...');
    await db.collection('twitter_accounts').insertMany(accounts);
    
    // Generate and insert follow graph
    console.log('Generating follow graph...');
    const followGraph = generateFollowGraph(accounts);
    console.log(`Generated ${followGraph.length} follow edges`);
    await db.collection('connections_follow_graph').insertMany(followGraph);
    
    // Generate and insert clusters
    console.log('Generating clusters...');
    const clusters = generateClusters(accounts);
    await db.collection('influencer_clusters').insertMany(clusters);
    
    // Generate token momentum
    console.log('Generating token momentum...');
    const momentum = generateTokenMomentum();
    await db.collection('cluster_token_momentum').insertMany(momentum);
    
    // Generate lifecycle data
    console.log('Generating lifecycle data...');
    const lifecycleAssets = generateLifecycleData();
    await db.collection('lifecycle_assets').insertMany(lifecycleAssets);
    
    const lifecycleClusters = generateClusterLifecycle();
    await db.collection('lifecycle_clusters').insertMany(lifecycleClusters);
    
    // Generate early rotations
    console.log('Generating early rotations...');
    const rotations = generateEarlyRotations();
    await db.collection('early_rotations').insertMany(rotations);
    
    // Generate audience quality reports
    console.log('Generating audience quality reports...');
    const audienceReports = generateAudienceQuality(accounts);
    await db.collection('audience_quality_reports').insertMany(audienceReports);
    
    // Generate farm overlap edges
    console.log('Generating farm overlap edges...');
    const farmEdges = generateFarmOverlapEdges(accounts);
    if (farmEdges.length > 0) {
      await db.collection('farm_overlap_edges').insertMany(farmEdges);
    }
    
    // Generate unified accounts for radar
    console.log('Generating unified accounts for radar...');
    const unifiedAccounts = generateUnifiedAccounts(accounts);
    await db.collection('connections_unified_accounts').insertMany(unifiedAccounts);
    
    // Generate tweets
    console.log('Generating parsed tweets...');
    const tweets = generateTweets(accounts);
    await db.collection('twitter_parsed_tweets').insertMany(tweets);
    
    // Summary
    console.log('\n=== SEED COMPLETE ===');
    console.log(`twitter_accounts: ${accounts.length}`);
    console.log(`connections_follow_graph: ${followGraph.length}`);
    console.log(`influencer_clusters: ${clusters.length}`);
    console.log(`cluster_token_momentum: ${momentum.length}`);
    console.log(`lifecycle_assets: ${lifecycleAssets.length}`);
    console.log(`lifecycle_clusters: ${lifecycleClusters.length}`);
    console.log(`early_rotations: ${rotations.length}`);
    console.log(`audience_quality_reports: ${audienceReports.length}`);
    console.log(`farm_overlap_edges: ${farmEdges.length}`);
    console.log(`connections_unified_accounts: ${unifiedAccounts.length}`);
    console.log(`twitter_parsed_tweets: ${tweets.length}`);
    
  } finally {
    await client.close();
  }
}

seed().catch(console.error);
