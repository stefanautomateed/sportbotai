/**
 * Features section
 * 
 * Premium features grid with sports analytics theme.
 */

export default function Features() {
  const features = [
    {
      title: 'Multi-Sport Coverage',
      description: 'Soccer, NBA, NFL, Tennis, NHL, MMA, and more—all in one platform.',
      icon: '🌍',
      badge: '17+ Sports',
    },
    {
      title: 'Value Index',
      description: 'Compare AI probabilities with bookmaker odds to spot potential value.',
      icon: '📊',
      badge: 'Smart Detection',
    },
    {
      title: 'Momentum Scoring',
      description: 'Track team form and momentum trends with visual indicators.',
      icon: '📈',
      badge: 'Live Trends',
    },
    {
      title: 'Upset Potential',
      description: 'AI identifies matches where underdogs have higher-than-expected chances.',
      icon: '⚡',
      badge: 'AI Powered',
    },
    {
      title: 'Risk Assessment',
      description: 'Clear risk levels (Low/Medium/High) with bankroll impact insights.',
      icon: '🛡️',
      badge: 'Transparent',
    },
    {
      title: 'Audio Analysis',
      description: 'Listen to AI-generated match analysis with ElevenLabs voice technology.',
      icon: '🎧',
      badge: 'New',
    },
  ];

  return (
    <section className="bg-gray-50 section-container">
      <div className="text-center mb-14">
        <p className="text-accent-cyan font-semibold text-sm uppercase tracking-wider mb-3">Features</p>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Everything you need for smarter analysis
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Professional-grade analytics tools designed for informed decision-making.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <div 
            key={feature.title} 
            className="bg-white rounded-xl p-6 border border-gray-100 hover:border-accent-cyan/30 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-3xl">{feature.icon}</span>
              <span className="text-xs font-medium px-2 py-1 bg-primary-900/5 text-primary-900 rounded-full">
                {feature.badge}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-accent-cyan transition-colors">
              {feature.title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
