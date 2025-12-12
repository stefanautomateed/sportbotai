# SportBot AI v2.0 - Pre-Match Intelligence Platform

> **STATUS**: ✅ Core implementation complete - Match Preview page live at `/match/[matchId]`

## 🎯 The Problem with Current Design

Current app looks like a **betting analysis tool**:
- "Analyze match" → get probabilities → betting advice feel
- UI focused on odds, risk, value
- Flow: input → analysis output (like a calculator)

## 🚀 New Vision: Match Intelligence Hub

**"Know any match before it happens"**

Users come to UNDERSTAND matches, not to bet. Like ESPN's pre-match shows, but AI-powered and instant.

---

## 🎨 New User Flow

### 1. Landing: Match Discovery (not "Analyze")
```
┌─────────────────────────────────────────────────────┐
│  🔥 TRENDING MATCHES                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ MAN UTD │ │ REAL vs │ │ LAKERS  │              │
│  │ vs LIV  │ │ BARCA   │ │ vs CELTS│              │
│  │ 🔴 Live │ │ Today   │ │ Tomorrow│              │
│  └─────────┘ └─────────┘ └─────────┘              │
│                                                     │
│  🏆 BY LEAGUE                                       │
│  Premier League | La Liga | NBA | NFL              │
└─────────────────────────────────────────────────────┘
```

### 2. Match Preview Page (THE MAIN PRODUCT)
```
┌─────────────────────────────────────────────────────┐
│                ARSENAL vs CHELSEA                    │
│           Premier League • Sunday 16:30             │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │     🔥 MATCH HEADLINES (Shareable!)          │   │
│  │  • Arsenal: 8 home wins in a row            │   │
│  │  • Chelsea: Only 2 away wins this season    │   │
│  │  • H2H: Arsenal unbeaten in last 5          │   │
│  │                          [📋 Copy] [🔗 Share]│   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐               │
│  │   ARSENAL    │  │   CHELSEA    │               │
│  │   Form: 📈   │  │   Form: 📉   │               │
│  │   WWWDW      │  │   LDWLL      │               │
│  │   +12 GD     │  │   -3 GD      │               │
│  └──────────────┘  └──────────────┘               │
│                                                     │
│  ═══════════════════════════════════════════════   │
│                                                     │
│  📊 FORM TIMELINE                                   │
│  [Visual chart showing last 10 matches for both]   │
│                                                     │
│  ⚔️ HEAD TO HEAD                                   │
│  [Last 5 meetings with scores, highlights]         │
│                                                     │
│  🚨 KEY ABSENCES                                    │
│  Arsenal: Saka (doubtful), Odegaard (out)          │
│  Chelsea: Full squad available                      │
│                                                     │
│  🎙️ AI MATCH BRIEFING                              │
│  "Arsenal enter this London derby in dominant      │
│   home form, while Chelsea struggle away..."        │
│                                    [🔊 Listen]      │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  📱 SHARE THIS PREVIEW                       │   │
│  │  [Generate Image] [Copy Link] [Tweet]       │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 🆕 Key Differentiators

### 1. **Headlines First** (Viral hook)
- Big, bold, shareable facts
- Copy-to-clipboard for Twitter
- Generate shareable image cards

### 2. **Visual Form Timeline** (Not just WWDLL)
- Line chart showing performance over time
- Goals scored/conceded trend
- Interactive hover for match details

### 3. **H2H Story** (Not just stats)
- Timeline of past meetings
- Venue-specific records
- "Last time they met..." narrative

### 4. **Smart Absences** (Context matters)
- Not just "injured: X, Y, Z"
- Impact ratings: "Without Haaland, City score 40% fewer goals"
- Alternative starters

### 5. **60-Second AI Briefing** (Audio-first)
- Auto-play summary (like podcast intro)
- Key talking points
- Shareable audio clip

### 6. **No Betting Language**
- No odds (unless user opts in)
- No "value", "edge", "stake"
- Focus: "Understand" not "Bet"

---

## 📱 Mobile-First Design

```
┌─────────────────────┐
│  ARS vs CHE         │
│  Sun 16:30          │
├─────────────────────┤
│ 🔥 8 home wins!     │
│ 📊 Form: ↑ vs ↓     │
│ ⚔️ H2H: 3-1-1       │
├─────────────────────┤
│ [🎙️ 60-Sec Brief]  │
├─────────────────────┤
│ [Share] [Save]      │
└─────────────────────┘
```

---

## 🗄️ Data Sources (What we have)

| Source | Data | Usage |
|--------|------|-------|
| API-Football | Form, H2H, standings, injuries | Core match data |
| The Odds API | Upcoming matches, sports | Match discovery |
| OpenAI | Narratives, summaries | AI briefings |
| ElevenLabs | Text-to-speech | Audio briefings |

---

## 🚫 What We're Removing

| Old Feature | Reason |
|-------------|--------|
| Probability percentages | Betting-adjacent |
| Risk analysis | Betting language |
| Market stability | Betting concept |
| User stake input | Betting feature |
| Value flags | Betting terminology |
| Kelly calculations | Pure betting |

---

## ✅ What We're Keeping/Enhancing

| Feature | Enhancement |
|---------|-------------|
| Form data | → Visual timeline |
| H2H stats | → Interactive history |
| Injuries | → Impact analysis |
| AI analysis | → Audio briefing |
| Share cards | → More viral formats |

---

## 📐 New Page Structure

```
/                     → Match Discovery (trending, by league)
/match/[id]           → Match Preview (THE PRODUCT)
/team/[id]            → Team Intelligence Profile
/my-teams             → Followed teams dashboard
/history              → Past previews viewed
```

---

## 🎯 Success Metrics

| Metric | Target |
|--------|--------|
| Time on Match Preview | >90 seconds |
| Share rate | 10% of views |
| Return visits | 3x/week |
| "Briefing" listens | 40% of previews |

---

## Implementation Priority

### Phase 1: Match Preview Page (Core Product)
1. New Match Preview layout
2. Headlines section (shareable)
3. Visual Form comparison
4. H2H timeline
5. AI Briefing card

### Phase 2: Match Discovery
1. Redesign homepage
2. Trending matches
3. League browsing
4. Search/filters

### Phase 3: Engagement
1. Share card generator
2. Audio briefings
3. Push notifications
4. My Teams alerts

---

*This is a pre-match INTELLIGENCE platform, not a betting tool.*
