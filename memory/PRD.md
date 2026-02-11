# FOMO Connections Module - PRD

## Original Problem Statement
Развернуть проект с модулями Connections и Twitter-парсинга. Запустить Strategy Simulation, Farm Network Graph, Alt Season Monitor, Cluster Attention и Early Signal Radar с понятными объяснениями для пользователей.

## Architecture
- **Backend**: Node.js Fastify (port 8003) через Python FastAPI proxy (port 8001)
- **Frontend**: React (port 3000)  
- **Database**: MongoDB (connections_db)
- **Parser**: Twitter Parser V2 (port 5001)

## Implemented Features

### 1. Strategy Simulation ✅
**Назначение:** "Что если следовать за определённым типом Twitter-инфлюенсеров?"

**Добавлены объяснения:**
- Блок "How Strategy Simulation Works" с вопросом-ответом
- Кто такие **Actors** (инфлюенсеры с поведенческими профилями)
- Что означают **метрики** (Hit Rate, Follow Through, Noise Ratio, Sample Size)
- **4 стратегии** с раскрывающимися описаниями

### 2. Farm Network Graph ✅ + Interactive Modal + Twitter Links
**Назначение:** Визуализация бот-ферм и их связей с детальной информацией

**Функции:**
- Интерактивный граф с кликабельными узлами
- **ActorDetailsModal** - модальное окно при клике:
  - Risk Level, Audience Quality (AQI, % bots, % human)
  - Authenticity Score с breakdown
  - Shared Farm Connections (кликабельные)
  - Detected Bot Farms
- **Twitter ссылки** везде: в таблице, в модалке, в header

**Данные:** 10 узлов, 12+ рёбер (crypto_whale_alerts, moon_signals, etc.)

### 3. Alt Season Monitor ✅
**Назначение:** Монитор вероятности альтсезона

**Метрики:** ASP 45%, Market State ALT_NEUTRAL, Top Opportunities: SOL, RNDR, ONDO

### 4. Cluster Attention ✅ (Feb 11, 2026 - NEW)
**Назначение:** Детектор координированной активности инфлюенсерских кластеров

**Компоненты:**
- **Influencer Clusters**: 2 кластера
  - Cluster 0: 13 members (a16z, paradigm, sequoia, cobie, hsaka, etc.)
  - Cluster 1: 5 members (raoulpal, willywoo, pentoshi, etc.)
  
- **Coordinated Momentum**:
  - ONDO - 4.15 - **PUMP_LIKE** 🔴
  - ARB - 2.41 - **PUMP_LIKE** 🔴
  - SOL - 1.85 - **MOMENTUM** 🟠
  - BTC - 0.92 - **ATTENTION** 🟡
  - ETH - 0.55 - **ATTENTION** 🟡
  
- **Cluster Credibility**: 
  - Cluster 0: 64% score, 67% confirmation rate
  - Cluster 1: 5% score
  
- **Price Alignments**:
  - ARB - CONFIRMED 🟢 (Return: 3.69%)
  - ETH - CONFIRMED 🟢 (Return: 3.70%)
  - BTC - LAGGING 🟡

### 5. Early Signal Radar ✅ (Feb 11, 2026 - NEW)
**Назначение:** Идентификация аккаунтов до того как они станут значимыми

**Функции:**
- **8 ACCOUNTS** с профилями:
  - Whales: megawhale (2.65M), cryptoking (1.5M)
  - Influencers: defi_master, alpha_seeker, chart_wizard
  - Retail: degen_trader, moon_hunter, crypto_newbie
- Фильтры: Retail, Influencer, Whale, Breakout, Rising
- График Influence Score vs Acceleration
- Compare режим
- Table view

## Key API Endpoints
- `GET /api/connections/network/farm-graph` - граф бот-ферм
- `GET /api/connections/network/actor/:actorId` - детали актора
- `GET /api/connections/clusters` - кластеры инфлюенсеров
- `GET /api/connections/cluster-momentum` - momentum токенов
- `GET /api/connections/cluster-credibility` - credibility кластеров
- `GET /api/connections/cluster-alignment` - price alignments
- `GET /api/connections/radar/accounts` - radar accounts
- `GET /api/alt-season` - данные альтсезона
- `GET /api/connections/simulation/strategies` - стратегии симуляции

## MongoDB Collections (Seeded Data)
- `twitter_accounts` - 22 accounts (VCs, KOLs, Analysts, Founders)
- `connections_follow_graph` - 89 edges
- `twitter_parsed_tweets` - 23 tweets with token mentions
- `influencer_clusters` - 2 clusters
- `cluster_token_attention` - 11 records
- `cluster_token_momentum` - 6 records
- `cluster_credibility` - 2 records
- `cluster_alignments` - 1 record
- `connections_unified_accounts` - 8 radar accounts
- `farm_overlap_edges` - 12+ edges
- `audience_quality_reports`, `influencer_authenticity_reports`, `bot_farms`

## Test Results (Feb 11, 2026)
- Backend: 100% ✅
- Frontend: 100% ✅
- Farm Network Modal: ✅
- Cluster Attention: ✅
- Early Signal Radar: ✅

## Backlog / Next Tasks
- [ ] Подключить реальные Twitter данные через парсер
- [ ] Add more VC accounts for larger dataset
- [ ] Backers module activation
- [ ] WebSocket real-time updates
- [ ] Reality Leaderboard integration
- [ ] Fix duplicate route warnings in backend

## User Personas
- **Traders:** Strategy Simulation + Alt Season + Cluster Attention для выбора entry points
- **Researchers:** Farm Network + Early Signal Radar для анализа манипуляций
- **Admins:** Farm Network + Cluster Attention для выявления координированных атак
