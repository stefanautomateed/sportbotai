'use client';

import { useState } from 'react';
import Link from 'next/link';
import UserManagement from './UserManagement';

interface Stats {
  totalUsers: number;
  proUsers: number;
  premiumUsers: number;
  freeUsers: number;
  totalAnalyses: number;
  todayAnalyses: number;
  mrr: number;
}

interface RecentUser {
  id: string;
  name: string | null;
  email: string | null;
  plan: string;
  createdAt: Date;
  referralSource: string | null;
  _count: { analyses: number };
}

interface RecentAnalysis {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  createdAt: Date;
  user: { name: string | null; email: string | null };
}

interface ChatQuery {
  id: string;
  query: string;
  category: string | null;
  brainMode: string | null;
  sport: string | null;
  team: string | null;
  usedRealTimeSearch: boolean;
  createdAt: Date;
  user?: { email: string | null; name: string | null } | null;
}

interface ChatAnalytics {
  totalQueries: number;
  todayQueries: number;
  queriesWithSearch: number;
  queriesWithCitations: number;
  searchRate: number;
  topCategories: Array<{ category: string; count: number }>;
  topTeams: Array<{ team: string; count: number }>;
  recentQueries: ChatQuery[];
  agentPostsCount: number;
}

interface ValueBetStats {
  totalBets: number;
  hits: number;
  misses: number;
  totalProfit: number;
  roi: number;
  avgWinningOdds?: number;
  avgEdge?: number;
}

interface AIPredictionStats {
  totalPredictions: number;
  pendingPredictions: number;
  hitPredictions: number;
  missPredictions: number;
  evaluatedCount: number;
  overallAccuracy: number;
  recentPredictions: Array<{
    id: string;
    matchName: string;
    sport: string;
    league: string;
    kickoff: Date;
    prediction: string;
    conviction: number;
    odds: number | null;
    outcome: string;
    actualResult: string | null;
    createdAt: Date;
    valueBetSide?: string | null;
    valueBetOdds?: number | null;
    valueBetEdge?: number | null;
    valueBetOutcome?: string | null;
    valueBetProfit?: number | null;
  }>;
  byLeague: Array<{ league: string; total: number; hits: number; accuracy: number }>;
  bySport: Array<{ sport: string; total: number; hits: number; accuracy: number }>;
  byConviction?: Array<{ level: string; total: number; hits: number; accuracy: number }>;
  byType?: Array<{ type: string; total: number; hits: number; accuracy: number }>;
  valueBetStats?: ValueBetStats;
  legacyStats?: { total: number; hits: number; accuracy: number };
}

interface AdminDashboardProps {
  stats: Stats;
  recentUsers: RecentUser[];
  recentAnalyses: RecentAnalysis[];
  chatAnalytics?: ChatAnalytics;
  aiPredictionStats?: AIPredictionStats;
}

type TabType = 'overview' | 'users' | 'chat' | 'predictions';

const ITEMS_PER_PAGE = 10;

export default function AdminDashboard({ 
  stats, 
  recentUsers, 
  recentAnalyses,
  chatAnalytics,
  aiPredictionStats,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showUserManagement, setShowUserManagement] = useState(false);
  
  // Pagination states
  const [usersPage, setUsersPage] = useState(1);
  const [analysesPage, setAnalysesPage] = useState(1);
  const [chatPage, setChatPage] = useState(1);
  const [predictionsPage, setPredictionsPage] = useState(1);

  // Paginated data
  const paginatedUsers = recentUsers.slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE);
  const totalUsersPages = Math.ceil(recentUsers.length / ITEMS_PER_PAGE);
  
  const paginatedAnalyses = recentAnalyses.slice((analysesPage - 1) * ITEMS_PER_PAGE, analysesPage * ITEMS_PER_PAGE);
  const totalAnalysesPages = Math.ceil(recentAnalyses.length / ITEMS_PER_PAGE);
  
  const paginatedQueries = chatAnalytics?.recentQueries.slice((chatPage - 1) * ITEMS_PER_PAGE, chatPage * ITEMS_PER_PAGE) || [];
  const totalChatPages = Math.ceil((chatAnalytics?.recentQueries.length || 0) / ITEMS_PER_PAGE);
  
  const paginatedPredictions = aiPredictionStats?.recentPredictions.slice((predictionsPage - 1) * ITEMS_PER_PAGE, predictionsPage * ITEMS_PER_PAGE) || [];
  const totalPredictionsPages = Math.ceil((aiPredictionStats?.recentPredictions.length || 0) / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
            <p className="text-text-secondary mt-1">SportBot AI analytics</p>
          </div>
          <Link 
            href="/admin/blog"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg text-white font-medium transition-colors"
          >
            📝 Blog Admin
          </Link>
        </div>

        {/* Quick Stats - Compact Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <QuickStat label="Users" value={stats.totalUsers} />
          <QuickStat label="MRR" value={`€${stats.mrr.toFixed(0)}`} highlight />
          <QuickStat label="Pro" value={stats.proUsers} />
          <QuickStat label="Premium" value={stats.premiumUsers} />
          <QuickStat label="Analyses" value={stats.totalAnalyses} />
          <QuickStat label="Today" value={stats.todayAnalyses} />
          <QuickStat label="Chat" value={chatAnalytics?.totalQueries || 0} />
          <QuickStat label="Accuracy" value={`${aiPredictionStats?.overallAccuracy || 0}%`} color="green" />
        </div>

        {/* Tabs - Simplified */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            📊 Overview
          </TabButton>
          <TabButton active={activeTab === 'predictions'} onClick={() => setActiveTab('predictions')}>
            🎯 Predictions
          </TabButton>
          <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')}>
            💬 Chat
          </TabButton>
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
            👥 Users
          </TabButton>
        </div>

        {/* ============================================ */}
        {/* OVERVIEW TAB */}
        {/* ============================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Row */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Subscriptions */}
              <div className="card p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Subscriptions</h3>
                <div className="flex gap-4">
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-text-muted">{stats.freeUsers}</div>
                    <div className="text-xs text-text-secondary">Free</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.proUsers}</div>
                    <div className="text-xs text-text-secondary">Pro</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-accent">{stats.premiumUsers}</div>
                    <div className="text-xs text-text-secondary">Premium</div>
                  </div>
                </div>
              </div>

              {/* Chat Stats */}
              <div className="card p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Chat Activity</h3>
                <div className="flex gap-4">
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-blue-400">{chatAnalytics?.todayQueries || 0}</div>
                    <div className="text-xs text-text-secondary">Today</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-purple-400">{chatAnalytics?.agentPostsCount || 0}</div>
                    <div className="text-xs text-text-secondary">Posts</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-green-400">{chatAnalytics?.searchRate || 0}%</div>
                    <div className="text-xs text-text-secondary">Search</div>
                  </div>
                </div>
              </div>

              {/* Predictions Summary */}
              <div className="card p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-3">AI Predictions</h3>
                <div className="flex gap-4">
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-green-400">{aiPredictionStats?.hitPredictions || 0}</div>
                    <div className="text-xs text-text-secondary">Hits</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-red-400">{aiPredictionStats?.missPredictions || 0}</div>
                    <div className="text-xs text-text-secondary">Miss</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{aiPredictionStats?.pendingPredictions || 0}</div>
                    <div className="text-xs text-text-secondary">Pending</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Split */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Users */}
              <div className="card p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Latest Users</h3>
                <div className="space-y-2">
                  {recentUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between py-2 border-b border-border-primary last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <span className="text-[10px] font-bold text-bg-primary">
                            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <span className="text-sm text-text-primary truncate max-w-[150px]">{user.name || user.email}</span>
                      </div>
                      <PlanBadge plan={user.plan} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Analyses */}
              <div className="card p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Latest Analyses</h3>
                <div className="space-y-2">
                  {recentAnalyses.slice(0, 5).map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between py-2 border-b border-border-primary last:border-0">
                      <div>
                        <div className="text-sm text-text-primary">{analysis.homeTeam} vs {analysis.awayTeam}</div>
                        <div className="text-xs text-text-muted">{analysis.sport}</div>
                      </div>
                      <div className="text-xs text-text-secondary">{formatTimeAgo(new Date(analysis.createdAt))}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* PREDICTIONS TAB - Redesigned */}
        {/* ============================================ */}
        {activeTab === 'predictions' && aiPredictionStats && (
          <div className="space-y-6">
            {/* Accuracy Summary - Compact */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="card p-4 text-center border-green-500/30 bg-green-500/5">
                <div className="text-3xl font-bold text-green-400">{aiPredictionStats.overallAccuracy}%</div>
                <div className="text-xs text-text-secondary">Accuracy</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{aiPredictionStats.hitPredictions}</div>
                <div className="text-xs text-text-secondary">Hits ✓</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{aiPredictionStats.missPredictions}</div>
                <div className="text-xs text-text-secondary">Misses ✗</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">{aiPredictionStats.pendingPredictions}</div>
                <div className="text-xs text-text-secondary">Pending</div>
              </div>
              <div className="card p-4 text-center">
                <div className={`text-3xl font-bold ${(aiPredictionStats.valueBetStats?.roi || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(aiPredictionStats.valueBetStats?.roi || 0) >= 0 ? '+' : ''}{aiPredictionStats.valueBetStats?.roi || 0}%
                </div>
                <div className="text-xs text-text-secondary">Value ROI</div>
              </div>
            </div>

            {/* Breakdown Charts */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* By Sport */}
              <div className="card p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-3">By Sport</h3>
                {aiPredictionStats.bySport.length > 0 ? (
                  <div className="space-y-2">
                    {aiPredictionStats.bySport.map((sport) => (
                      <div key={sport.sport} className="flex items-center gap-2">
                        <span className="text-xs text-text-primary w-20 truncate">{sport.sport}</span>
                        <div className="flex-1 h-4 bg-bg-tertiary rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${sport.accuracy >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${sport.accuracy}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-secondary w-16 text-right">{sport.accuracy}% ({sport.hits}/{sport.total})</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-text-muted text-sm">No data</div>}
              </div>

              {/* By Conviction */}
              <div className="card p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-3">By Conviction</h3>
                {aiPredictionStats.byConviction && aiPredictionStats.byConviction.length > 0 ? (
                  <div className="space-y-2">
                    {aiPredictionStats.byConviction.map((conv) => (
                      <div key={conv.level} className="flex items-center gap-2">
                        <span className="text-xs text-text-primary w-20 truncate">{conv.level}</span>
                        <div className="flex-1 h-4 bg-bg-tertiary rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${conv.accuracy >= 50 ? 'bg-green-500' : 'bg-yellow-500'}`}
                            style={{ width: `${conv.accuracy}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-secondary w-16 text-right">{conv.accuracy}% ({conv.hits}/{conv.total})</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-text-muted text-sm">No data</div>}
              </div>
            </div>

            {/* Recent Predictions Table */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between">
                <h3 className="text-sm font-medium text-text-primary">Recent Predictions</h3>
                <span className="text-xs text-text-muted">{aiPredictionStats.recentPredictions.length} total</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-tertiary">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Match</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Prediction</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Odds</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Conv</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Result</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Kickoff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {paginatedPredictions.map((pred) => (
                      <tr key={pred.id} className="hover:bg-bg-tertiary/50">
                        <td className="px-3 py-2">
                          <div className="text-text-primary truncate max-w-[200px]">{pred.matchName}</div>
                          <div className="text-xs text-text-muted">{pred.league}</div>
                        </td>
                        <td className="px-3 py-2 text-text-secondary">{pred.prediction}</td>
                        <td className="px-3 py-2 text-text-secondary">{pred.odds?.toFixed(2) || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            pred.conviction >= 7 ? 'bg-green-500/20 text-green-400' :
                            pred.conviction >= 4 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {pred.conviction}/10
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <OutcomeBadge outcome={pred.outcome} />
                        </td>
                        <td className="px-3 py-2 text-xs text-text-secondary">
                          {formatDate(new Date(pred.kickoff))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <Pagination 
                currentPage={predictionsPage} 
                totalPages={totalPredictionsPages} 
                onPageChange={setPredictionsPage} 
              />
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* CHAT TAB */}
        {/* ============================================ */}
        {activeTab === 'chat' && chatAnalytics && (
          <div className="space-y-6">
            {/* Top Categories & Teams */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Top Categories</h3>
                {chatAnalytics.topCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {chatAnalytics.topCategories.slice(0, 8).map((cat) => (
                      <span key={cat.category} className="px-3 py-1 rounded-full bg-bg-tertiary text-text-primary text-sm">
                        {cat.category} <span className="text-text-muted">({cat.count})</span>
                      </span>
                    ))}
                  </div>
                ) : <div className="text-text-muted text-sm">No data</div>}
              </div>

              <div className="card p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Top Teams</h3>
                {chatAnalytics.topTeams.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {chatAnalytics.topTeams.slice(0, 8).map((team) => (
                      <span key={team.team} className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm">
                        {team.team} <span className="text-accent/60">({team.count})</span>
                      </span>
                    ))}
                  </div>
                ) : <div className="text-text-muted text-sm">No data</div>}
              </div>
            </div>

            {/* Recent Queries Table */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between">
                <h3 className="text-sm font-medium text-text-primary">Recent Queries</h3>
                <span className="text-xs text-text-muted">{chatAnalytics.recentQueries.length} total</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-tertiary">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Query</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">User</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Category</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Mode</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Search</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {paginatedQueries.map((q) => (
                      <tr key={q.id} className="hover:bg-bg-tertiary/50">
                        <td className="px-3 py-2">
                          <div className="text-text-primary max-w-[250px] truncate" title={q.query}>{q.query}</div>
                        </td>
                        <td className="px-3 py-2 text-xs text-text-secondary truncate max-w-[100px]">
                          {q.user?.email || <span className="text-text-muted">Anon</span>}
                        </td>
                        <td className="px-3 py-2">
                          {q.category ? <CategoryBadge category={q.category} /> : <span className="text-text-muted">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          {q.brainMode ? <ModeBadge mode={q.brainMode} /> : <span className="text-text-muted">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          {q.usedRealTimeSearch ? <span className="text-green-400">✓</span> : <span className="text-text-muted">—</span>}
                        </td>
                        <td className="px-3 py-2 text-xs text-text-secondary">{formatTimeAgo(new Date(q.createdAt))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <Pagination 
                currentPage={chatPage} 
                totalPages={totalChatPages} 
                onPageChange={setChatPage} 
              />
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* USERS TAB - Combined with User Management */}
        {/* ============================================ */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Toggle User Management */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowUserManagement(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !showUserManagement ? 'bg-primary text-bg-primary' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                Recent Users
              </button>
              <button
                onClick={() => setShowUserManagement(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showUserManagement ? 'bg-primary text-bg-primary' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                ⚙️ Manage Users
              </button>
            </div>

            {showUserManagement ? (
              <div className="card p-5">
                <UserManagement />
              </div>
            ) : (
              <>
                {/* Users Table */}
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between">
                    <h3 className="text-sm font-medium text-text-primary">All Users</h3>
                    <span className="text-xs text-text-muted">{recentUsers.length} total</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-bg-tertiary">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">User</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Plan</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Source</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Analyses</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-primary">
                        {paginatedUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-bg-tertiary/50">
                            <td className="px-3 py-2">
                              <div className="text-text-primary">{user.name || 'Anonymous'}</div>
                              <div className="text-xs text-text-muted">{user.email}</div>
                            </td>
                            <td className="px-3 py-2"><PlanBadge plan={user.plan} /></td>
                            <td className="px-3 py-2 text-xs text-text-secondary">{user.referralSource || 'Direct'}</td>
                            <td className="px-3 py-2 text-text-secondary">{user._count.analyses}</td>
                            <td className="px-3 py-2 text-xs text-text-secondary">{formatDate(new Date(user.createdAt))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <Pagination 
                    currentPage={usersPage} 
                    totalPages={totalUsersPages} 
                    onPageChange={setUsersPage} 
                  />
                </div>

                {/* Recent Analyses */}
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between">
                    <h3 className="text-sm font-medium text-text-primary">Recent Analyses</h3>
                    <span className="text-xs text-text-muted">{recentAnalyses.length} total</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-bg-tertiary">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Match</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Sport</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">User</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-primary">
                        {paginatedAnalyses.map((analysis) => (
                          <tr key={analysis.id} className="hover:bg-bg-tertiary/50">
                            <td className="px-3 py-2 text-text-primary">{analysis.homeTeam} vs {analysis.awayTeam}</td>
                            <td className="px-3 py-2 text-text-secondary capitalize">{analysis.sport}</td>
                            <td className="px-3 py-2 text-xs text-text-secondary">{analysis.user.name || analysis.user.email}</td>
                            <td className="px-3 py-2 text-xs text-text-secondary">{formatTimeAgo(new Date(analysis.createdAt))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <Pagination 
                    currentPage={analysesPage} 
                    totalPages={totalAnalysesPages} 
                    onPageChange={setAnalysesPage} 
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

function QuickStat({ label, value, highlight, color }: { 
  label: string; 
  value: string | number; 
  highlight?: boolean;
  color?: 'green' | 'blue' | 'purple';
}) {
  const colorClass = highlight ? 'text-accent' : 
    color === 'green' ? 'text-green-400' : 
    color === 'blue' ? 'text-blue-400' : 
    color === 'purple' ? 'text-purple-400' : 'text-text-primary';
  
  return (
    <div className="card p-3 text-center">
      <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-xs text-text-secondary">{label}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-accent text-bg-primary'
          : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    FREE: 'bg-text-muted/20 text-text-muted',
    PRO: 'bg-primary/20 text-primary',
    PREMIUM: 'bg-accent/20 text-accent',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[plan] || colors.FREE}`}>
      {plan}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-medium">
      {category}
    </span>
  );
}

function ModeBadge({ mode }: { mode: string }) {
  const colors: Record<string, string> = {
    agent: 'bg-purple-500/20 text-purple-400',
    data: 'bg-green-500/20 text-green-400',
    analysis: 'bg-yellow-500/20 text-yellow-400',
    post: 'bg-pink-500/20 text-pink-400',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[mode] || 'bg-gray-500/20 text-gray-400'}`}>
      {mode}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  if (outcome === 'PENDING') {
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-500/20 text-gray-400">⏳ Pending</span>;
  }
  if (outcome === 'HIT') {
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">✓ Hit</span>;
  }
  return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">✗ Miss</span>;
}

function Pagination({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  
  return (
    <div className="px-4 py-3 border-t border-border-primary flex items-center justify-between">
      <span className="text-xs text-text-muted">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded text-sm bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded text-sm bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
