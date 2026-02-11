/**
 * Seed script for generating 300 realistic Twitter influencer accounts
 * with proper ratings, follow graphs, clusters, and all related data
 */

const CRYPTO_INFLUENCERS = [
  // Top VCs & Funds (30)
  { username: "a16z", name: "Andreessen Horowitz", followers: 892000, category: "VC", tier: "S" },
  { username: "paradigm", name: "Paradigm", followers: 456000, category: "VC", tier: "S" },
  { username: "sequoia", name: "Sequoia Capital", followers: 1200000, category: "VC", tier: "S" },
  { username: "polyaboratory", name: "Polychain Capital", followers: 189000, category: "VC", tier: "A" },
  { username: "multicoincap", name: "Multicoin Capital", followers: 145000, category: "VC", tier: "A" },
  { username: "panaboratory", name: "Pantera Capital", followers: 234000, category: "VC", tier: "A" },
  { username: "binancelabs", name: "Binance Labs", followers: 567000, category: "VC", tier: "S" },
  { username: "coinaboratoryfund", name: "Coinbase Ventures", followers: 123000, category: "VC", tier: "A" },
  { username: "draboratoryweb3", name: "Dragonfly Capital", followers: 98000, category: "VC", tier: "A" },
  { username: "hashkey_cap", name: "HashKey Capital", followers: 67000, category: "VC", tier: "B" },
  { username: "animocabrands", name: "Animoca Brands", followers: 234000, category: "VC", tier: "A" },
  { username: "electriccapital", name: "Electric Capital", followers: 89000, category: "VC", tier: "B" },
  { username: "galaxydigital", name: "Galaxy Digital", followers: 178000, category: "VC", tier: "A" },
  { username: "blockchain_cap", name: "Blockchain Capital", followers: 145000, category: "VC", tier: "A" },
  { username: "delphi_digital", name: "Delphi Digital", followers: 234000, category: "VC", tier: "A" },
  { username: "framework_vc", name: "Framework Ventures", folders: 67000, category: "VC", tier: "B" },
  { username: "spartan_group", name: "Spartan Group", followers: 89000, category: "VC", tier: "B" },
  { username: "jump_crypto", name: "Jump Crypto", followers: 156000, category: "VC", tier: "A" },
  { username: "wintermute_t", name: "Wintermute Trading", followers: 178000, category: "VC", tier: "A" },
  { username: "alameda_res", name: "Alameda Research", followers: 234000, category: "VC", tier: "A" },
  { username: "threearrowscap", name: "Three Arrows Cap", followers: 189000, category: "VC", tier: "A" },
  { username: "defiance_cap", name: "DeFiance Capital", followers: 123000, category: "VC", tier: "A" },
  { username: "mechanism_cap", name: "Mechanism Capital", followers: 78000, category: "VC", tier: "B" },
  { username: "sino_global", name: "Sino Global", followers: 56000, category: "VC", tier: "B" },
  { username: "cms_holdings", name: "CMS Holdings", followers: 45000, category: "VC", tier: "B" },
  { username: "nascent_xyz", name: "Nascent", followers: 67000, category: "VC", tier: "B" },
  { username: "variant_fund", name: "Variant Fund", followers: 89000, category: "VC", tier: "B" },
  { username: "placeholder_vc", name: "Placeholder VC", followers: 78000, category: "VC", tier: "B" },
  { username: "1kxnetwork", name: "1kx Network", followers: 56000, category: "VC", tier: "B" },
  { username: "robot_ventures", name: "Robot Ventures", followers: 45000, category: "VC", tier: "B" },

  // Top KOLs & Analysts (50)
  { username: "cobie", name: "Cobie", followers: 789000, category: "KOL", tier: "S" },
  { username: "hsaka", name: "Hsaka", followers: 567000, category: "KOL", tier: "S" },
  { username: "loomdart", name: "Loomdart", followers: 234000, category: "KOL", tier: "A" },
  { username: "lightcrypto", name: "Light", followers: 345000, category: "KOL", tier: "A" },
  { username: "inversebrah", name: "InverseBrah", followers: 456000, category: "KOL", tier: "S" },
  { username: "pentoshi", name: "Pentoshi", followers: 678000, category: "KOL", tier: "S" },
  { username: "taboratoryor", name: "Taiki", followers: 234000, category: "KOL", tier: "A" },
  { username: "cryptohayes", name: "Arthur Hayes", followers: 567000, category: "KOL", tier: "S" },
  { username: "zaboratoryuzhu", name: "Su Zhu", followers: 456000, category: "KOL", tier: "S" },
  { username: "kyaboratoryowanshi", name: "Kyle Davies", followers: 234000, category: "KOL", tier: "A" },
  { username: "raaboratoryulpal", name: "Raoul Pal", followers: 890000, category: "KOL", tier: "S" },
  { username: "willyaboratorywoo", name: "Willy Woo", followers: 1100000, category: "KOL", tier: "S" },
  { username: "planb", name: "PlanB", followers: 1800000, category: "KOL", tier: "S" },
  { username: "100trillionusd", name: "100T USD", followers: 234000, category: "KOL", tier: "A" },
  { username: "thecryptodog", name: "The Crypto Dog", followers: 567000, category: "KOL", tier: "S" },
  { username: "cryptokaleo", name: "Kaleo", followers: 678000, category: "KOL", tier: "S" },
  { username: "ansaboratoryoryx", name: "Ansem", followers: 567000, category: "KOL", tier: "S" },
  { username: "blknoiz06", name: "Blknoiz06", followers: 345000, category: "KOL", tier: "A" },
  { username: "gameaboratoryoftrades_", name: "GameOfTrades", followers: 456000, category: "KOL", tier: "S" },
  { username: "crypaboratoryoquant", name: "CryptoQuant", followers: 234000, category: "KOL", tier: "A" },
  { username: "whale_alert", name: "Whale Alert", followers: 567000, category: "KOL", tier: "S" },
  { username: "intothacryptoverse", name: "Benjamin Cowen", followers: 789000, category: "KOL", tier: "S" },
  { username: "credible_crypto", name: "CredibleCrypto", followers: 456000, category: "KOL", tier: "S" },
  { username: "raboratoryektcapital", name: "Rekt Capital", followers: 567000, category: "KOL", tier: "S" },
  { username: "crypto_birb", name: "Crypto Birb", followers: 345000, category: "KOL", tier: "A" },
  { username: "thaboratoryemooncarl", name: "Moon Carl", followers: 234000, category: "KOL", tier: "A" },
  { username: "crypto_waboratoryizard", name: "Crypto Wizard", followers: 178000, category: "KOL", tier: "A" },
  { username: "altcoin_daily", name: "Altcoin Daily", followers: 567000, category: "KOL", tier: "S" },
  { username: "taboratoryhe_blockchain_boy", name: "Blockchain Boy", followers: 123000, category: "KOL", tier: "B" },
  { username: "cryptaboratoryobanter", name: "Crypto Banter", followers: 890000, category: "KOL", tier: "S" },
  { username: "scottmelker", name: "Scott Melker", followers: 678000, category: "KOL", tier: "S" },
  { username: "mmcrypto", name: "MMCrypto", followers: 456000, category: "KOL", tier: "S" },
  { username: "iamaboratoryrcryptoangel", name: "Crypto Angel", followers: 234000, category: "KOL", tier: "A" },
  { username: "crypto_tony_", name: "Crypto Tony", followers: 345000, category: "KOL", tier: "A" },
  { username: "nebraskangooner", name: "NebraskanGooner", followers: 234000, category: "KOL", tier: "A" },
  { username: "deaboratoryensuzzo", name: "Degen Suzzo", followers: 178000, category: "KOL", tier: "A" },
  { username: "cryaboratorypto_maboratoryichael", name: "Crypto Michael", followers: 456000, category: "KOL", tier: "S" },
  { username: "bloodgaboratorywoodcrypto", name: "Bloodgood", followers: 234000, category: "KOL", tier: "A" },
  { username: "jcryaboratorypto_paboratoryro", name: "JCryptoPro", followers: 123000, category: "KOL", tier: "B" },
  { username: "defiaboratorytective", name: "DeFi Detective", followers: 89000, category: "KOL", tier: "B" },
  { username: "onchaboratoryainwizard", name: "OnChain Wizard", followers: 156000, category: "KOL", tier: "A" },
  { username: "defiaboratoryigod", name: "DeFi God", followers: 234000, category: "KOL", tier: "A" },
  { username: "alphaaboratoryleaker", name: "Alpha Leaker", followers: 145000, category: "KOL", tier: "A" },
  { username: "caboratoryryptojack", name: "CryptoJack", followers: 345000, category: "KOL", tier: "A" },
  { username: "docaboratorycrypto", name: "Doc Crypto", followers: 178000, category: "KOL", tier: "A" },
  { username: "mraboratorywhale", name: "Mr Whale", followers: 456000, category: "KOL", tier: "S" },
  { username: "bitcoaboratoryinmaxi", name: "Bitcoin Maxi", followers: 234000, category: "KOL", tier: "A" },
  { username: "ethaboratorymaxalist", name: "ETH Maxalist", followers: 123000, category: "KOL", tier: "B" },
  { username: "solaboratoryanatrader", name: "Solana Trader", followers: 189000, category: "KOL", tier: "A" },
  { username: "layer2labs", name: "Layer2 Labs", followers: 67000, category: "KOL", tier: "B" },

  // Founders & Builders (40)
  { username: "vaboratoryitalikbuterin", name: "Vitalik Buterin", followers: 5200000, category: "FOUNDER", tier: "S" },
  { username: "cz_binance", name: "CZ Binance", followers: 8900000, category: "FOUNDER", tier: "S" },
  { username: "saboratoryatoshinakamoto", name: "Satoshi N", followers: 234000, category: "FOUNDER", tier: "S" },
  { username: "brian_armstrong", name: "Brian Armstrong", followers: 1200000, category: "FOUNDER", tier: "S" },
  { username: "saboratotyamboaboratorykman", name: "SBF", followers: 1100000, category: "FOUNDER", tier: "S" },
  { username: "aaboratorynatoly", name: "Anatoly Yakovenko", followers: 567000, category: "FOUNDER", tier: "S" },
  { username: "hayden_adams", name: "Hayden Adams", followers: 345000, category: "FOUNDER", tier: "A" },
  { username: "staboratoryani_kulechov", name: "Stani Kulechov", followers: 234000, category: "FOUNDER", tier: "A" },
  { username: "kain_warwick", name: "Kain Warwick", followers: 178000, category: "FOUNDER", tier: "A" },
  { username: "banteg", name: "Banteg", followers: 234000, category: "FOUNDER", tier: "A" },
  { username: "andrecronje", name: "Andre Cronje", followers: 456000, category: "FOUNDER", tier: "S" },
  { username: "dcfgod", name: "DCF God", followers: 123000, category: "FOUNDER", tier: "B" },
  { username: "danaboratoryiele_sesta", name: "Daniele Sesta", followers: 567000, category: "FOUNDER", tier: "S" },
  { username: "doaboratoryokwon", name: "Do Kwon", followers: 890000, category: "FOUNDER", tier: "S" },
  { username: "sirgensler", name: "Gary Gensler", followers: 234000, category: "FOUNDER", tier: "A" },
  { username: "cdixon", name: "Chris Dixon", followers: 890000, category: "FOUNDER", tier: "S" },
  { username: "balajis", name: "Balaji S", followers: 890000, category: "FOUNDER", tier: "S" },
  { username: "gavofyork", name: "Gavin Wood", followers: 345000, category: "FOUNDER", tier: "A" },
  { username: "jaboratoryustin_sun", name: "Justin Sun", followers: 3400000, category: "FOUNDER", tier: "S" },
  { username: "charaboratoryleslee", name: "Charles Lee", followers: 890000, category: "FOUNDER", tier: "S" },
  { username: "rogerver", name: "Roger Ver", followers: 678000, category: "FOUNDER", tier: "S" },
  { username: "novogratz", name: "Mike Novogratz", followers: 456000, category: "FOUNDER", tier: "S" },
  { username: "elonmusk", name: "Elon Musk", followers: 170000000, category: "FOUNDER", tier: "S" },
  { username: "APompliano", name: "Anthony Pompliano", followers: 1700000, category: "FOUNDER", tier: "S" },
  { username: "tyler", name: "Tyler Winklevoss", followers: 567000, category: "FOUNDER", tier: "S" },
  { username: "cameron", name: "Cameron Winklevoss", followers: 456000, category: "FOUNDER", tier: "S" },
  { username: "aantonop", name: "Andreas Antonopoulos", followers: 890000, category: "FOUNDER", tier: "S" },
  { username: "nickszabo4", name: "Nick Szabo", followers: 234000, category: "FOUNDER", tier: "A" },
  { username: "adam3us", name: "Adam Back", followers: 345000, category: "FOUNDER", tier: "A" },
  { username: "zooko", name: "Zooko Wilcox", followers: 123000, category: "FOUNDER", tier: "B" },
  { username: "flaboratoryuffypony", name: "Riccardo Spagni", followers: 178000, category: "FOUNDER", tier: "A" },
  { username: "saboratoryergionazarov", name: "Sergey Nazarov", followers: 345000, category: "FOUNDER", tier: "A" },
  { username: "rleshner", name: "Robert Leshner", followers: 123000, category: "FOUNDER", tier: "B" },
  { username: "haaboratoryssan", name: "Hassan", followers: 89000, category: "FOUNDER", tier: "B" },
  { username: "toaboratorymshrem", name: "Tom Shrem", followers: 178000, category: "FOUNDER", tier: "A" },
  { username: "erikvoorhees", name: "Erik Voorhees", followers: 567000, category: "FOUNDER", tier: "S" },
  { username: "jerrybrito", name: "Jerry Brito", followers: 89000, category: "FOUNDER", tier: "B" },
  { username: "paboratoryeteriaboratorynh", name: "Peter Rinh", followers: 67000, category: "FOUNDER", tier: "B" },
  { username: "saylor", name: "Michael Saylor", followers: 3200000, category: "FOUNDER", tier: "S" },
  { username: "jack", name: "Jack Dorsey", followers: 6500000, category: "FOUNDER", tier: "S" },

  // Data Analysts & Researchers (30)
  { username: "nansen_ai", name: "Nansen AI", followers: 234000, category: "ANALYST", tier: "A" },
  { username: "glassnode", name: "Glassnode", followers: 345000, category: "ANALYST", tier: "A" },
  { username: "santimentfeed", name: "Santiment", followers: 123000, category: "ANALYST", tier: "B" },
  { username: "intotheblock", name: "IntoTheBlock", followers: 178000, category: "ANALYST", tier: "A" },
  { username: "messaricrypto", name: "Messari", followers: 234000, category: "ANALYST", tier: "A" },
  { username: "defillama", name: "DeFi Llama", followers: 345000, category: "ANALYST", tier: "A" },
  { username: "lookonchain", name: "Lookonchain", followers: 456000, category: "ANALYST", tier: "S" },
  { username: "arkaboratoryhamintel", name: "Arkham Intel", followers: 234000, category: "ANALYST", tier: "A" },
  { username: "theblock__", name: "The Block", followers: 345000, category: "ANALYST", tier: "A" },
  { username: "coindesk", name: "CoinDesk", followers: 2300000, category: "ANALYST", tier: "S" },
  { username: "cointelegraph", name: "CoinTelegraph", followers: 2100000, category: "ANALYST", tier: "S" },
  { username: "decrypt_co", name: "Decrypt", followers: 234000, category: "ANALYST", tier: "A" },
  { username: "defipulse", name: "DeFi Pulse", followers: 123000, category: "ANALYST", tier: "B" },
  { username: "duaboratoryne_analytics", name: "Dune Analytics", followers: 234000, category: "ANALYST", tier: "A" },
  { username: "tokenterminal", name: "Token Terminal", followers: 178000, category: "ANALYST", tier: "A" },
  { username: "l2beat", name: "L2Beat", followers: 89000, category: "ANALYST", tier: "B" },
  { username: "ultrasoundmoney", name: "Ultrasound Money", followers: 123000, category: "ANALYST", tier: "B" },
  { username: "cryptofees", name: "Crypto Fees", followers: 67000, category: "ANALYST", tier: "B" },
  { username: "ethereumprice", name: "ETH Price", followers: 234000, category: "ANALYST", tier: "A" },
  { username: "btcusdprice", name: "BTC Price", followers: 345000, category: "ANALYST", tier: "A" },
  { username: "defiaboratorywars", name: "DeFi Wars", followers: 89000, category: "ANALYST", tier: "B" },
  { username: "cryptoranaboratoryk_io", name: "CryptoRank", followers: 123000, category: "ANALYST", tier: "B" },
  { username: "coingecko", name: "CoinGecko", followers: 890000, category: "ANALYST", tier: "S" },
  { username: "coinmarketcap", name: "CoinMarketCap", followers: 2800000, category: "ANALYST", tier: "S" },
  { username: "tradingview", name: "TradingView", followers: 1200000, category: "ANALYST", tier: "S" },
  { username: "thaboratoryedefiant", name: "The Defiant", followers: 234000, category: "ANALYST", tier: "A" },
  { username: "bankaboratoryless", name: "Bankless", followers: 567000, category: "ANALYST", tier: "S" },
  { username: "unchaboratoryained", name: "Unchained", followers: 234000, category: "ANALYST", tier: "A" },
  { username: "podaboratorycastnotes", name: "PodcastNotes", followers: 89000, category: "ANALYST", tier: "B" },
  { username: "chaaboratoryinalysis", name: "Chainalysis", followers: 234000, category: "ANALYST", tier: "A" },
];

// Generate remaining accounts programmatically
function generateMoreAccounts(startIndex, count) {
  const categories = ['DEGEN', 'TRADER', 'MEME', 'NFT', 'GAMING', 'DEFI', 'L2', 'AI'];
  const tiers = ['C', 'B', 'A'];
  const accounts = [];
  
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const category = categories[i % categories.length];
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    const followers = Math.floor(Math.random() * 200000) + 5000;
    
    accounts.push({
      username: `crypto_${category.toLowerCase()}_${idx}`,
      name: `${category} Account ${idx}`,
      followers,
      category,
      tier,
    });
  }
  
  return accounts;
}

// Export combined list
const ALL_INFLUENCERS = [
  ...CRYPTO_INFLUENCERS,
  ...generateMoreAccounts(150, 150), // Generate 150 more to reach ~300
];

module.exports = { ALL_INFLUENCERS, CRYPTO_INFLUENCERS };
