/**
 * Serbian Account Dashboard Client Component
 * Interaktivna kontrolna tabla sa upravljanjem pretplatom
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import ProBadge from '@/components/ProBadge';
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

const PLAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  FREE: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  PRO: { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30' },
  PREMIUM: { bg: 'bg-slate-400/20', text: 'text-slate-300', border: 'border-slate-400/30' },
};

const PLAN_NAMES_SR: Record<string, string> = {
  FREE: 'Besplatno',
  PRO: 'Pro',
  PREMIUM: 'Premium',
};

export default function AccountDashboardSr({ user }: Props) {
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
        console.error('Greška pri učitavanju korišćenja:', error);
      }
    };
    fetchUsage();
  }, [user.analysisCount, user.plan]);

  const planColors = PLAN_COLORS[user.plan] || PLAN_COLORS.FREE;
  const limit = usageData?.limit ?? PLAN_LIMITS[user.plan] ?? 1;
  const used = usageData?.used ?? user.analysisCount;
  const remaining = usageData?.remaining ?? (limit === -1 ? Infinity : Math.max(0, limit - used));
  const usagePercent = limit === -1 ? 0 : (used / limit) * 100;

  const handleManageSubscription = async () => {
    if (!user.stripeCustomerId) {
      window.location.href = '/sr/pricing';
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
      } else {
        throw new Error(data.error || 'Greška pri kreiranju portal sesije');
      }
    } catch (error) {
      console.error('Greška pri otvaranju portala:', error);
      alert('Greška pri otvaranju portala za upravljanje pretplatom. Pokušajte ponovo.');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary py-8 sm:py-12">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-1">
              Moj Nalog
            </h1>
            <p className="text-text-secondary">
              Upravljajte vašim nalogom i pretplatom
            </p>
          </div>
          <Link 
            href="/account" 
            className="text-sm text-slate-500 hover:text-primary transition-colors"
          >
            🌐 English
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-bg-card rounded-card border border-divider p-6 mb-6">
          <div className="flex items-start gap-4">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || 'Avatar'}
                width={64}
                height={64}
                className="rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-2xl text-primary">
                  {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold text-text-primary">
                  {user.name || 'Korisnik'}
                </h2>
                {user.plan !== 'FREE' && <ProBadge />}
              </div>
              <p className="text-text-secondary text-sm">{user.email}</p>
              <p className="text-text-tertiary text-xs mt-1">
                Član od {new Date(user.createdAt).toLocaleDateString('sr-RS', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Plan & Usage */}
        <div className="bg-bg-card rounded-card border border-divider p-6 mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Plan i Korišćenje
          </h3>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-full ${planColors.bg} ${planColors.text} ${planColors.border} border text-sm font-medium`}>
                {PLAN_NAMES_SR[user.plan] || user.plan}
              </div>
              {user.plan === 'FREE' && (
                <Link
                  href="/sr/pricing"
                  className="text-sm text-primary hover:text-primary-hover transition-colors"
                >
                  Nadogradi →
                </Link>
              )}
            </div>
            {user.stripeSubscriptionId && (
              <button
                onClick={handleManageSubscription}
                disabled={isLoadingPortal}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              >
                {isLoadingPortal ? 'Učitavanje...' : 'Upravljaj Pretplatom'}
              </button>
            )}
          </div>

          {/* Usage Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Analiza ovog meseca</span>
              <span className="text-text-primary font-medium">
                {used} / {limit === -1 ? '∞' : limit}
              </span>
            </div>
            <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  usagePercent >= 90 ? 'bg-danger' : usagePercent >= 70 ? 'bg-warning' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(100, usagePercent)}%` }}
              />
            </div>
            <p className="text-text-tertiary text-xs">
              {remaining === Infinity
                ? 'Neograničene analize'
                : remaining > 0
                ? `${remaining} analiza preostalo ovog meseca`
                : 'Dostigli ste mesečni limit'}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-bg-card rounded-card border border-divider p-6 mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Brzi Linkovi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/sr/history"
              className="flex items-center gap-3 p-3 rounded-lg bg-bg-primary hover:bg-bg-hover transition-colors"
            >
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-text-primary">Istorija Analiza</p>
                <p className="text-xs text-text-secondary">{user._count.analyses} ukupno analiza</p>
              </div>
            </Link>
            <Link
              href="/sr/my-teams"
              className="flex items-center gap-3 p-3 rounded-lg bg-bg-primary hover:bg-bg-hover transition-colors"
            >
              <span className="text-2xl">⭐</span>
              <div>
                <p className="font-medium text-text-primary">Moji Timovi</p>
                <p className="text-xs text-text-secondary">Pratite omiljene timove</p>
              </div>
            </Link>
            <Link
              href="/sr/matches"
              className="flex items-center gap-3 p-3 rounded-lg bg-bg-primary hover:bg-bg-hover transition-colors"
            >
              <span className="text-2xl">⚽</span>
              <div>
                <p className="font-medium text-text-primary">Utakmice</p>
                <p className="text-xs text-text-secondary">Pregledajte današnje utakmice</p>
              </div>
            </Link>
            <Link
              href="/sr/ai-desk"
              className="flex items-center gap-3 p-3 rounded-lg bg-bg-primary hover:bg-bg-hover transition-colors"
            >
              <span className="text-2xl">🤖</span>
              <div>
                <p className="font-medium text-text-primary">AI Desk</p>
                <p className="text-xs text-text-secondary">Pitajte AI o sportu</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-bg-card rounded-card border border-divider p-6 mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Povratne Informacije
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            Pomozite nam da poboljšamo SportBot AI vašim sugestijama.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setFeedbackModal({ isOpen: true, type: 'feature' })}
              className="flex-1 py-2 px-4 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              💡 Predloži Funkciju
            </button>
            <button
              onClick={() => setFeedbackModal({ isOpen: true, type: 'problem' })}
              className="flex-1 py-2 px-4 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors text-sm font-medium"
            >
              🐛 Prijavi Problem
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <div className="text-center">
          <button
            onClick={() => signOut({ callbackUrl: '/sr' })}
            className="text-text-secondary hover:text-danger transition-colors text-sm"
          >
            Odjavite se
          </button>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        type={feedbackModal.type}
      />
    </div>
  );
}
