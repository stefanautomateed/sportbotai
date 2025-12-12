/**
 * Match Preview Skeleton Component
 * 
 * Loading state for the match preview page.
 * Provides visual feedback while data is being fetched.
 */

'use client';

function Pulse({ className }: { className?: string }) {
  return (
    <div className={`bg-white/10 animate-pulse rounded ${className}`} />
  );
}

export default function MatchPreviewSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white">
      {/* Header skeleton */}
      <div className="border-b border-white/10 bg-[#0F1114]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center gap-4">
            {/* League badge */}
            <Pulse className="w-24 h-6 rounded-full" />
            
            {/* Teams */}
            <div className="flex items-center justify-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <Pulse className="w-16 h-16 rounded-full" />
                <Pulse className="w-24 h-5" />
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <Pulse className="w-8 h-4" />
                <Pulse className="w-16 h-8" />
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <Pulse className="w-16 h-16 rounded-full" />
                <Pulse className="w-24 h-5" />
              </div>
            </div>

            {/* Venue */}
            <Pulse className="w-40 h-4" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Headlines section skeleton */}
          <div className="bg-[#0F1114] rounded-2xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-4">
              <Pulse className="w-10 h-10 rounded-xl" />
              <div className="space-y-2">
                <Pulse className="w-32 h-5" />
                <Pulse className="w-48 h-3" />
              </div>
            </div>
            
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Pulse className="w-6 h-6 rounded flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Pulse className="w-full h-4" />
                      <Pulse className="w-3/4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form comparison skeleton */}
          <div className="bg-[#0F1114] rounded-2xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-4">
              <Pulse className="w-10 h-10 rounded-xl" />
              <Pulse className="w-36 h-5" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(j => (
                      <Pulse key={j} className="w-8 h-8 rounded" />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Pulse className="h-16 rounded-xl" />
                    <Pulse className="h-16 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* H2H skeleton */}
          <div className="bg-[#0F1114] rounded-2xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-4">
              <Pulse className="w-10 h-10 rounded-xl" />
              <Pulse className="w-32 h-5" />
            </div>
            
            <div className="space-y-4">
              <Pulse className="h-4 rounded-full" />
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Pulse key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            </div>
          </div>

          {/* Key absences skeleton */}
          <div className="bg-[#0F1114] rounded-2xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-4">
              <Pulse className="w-10 h-10 rounded-xl" />
              <Pulse className="w-28 h-5" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="space-y-2">
                  <Pulse className="w-24 h-4 mb-3" />
                  <Pulse className="h-20 rounded-xl" />
                  <Pulse className="h-20 rounded-xl" />
                </div>
              ))}
            </div>
          </div>

          {/* AI Briefing skeleton */}
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Pulse className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <Pulse className="w-36 h-5" />
                  <Pulse className="w-48 h-3" />
                </div>
              </div>
              <Pulse className="w-12 h-12 rounded-xl" />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Pulse className="w-full h-4" />
                <Pulse className="w-full h-4" />
                <Pulse className="w-3/4 h-4" />
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <Pulse className="w-20 h-3" />
                <Pulse className="w-full h-4" />
                <Pulse className="w-full h-4" />
                <Pulse className="w-2/3 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
