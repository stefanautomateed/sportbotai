/**
 * Share Actions Component
 * 
 * Social sharing and image generation for match previews.
 * Creates shareable cards for social media.
 */

'use client';

import { useState } from 'react';

// i18n translations
const translations = {
  en: {
    shareThisPreview: 'Share This Preview',
    spreadTheWord: 'Spread the match intelligence',
    more: 'More',
    copy: 'Copy',
    copied: 'Copied!',
    loading: 'Loading...',
    generating: 'Generating...',
    generateShareImage: 'Generate Share Image',
    readFullPreview: 'Read Full Match Preview',
    inDepthAnalysis: 'In-depth analysis, betting angles & AI predictions',
    checkOutPreview: 'Check out my match preview for',
  },
  sr: {
    shareThisPreview: 'Podeli Ovaj Pregled',
    spreadTheWord: 'Podeli informacije o meču',
    more: 'Više',
    copy: 'Kopiraj',
    copied: 'Kopirano!',
    loading: 'Učitavanje...',
    generating: 'Generisanje...',
    generateShareImage: 'Generiši Sliku za Deljenje',
    readFullPreview: 'Pročitaj Ceo Pregled Meča',
    inDepthAnalysis: 'Detaljna analiza, uglovi klađenja i AI predikcije',
    checkOutPreview: 'Pogledaj moj pregled meča za',
  },
};

interface ShareActionsProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  headline?: string;
  kickoff?: string;
  locale?: 'en' | 'sr';
}

export default function ShareActions({
  matchId,
  homeTeam,
  awayTeam,
  headline,
  kickoff,
  locale = 'en',
}: ShareActionsProps) {
  const t = translations[locale];
  const [showCopied, setShowCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const matchTitle = `${homeTeam} vs ${awayTeam}`;
  const shareText = headline || `${t.checkOutPreview} ${matchTitle}`;
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/match/${matchId}`
    : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${shareText}\n\n`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: matchTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    }
  };

  const generateShareImage = async () => {
    setIsGenerating(true);
    // TODO: Integrate with /api/og endpoint for dynamic image generation
    setTimeout(() => {
      setIsGenerating(false);
      // Download or open image
    }, 1500);
  };

  return (
    <div className="bg-[#0F1114] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
            <span className="text-xl">📤</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{t.shareThisPreview}</h3>
            <p className="text-xs text-text-muted">{t.spreadTheWord}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick share buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={shareToTwitter}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-sm font-medium">X / Twitter</span>
          </button>

          <button
            onClick={shareToWhatsApp}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="text-sm font-medium">WhatsApp</span>
          </button>

          <button
            onClick={shareToTelegram}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            <span className="text-sm font-medium">Telegram</span>
          </button>

          {'share' in navigator && (
            <button
              onClick={nativeShare}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="text-sm font-medium">{t.more}</span>
            </button>
          )}
        </div>

        {/* Read Full Preview - links to news article */}
        {(() => {
          // Generate news article slug from team names
          const slug = `${homeTeam.toLowerCase().replace(/\s+/g, '-')}-vs-${awayTeam.toLowerCase().replace(/\s+/g, '-')}`;
          return (
            <a
              href={`/news/${slug}-2026-preview-prediction`}
              className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-accent/10 to-accent/5 hover:from-accent/20 hover:to-accent/10 border border-accent/20 hover:border-accent/40 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📰</span>
                <div>
                  <p className="text-sm font-medium text-white">{t.readFullPreview}</p>
                  <p className="text-xs text-text-muted">{t.inDepthAnalysis}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          );
        })()}


        {/* Copy link */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 text-sm text-text-muted truncate">
            {shareUrl || t.loading}
          </div>
          <button
            onClick={copyLink}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${showCopied
              ? 'bg-green-500 text-white'
              : 'bg-white/10 text-white hover:bg-white/20'
              }`}
          >
            {showCopied ? `✓ ${t.copied}` : t.copy}
          </button>
        </div>

        {/* Generate share image */}
        <button
          onClick={generateShareImage}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500/20 to-violet-500/20 hover:from-purple-500/30 hover:to-violet-500/30 border border-purple-500/20 text-white rounded-xl transition-all"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="font-medium">{t.generating}</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">{t.generateShareImage}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
