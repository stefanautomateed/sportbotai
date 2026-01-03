# SportBot AI - Pre-Match Analyzer Roadmap

> **Business Model:** Premium Pre-Match Intelligence Platform  
> **Mission:** "Find where the market is wrong"  
> **Positioning:** We sell UNDERSTANDING, not winning.

---

## 🎯 What Users Pay For

| Value | How We Deliver |
|-------|----------------|
| **Time savings** | AI summary instead of 30 min research |
| **Viral stats** | Shareable one-liners, screenshot-worthy insights |
| **Deep intelligence** | Streaks, H2H patterns, venue splits |
| **Multi-sport** | Soccer, NBA, NFL, NHL in one app |
| **Confidence** | "I understand this match now" feeling |

---

## 📊 Current State (December 2025)

### ✅ Working Features (Keep & Enhance)
| Feature | Data Source | Status |
|---------|-------------|--------|
| AI Match Analysis | OpenAI GPT-4o-mini | ✅ Real |
| Soccer Stats/Form | API-Football | ✅ Real |
| NBA/NHL/NFL Stats | API-Sports | ✅ Real |
| Live Odds Data | The Odds API | ✅ Real |
| User Auth | NextAuth + PostgreSQL | ✅ Real |
| Stripe Payments | Stripe | ✅ Real |
| Analysis History | PostgreSQL | ✅ Real |
| Text-to-Speech | ElevenLabs | ✅ Real |
| Team Profiles | API-Football | ✅ Real |
| My Teams/Favorites | PostgreSQL | ✅ Real |

### ⚠️ Needs Cleanup (Betting-Adjacent)
| Item | Action | Priority |
|------|--------|----------|
| `userStake` input | Remove from forms | 🔴 P1 |
| `kellyStake` type | Delete entirely | 🔴 P1 |
| `ValueAnalysisCard` | Delete (deprecated) | 🔴 P1 |
| "Edge" language | Replace with "Insight" | 🟡 P2 |
| "Value betting" copy | Change to "Pattern detection" | 🟡 P2 |

### 🆕 New Features (Just Built)
| Component | Purpose | Status |
|-----------|---------|--------|
| `MatchHeadlinesCard` | Shareable one-liners | ✅ Created |
| `StreaksCard` | Win/loss runs | ✅ Created |
| `VenueSplitsCard` | Home vs away form | ✅ Created |
| `KeyAbsencesBanner` | Missing players | ✅ Created |
| `GoalsTimingCard` | When teams score | ✅ Created |
| `PreMatchInsightsPanel` | Master component | ✅ Created |
| `generatePreMatchInsights()` | Data generator | ✅ Created |

---

## 🗺️ Build Phases

### Phase 1: CLEANUP 🧹 (This Session)
Remove betting-adjacent features to position clearly as educational tool.

- [ ] 1.1 Remove `userStake` from analyzer forms
- [ ] 1.2 Remove `kellyStake` type and all references
- [ ] 1.3 Delete `ValueAnalysisCard` component
- [ ] 1.4 Update pricing copy (remove "value betting")
- [ ] 1.5 Clean deprecated response fields

### Phase 2: INTEGRATE INSIGHTS 🔌 (This Session)
Wire up the new pre-match components to live data.

- [ ] 2.1 Add `PreMatchInsightsPanel` to `AnalysisResults.tsx`
- [ ] 2.2 Call generator in `/api/analyze` route
- [ ] 2.3 Add `preMatchInsights` to API response
- [ ] 2.4 Test with real match

### Phase 3: AI ENHANCEMENT 🤖 (Next)
Improve AI output for educational focus.

- [ ] 3.1 Rewrite prompts: "understand" not "bet"
- [ ] 3.2 Add headline generation to AI
- [ ] 3.3 Add shareable summary field
- [ ] 3.4 Remove betting advice from responses

### Phase 4: UI POLISH ✨ (Next)
Make it screenshot-worthy.

- [ ] 4.1 Redesign results layout
- [ ] 4.2 Copy-to-clipboard headlines
- [ ] 4.3 Mobile-first responsive
- [ ] 4.4 Loading skeletons

### Phase 5: GROWTH 📈 (Future)
- [ ] Share Card image generator
- [ ] Push notifications for teams
- [ ] Weekly email digests
- [ ] League standings context

---

## 🔌 Data Sources

### What We Have
```
The Odds API (500 free/month)
├── Sports catalog (FREE)
├── Events list (FREE)
└── Odds data (costs quota)

API-Football (100 free/day)
├── Team form (last 5-10 matches)
├── H2H history
├── League standings
└── Team statistics

API-Sports (100 shared/day)
├── Basketball (NBA)
├── Hockey (NHL)
└── American Football (NFL)

OpenAI GPT-4o-mini
├── Match narrative
├── Probability estimates
├── Key factors
└── Tactical assessment
```

### What We Calculate
```
Our Algorithms
├── Streak detection
├── Venue splits
├── H2H aggregation
├── Momentum score
└── Headline generation
```

---

## 💰 Pricing Tiers

| Tier | Analyses | History | Price |
|------|----------|---------|-------|
| **Free** | 3/day | 24 hours | €0 |
| **Pro** | 30/day | 30 days | €9.99/mo |
| **Premium** | Unlimited | Forever | €79/year |

---

## 📋 Already Built (Prior Phases)
- [x] Match analyzer with AI insights
- [x] Multi-sport support
- [x] User authentication  
- [x] Stripe payments
- [x] Analysis history
- [x] 60-Second AI Briefing
- [x] Audio Briefings (TTS)
- [x] My Teams favorites
- [x] Share Cards
- [x] OG Images
- [x] Team Profiles
- [x] Form Trend Charts

---

*Last Updated: December 12, 2025*
