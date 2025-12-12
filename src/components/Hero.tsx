/**
 * Hero section for landing page
 * 
 * Modern sports analytics themed hero with mock analysis card preview.
 */

import Link from 'next/link';
import { LiveStatsCounter } from './SocialProof';

export default function Hero() {
  return (
    <section className="relative bg-bg-primary overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#2A3036_1px,transparent_1px),linear-gradient(to_bottom,#2A3036_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
        <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-primary/10 rounded-full blur-[80px] sm:blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-accent/10 rounded-full blur-[60px] sm:blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Left Side - Content */}
          <div className="text-center lg:text-left">
            {/* Live Stats Badge */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4 sm:mb-6 justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-xs sm:text-sm font-medium text-gray-300 backdrop-blur-sm border border-white/10">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                Understand any match in 60 seconds
              </div>
              <LiveStatsCounter className="hidden sm:flex" />
            </div>

            {/* Headline - H1 for SEO */}
            <h1 className="text-3xl xs:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-4 sm:mb-6">
              Know Any Match
              <br className="hidden xs:block" />
              <span className="text-accent">Before It Happens</span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-gray-400 leading-relaxed mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">
              Pre-match intelligence: headlines, form, H2H history & AI insights.
              <strong className="text-gray-300"> Soccer, NBA, NFL, NHL & UFC—all in 60 seconds.</strong>
            </p>

            {/* CTA Buttons - Stack on mobile */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link 
                href="/matches" 
                className="btn-primary text-center text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto"
              >
                Browse today&apos;s matches
              </Link>
              <Link 
                href="/pricing" 
                className="btn-secondary text-center text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto"
              >
                View pricing
              </Link>
            </div>

            {/* Trust Indicators - Horizontal scroll on mobile */}
            <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/10">
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📰</span>
                  <span>Match Headlines</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <span>Form & H2H</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <span>AI Briefings</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📤</span>
                  <span>Share Cards</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Mock Analysis Card */}
          <div className="relative lg:pl-8">
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-50" />
              
              {/* Card - Match Intelligence Preview */}
              <div className="relative bg-bg-card border border-divider rounded-card p-6 shadow-2xl">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <span className="text-xl">⚽</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">Premier League</p>
                      <p className="text-gray-500 text-sm">Today • 15:00</p>
                    </div>
                  </div>
                  <span className="badge badge-success">Preview Ready</span>
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between py-4 border-y border-divider">
                  <div className="text-center flex-1">
                    <p className="text-white font-bold text-lg">Arsenal</p>
                    <p className="text-gray-500 text-sm">Home</p>
                  </div>
                  <div className="px-4">
                    <span className="text-gray-600 text-2xl font-light">vs</span>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-white font-bold text-lg">Chelsea</p>
                    <p className="text-gray-500 text-sm">Away</p>
                  </div>
                </div>

                {/* Match Headlines */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-text-muted uppercase tracking-wider">🔥 Match Headlines</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                      <span className="text-green-400">📈</span>
                      <p className="text-sm text-gray-300">Arsenal: 8 home wins in a row</p>
                    </div>
                    <div className="flex items-start gap-2 bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                      <span className="text-red-400">📉</span>
                      <p className="text-sm text-gray-300">Chelsea: Only 2 away wins this season</p>
                    </div>
                    <div className="flex items-start gap-2 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                      <span className="text-blue-400">⚔️</span>
                      <p className="text-sm text-gray-300">H2H: Arsenal unbeaten in last 5</p>
                    </div>
                  </div>
                </div>

                {/* Form Comparison */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-gray-500 mb-2">Arsenal Form</p>
                    <div className="flex gap-1">
                      {['W','W','W','D','W'].map((r, i) => (
                        <span key={i} className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold ${
                          r === 'W' ? 'bg-green-500/20 text-green-400' : 
                          r === 'D' ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-red-500/20 text-red-400'
                        }`}>{r}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-gray-500 mb-2">Chelsea Form</p>
                    <div className="flex gap-1">
                      {['L','D','W','L','L'].map((r, i) => (
                        <span key={i} className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold ${
                          r === 'W' ? 'bg-green-500/20 text-green-400' : 
                          r === 'D' ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-red-500/20 text-red-400'
                        }`}>{r}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Briefing Preview */}
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-violet-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🤖</span>
                    <span className="text-white font-medium text-sm">AI Briefing</span>
                    <span className="text-xs text-gray-500">• 60 sec</span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Arsenal enter this London derby in dominant home form. Chelsea&apos;s away struggles continue with just 2 wins on the road...
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -right-4 top-1/4 bg-bg-card border border-divider rounded-lg px-3 py-2 shadow-lg animate-float hidden lg:block">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-white text-sm font-medium">Live Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
