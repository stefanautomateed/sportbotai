import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get parameters from URL
    const homeTeam = searchParams.get('home') || 'Home Team'
    const awayTeam = searchParams.get('away') || 'Away Team'
    const league = searchParams.get('league') || 'Match Analysis'
    const verdict = searchParams.get('verdict') || 'AI Analysis Ready'
    const risk = searchParams.get('risk') || 'MEDIUM'
    const confidence = searchParams.get('confidence') || '75'
    const bestValue = searchParams.get('value') || ''
    const date = searchParams.get('date') || new Date().toLocaleDateString()

    // Risk colors
    const riskColors: Record<string, { bg: string; text: string }> = {
      LOW: { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
      MEDIUM: { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
      HIGH: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' }
    }

    const riskStyle = riskColors[risk] || riskColors.MEDIUM

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0A0D10',
            padding: '40px 50px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '30px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: '#2563eb',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: 'white', fontSize: '22px', fontWeight: 'bold' }}>S</span>
              </div>
              <span style={{ color: 'white', fontSize: '24px', fontWeight: '600' }}>
                SportBot AI
              </span>
            </div>
            <span style={{ color: '#6b7280', fontSize: '18px' }}>{league}</span>
          </div>

          {/* Match Info */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: '20px',
            }}
          >
            <span style={{ color: '#9ca3af', fontSize: '18px' }}>{date}</span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ color: 'white', fontSize: '42px', fontWeight: '700' }}>
                {homeTeam}
              </span>
              <span style={{ color: '#4b5563', fontSize: '32px' }}>vs</span>
              <span style={{ color: 'white', fontSize: '42px', fontWeight: '700' }}>
                {awayTeam}
              </span>
            </div>

            {/* Verdict Box */}
            <div
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '16px',
                padding: '24px 40px',
                marginTop: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  color: '#60a5fa',
                  fontSize: '28px',
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                {verdict}
              </span>
            </div>

            {/* Stats Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '40px',
                marginTop: '20px',
              }}
            >
              {bestValue && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px', textTransform: 'uppercase' }}>
                    Best Value
                  </span>
                  <span style={{ color: '#10b981', fontSize: '22px', fontWeight: '600' }}>
                    {bestValue}
                  </span>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontSize: '14px', textTransform: 'uppercase' }}>
                  Risk
                </span>
                <div
                  style={{
                    backgroundColor: riskStyle.bg,
                    color: riskStyle.text,
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  {risk}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontSize: '14px', textTransform: 'uppercase' }}>
                  Confidence
                </span>
                <span style={{ color: '#60a5fa', fontSize: '22px', fontWeight: '600' }}>
                  {confidence}%
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              borderTop: '1px solid #1f2937',
              paddingTop: '20px',
            }}
          >
            <span style={{ color: '#4b5563', fontSize: '16px' }}>
              sportbot.ai • AI Match Research Assistant
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          'X-Robots-Tag': 'noindex', // Don't index the image itself, just allow fetching
        },
      }
    )
  } catch (error) {
    console.error('OG Image generation error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
