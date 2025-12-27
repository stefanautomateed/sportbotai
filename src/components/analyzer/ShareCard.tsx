'use client'

import { useState, useRef, useCallback } from 'react'
import { AnalyzeResponse } from '@/types'
import { Share2, Copy, Download, Check, Twitter, MessageCircle, Link2, Loader2 } from 'lucide-react'

interface ShareCardProps {
  result: AnalyzeResponse
  className?: string
}

export default function ShareCard({ result, className = '' }: ShareCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [creatingLink, setCreatingLink] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const { matchInfo, probabilities, valueAnalysis, riskAnalysis, tacticalAnalysis } = result

  // Derive verdict from probabilities (same logic as CoreVerdictCard)
  const getVerdict = useCallback(() => {
    const home = probabilities.homeWin ?? 0
    const away = probabilities.awayWin ?? 0
    const draw = probabilities.draw ?? 0
    const max = Math.max(home, away, draw)
    const diff = Math.abs(home - away)
    
    if (max === draw && draw > 0) {
      return { headline: 'Draw Expected', team: 'DRAW', prob: draw }
    }
    if (max === home) {
      const conf = diff > 25 ? 'Strong' : diff > 15 ? 'Moderate' : 'Slight'
      return { headline: `${conf} ${matchInfo.homeTeam} Edge`, team: 'HOME', prob: home }
    }
    const conf = diff > 25 ? 'Strong' : diff > 15 ? 'Moderate' : 'Slight'
    return { headline: `${conf} ${matchInfo.awayTeam} Edge`, team: 'AWAY', prob: away }
  }, [probabilities, matchInfo])

  const verdict = getVerdict()

  // Build OG image URL
  const buildOgImageUrl = useCallback(() => {
    const params = new URLSearchParams({
      home: matchInfo.homeTeam,
      away: matchInfo.awayTeam,
      league: matchInfo.leagueName,
      verdict: verdict.headline,
      risk: riskAnalysis.overallRiskLevel,
      confidence: String(verdict.prob || 75),
      date: matchInfo.matchDate,
      ...(valueAnalysis.bestValueSide !== 'NONE' && { value: valueAnalysis.bestValueSide })
    })
    return `/api/og?${params.toString()}`
  }, [matchInfo, verdict, valueAnalysis, riskAnalysis])

  // Create a short share URL
  const createShareUrl = useCallback(async (): Promise<string> => {
    // Return cached URL if available
    if (shareUrl) return shareUrl
    
    setCreatingLink(true)
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeam: matchInfo.homeTeam,
          awayTeam: matchInfo.awayTeam,
          league: matchInfo.leagueName,
          verdict: verdict.headline,
          risk: riskAnalysis.overallRiskLevel,
          confidence: verdict.prob,
          value: valueAnalysis.bestValueSide !== 'NONE' ? valueAnalysis.bestValueSide : null,
          date: matchInfo.matchDate,
          sport: matchInfo.sport || 'soccer',
        }),
      })
      
      const data = await response.json()
      if (data.success && data.url) {
        setShareUrl(data.url)
        return data.url
      }
    } catch (err) {
      console.error('Failed to create share URL:', err)
    } finally {
      setCreatingLink(false)
    }
    
    // Fallback to site URL
    return 'https://www.sportbotai.com'
  }, [matchInfo, verdict, valueAnalysis, riskAnalysis, shareUrl])

  // Generate shareable text summary with short URL
  const generateShareText = useCallback((url?: string) => {
    const bestValue = valueAnalysis.bestValueSide !== 'NONE' 
      ? `Best value: ${valueAnalysis.bestValueSide}` 
      : ''
    const risk = `Risk: ${riskAnalysis.overallRiskLevel}`
    const confidenceText = `Confidence: ${verdict.prob}%`
    
    const lines = [
      `🏆 ${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`,
      `📊 ${verdict.headline}`,
      bestValue,
      risk,
      confidenceText,
      '',
      '🤖 Analyzed by SportBot AI',
      url || 'https://www.sportbotai.com'
    ].filter(Boolean)

    return lines.join('\n')
  }, [matchInfo, verdict, valueAnalysis, riskAnalysis])

  // Copy text to clipboard
  const handleCopyText = async () => {
    const url = await createShareUrl()
    const text = generateShareText(url)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Copy shareable link
  const handleCopyLink = async () => {
    const url = await createShareUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  // Download OG image from API
  const handleDownloadImage = async () => {
    setDownloading(true)
    try {
      const response = await fetch(buildOgImageUrl())
      const blob = await response.blob()
      
      const link = document.createElement('a')
      link.download = `sportbot-${matchInfo.homeTeam}-vs-${matchInfo.awayTeam}.png`.replace(/\s+/g, '-').toLowerCase()
      link.href = URL.createObjectURL(blob)
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('Failed to download image:', err)
    } finally {
      setDownloading(false)
    }
  }

  // Share to Twitter
  const shareToTwitter = async () => {
    const url = await createShareUrl()
    const text = encodeURIComponent(generateShareText(url))
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  // Share to WhatsApp
  const shareToWhatsApp = async () => {
    const url = await createShareUrl()
    const text = encodeURIComponent(generateShareText(url))
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  // Native share (mobile)
  const handleNativeShare = async () => {
    const url = await createShareUrl()
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${matchInfo.homeTeam} vs ${matchInfo.awayTeam} Analysis`,
          text: generateShareText(url),
          url
        })
      } catch {
        // User cancelled - open modal as fallback
        setIsOpen(true)
      }
    } else {
      setIsOpen(true)
    }
  }

  // Determine verdict color
  const getVerdictColor = () => {
    switch (verdict.team) {
      case 'HOME': return 'text-blue-400'
      case 'AWAY': return 'text-orange-400'
      case 'DRAW': return 'text-gray-400'
      default: return 'text-emerald-400'
    }
  }

  // Get risk badge color
  const getRiskColor = () => {
    switch (riskAnalysis.overallRiskLevel) {
      case 'LOW': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'HIGH': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Share Button */}
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {/* Share Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div className="relative w-full max-w-md bg-[#0F1114] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">Share Analysis</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Preview Card */}
            <div className="p-5">
              <div 
                ref={cardRef}
                className="bg-gradient-to-br from-[#0A0D10] to-[#141820] rounded-xl border border-gray-800 p-5 space-y-4"
              >
                {/* SportBot Branding */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <span className="text-white font-semibold">SportBot AI</span>
                  </div>
                  <span className="text-xs text-gray-500">{matchInfo.leagueName}</span>
                </div>

                {/* Match Info */}
                <div className="text-center py-3">
                  <p className="text-gray-400 text-sm mb-2">{matchInfo.matchDate}</p>
                  <h4 className="text-xl font-bold text-white">
                    {matchInfo.homeTeam} <span className="text-gray-500">vs</span> {matchInfo.awayTeam}
                  </h4>
                </div>

                {/* Verdict */}
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <p className={`text-lg font-semibold ${getVerdictColor()}`}>
                    {verdict.headline}
                  </p>
                  {tacticalAnalysis.expertConclusionOneLiner && (
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                      {tacticalAnalysis.expertConclusionOneLiner}
                    </p>
                  )}
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-center gap-4">
                  {valueAnalysis.bestValueSide !== 'NONE' && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase">Best Value</p>
                      <p className="text-emerald-400 font-semibold">{valueAnalysis.bestValueSide}</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Risk</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getRiskColor()}`}>
                      {riskAnalysis.overallRiskLevel}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Confidence</p>
                    <p className="text-blue-400 font-semibold">{verdict.prob}%</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-gray-800 text-center">
                  <p className="text-xs text-gray-600">sportbotai.com • AI Match Research</p>
                </div>
              </div>
            </div>

            {/* Share Options */}
            <div className="px-5 pb-5 space-y-3">
              {/* Social Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={shareToTwitter}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg font-medium transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </button>
                <button
                  onClick={shareToWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
              </div>

              {/* Copy & Download */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopyText}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Text
                    </>
                  )}
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>

              {/* Download Image */}
              <button
                onClick={handleDownloadImage}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
                {downloading ? 'Generating...' : 'Download Image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
