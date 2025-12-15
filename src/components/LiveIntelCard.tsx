/**
 * Live Intel Card Component
 * 
 * Shows real-time posts from the SportBot Agent feed.
 * Fetches from /api/agent and auto-refreshes every 30 seconds.
 * Premium, minimal design matching our style.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface IntelPost {
  id: string;
  category: string;
  categoryName: string;
  categoryIcon: string;
  content: string;
  matchRef: string;
  sport: string;
  league: string;
  timestamp: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

const confidenceStyles = {
  LOW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HIGH: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const confidenceLabels = {
  LOW: 'Uncertain',
  MEDIUM: 'Moderate',
  HIGH: 'Confident',
};

const sportEmojis: Record<string, string> = {
  soccer: '⚽',
  football: '⚽',
  basketball: '🏀',
  hockey: '🏒',
  baseball: '⚾',
  mma: '🥊',
  default: '🎯',
};

export default function LiveIntelCard() {
  const [posts, setPosts] = useState<IntelPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/agent?limit=3');
      const data = await response.json();
      
      if (data.success && data.posts) {
        setPosts(data.posts);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch intel posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPosts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getSportEmoji = (sport: string) => {
    const normalized = sport?.toLowerCase() || '';
    return sportEmojis[normalized] || sportEmojis.default;
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  return (
    <div className="relative">
      {/* Card Container - Premium minimal style */}
      <div className="bg-[#0a0a0b] border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500/20 to-purple-600/10 rounded-xl flex items-center justify-center border border-violet-500/20">
              <span className="text-lg">🧠</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Live Intel</h3>
              <p className="text-zinc-500 text-[10px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Auto-updating
              </p>
            </div>
          </div>
          <Link 
            href="/ai-desk" 
            className="px-3 py-1.5 text-[10px] font-medium text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] rounded-lg border border-white/[0.06] transition-all"
          >
            Open →
          </Link>
        </div>

        {/* Posts */}
        <div className="divide-y divide-white/[0.04]">
          {loading ? (
            // Loading skeleton
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-5 py-4 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/5 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/5 rounded w-24" />
                      <div className="h-4 bg-white/5 rounded w-full" />
                      <div className="h-3 bg-white/5 rounded w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : posts.length === 0 ? (
            // Empty state
            <div className="px-5 py-8 text-center">
              <p className="text-zinc-500 text-sm">No intel posts yet</p>
            </div>
          ) : (
            // Real posts
            posts.map((post) => (
              <div 
                key={post.id} 
                className="px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{post.categoryIcon}</span>
                  <div className="flex-1 min-w-0">
                    {/* Category + Confidence */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider">
                        {post.categoryName}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded border ${confidenceStyles[post.confidence]}`}>
                        {confidenceLabels[post.confidence]}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <p className="text-zinc-300 text-sm leading-relaxed line-clamp-2">
                      {post.content}
                    </p>
                    
                    {/* Match ref + Time */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm">{getSportEmoji(post.sport)}</span>
                      <span className="text-zinc-400 text-[11px] font-medium">{post.matchRef}</span>
                      <span className="text-zinc-600 text-[10px]">• {formatTime(post.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-white/[0.03] text-zinc-500 text-[9px] font-medium rounded border border-white/[0.06]">
                ⚡ Real-Time
              </span>
              <span className="px-2 py-1 bg-white/[0.03] text-zinc-500 text-[9px] font-medium rounded border border-white/[0.06]">
                🔄 30s refresh
              </span>
            </div>
            <span className="text-zinc-600 text-[9px]">
              Updated {formatTime(lastUpdate.toISOString())}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
