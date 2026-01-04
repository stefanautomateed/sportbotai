/**
 * Account Dashboard - Premium Redesign
 * 
 * Clean, modern account page with mobile-first design
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import FeedbackModal from '@/components/FeedbackModal';

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  plan: string;
  analysisCount: number;
  lastAnalysisDate: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  _count: {
    analyses: number;
  };
}

interface Props {
  user: UserData;
}

const PLAN_LIMITS: Record<string, number> = {
  FREE: 1,
  PRO: 30,
  PREMIUM: -1,
};

export default function AccountDashboard({ user }: Props) {
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [usageData, setUsageData] = useState<{ used: number; limit: number; remaining: number } | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; type: 'feature' | 'problem' }>({
    isOpen: false,
    type: 'feature',
  });

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch('/api/usage');
        if (res.ok) {
          const data = await res.json();
          setUsageData({
            used: data.used ?? user.analysisCount,
            limit: data.limit ?? PLAN_LIMITS[user.plan] ?? 1,
            remaining: data.remaining ?? 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      }
    };
    fetchUsage();
  }, [user.analysisCount, user.plan]);

  const limit = usageData?.limit ?? PLAN_LIMITS[user.plan] ?? 1;
  const used = usageData?.used ?? user.analysisCount;
  const remaining = usageData?.remaining ?? (limit === -1 ? Infinity : Math.max(0, limit - used));
  const usagePercent = limit === -1 ? 0 : Math.min((used / limit) * 100, 100);

  const handleManageSubscription = async () => {
    if (!user.stripeCustomerId) {
      window.location.href = '/pricing';
      return;
    }

    setIsLoadingPortal(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const planConfig = {
    FREE: { color: 'zinc', label: 'Free', icon: '🌱' },
    PRO: { color: 'violet', label: 'Pro', icon: '⚡' },
    PREMIUM: { color: 'amber', label: 'Premium', icon: '👑' },
  }[user.plan] || { color: 'zinc', label: 'Free', icon: '🌱' };

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/5 rounded-full blur-[100px]" />
        
        <div className="relative max-w-2xl mx-auto px-4 pt-8 pb-6">
          {/* Profile Section */}
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center border-2 border-violet-500/30 shadow-xl shadow-violet-500/10">
                <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                </svg>
              </div>
              {/* Plan Badge */}
              <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                user.plan === 'PRO' ? 'bg-violet-600' : 
                user.plan === 'PREMIUM' ? 'bg-amber-500' : 
                'bg-zinc-700'
              } border-2 border-[#0a0a0b]`}>
                {planConfig.icon}
              </div>
            </div>

            {/* Name & Email */}
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
              {user.name || 'Welcome'}
            </h1>
            <p className="text-zinc-500 text-sm mb-3">{user.email}</p>
            
            {/* Plan & Member Since */}
            <div className="flex items-center gap-3 text-xs">
              <span className={`px-2.5 py-1 rounded-full font-semibold ${
                user.plan === 'PRO' ? 'bg-violet-500/20 text-violet-400' : 
                user.plan === 'PREMIUM' ? 'bg-amber-500/20 text-amber-400' : 
                'bg-zinc-800 text-zinc-400'
              }`}>
                {planConfig.label}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-500">Member since {memberSince}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 pb-8 space-y-4">
        
        {/* Usage Card - Prominent */}
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-zinc-400">Today&apos;s Analyses</span>
            </div>
            <span className="text-xs text-zinc-600">Resets at midnight</span>
          </div>
          
          {/* Usage Display */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-4xl font-bold text-white">
              {limit === -1 ? '∞' : used}
            </span>
            {limit !== -1 && (
              <span className="text-zinc-500 text-lg">/ {limit}</span>
            )}
          </div>
          
          {/* Progress Bar */}
          {limit !== -1 && (
            <div className="mb-4">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    usagePercent >= 100 ? 'bg-red-500' : 
                    usagePercent >= 80 ? 'bg-amber-500' : 
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="text-xs text-zinc-600 mt-2">
                {remaining > 0 
                  ? `${remaining} ${remaining === 1 ? 'analysis' : 'analyses'} remaining`
                  : 'Daily limit reached'
                }
              </p>
            </div>
          )}
          
          {/* CTA */}
          <Link 
            href="/matches"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse Matches
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Analyses */}
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-xs text-zinc-500">All Time</span>
            </div>
            <p className="text-2xl font-bold text-white">{user._count.analyses}</p>
            <p className="text-xs text-zinc-600 mt-1">analyses</p>
          </div>
          
          {/* Subscription */}
          <button
            onClick={handleManageSubscription}
            disabled={isLoadingPortal}
            className="bg-zinc-900/60 rounded-xl border border-zinc-800/60 p-4 text-left hover:border-violet-500/30 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-xs text-zinc-500">Plan</span>
            </div>
            <p className={`text-2xl font-bold ${
              user.plan === 'PRO' ? 'text-violet-400' : 
              user.plan === 'PREMIUM' ? 'text-amber-400' : 
              'text-white'
            }`}>
              {isLoadingPortal ? '...' : planConfig.label}
            </p>
            <p className="text-xs text-zinc-600 mt-1 group-hover:text-violet-400 transition-colors">
              {user.plan === 'FREE' ? 'Upgrade →' : 'Manage →'}
            </p>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider px-1">Quick Actions</p>
          
          <Link 
            href="/history"
            className="flex items-center gap-4 p-4 bg-zinc-900/60 rounded-xl border border-zinc-800/60 hover:border-zinc-700 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">Analysis History</p>
              <p className="text-zinc-600 text-xs">View your past analyses</p>
            </div>
            <svg className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link 
            href="/my-teams"
            className="flex items-center gap-4 p-4 bg-zinc-900/60 rounded-xl border border-zinc-800/60 hover:border-zinc-700 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">My Teams</p>
              <p className="text-zinc-600 text-xs">Track your favorites</p>
            </div>
            <svg className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Feedback Section */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider px-1">Feedback</p>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFeedbackModal({ isOpen: true, type: 'feature' })}
              className="flex flex-col items-center gap-2 p-4 bg-zinc-900/60 rounded-xl border border-zinc-800/60 hover:border-emerald-500/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-xs text-zinc-400 group-hover:text-emerald-400 transition-colors">Suggest Feature</span>
            </button>

            <button
              onClick={() => setFeedbackModal({ isOpen: true, type: 'problem' })}
              className="flex flex-col items-center gap-2 p-4 bg-zinc-900/60 rounded-xl border border-zinc-800/60 hover:border-amber-500/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-xs text-zinc-400 group-hover:text-amber-400 transition-colors">Report Issue</span>
            </button>
          </div>
        </div>

        {/* Account Settings */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider px-1">Account</p>
          
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/60 divide-y divide-zinc-800/60">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-zinc-500">Email</span>
              </div>
              <span className="text-sm text-zinc-400 truncate max-w-[180px]">{user.email}</span>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-3 p-4 w-full text-left hover:bg-zinc-800/30 transition-colors"
            >
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm text-red-500">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Danger Zone - Minimal */}
        <Link
          href="/account/delete"
          className="flex items-center justify-center gap-2 p-3 text-xs text-zinc-700 hover:text-red-500 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Account
        </Link>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        type={feedbackModal.type}
        userEmail={user.email}
        userName={user.name}
      />
    </div>
  );
}
