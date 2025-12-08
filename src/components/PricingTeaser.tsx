/**
 * Pricing Teaser section for landing page
 * 
 * Compact pricing preview with modern card design.
 */

import Link from 'next/link';

export default function PricingTeaser() {
  const plans = [
    {
      name: 'Free',
      price: '€0',
      period: '/month',
      description: 'Try basic analysis',
      features: ['3 analyses per day', 'Basic probabilities', 'Soccer only'],
      cta: 'Get Started',
      href: '/analyzer',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '€9.99',
      period: '/month',
      description: 'For regular analysts',
      features: ['Unlimited analyses', 'All sports', 'Value detection', 'Audio analysis'],
      cta: 'Start Pro Trial',
      href: '/pricing',
      highlighted: true,
    },
    {
      name: 'Premium',
      price: '€19.99',
      period: '/month',
      description: 'Maximum capabilities',
      features: ['Everything in Pro', 'Priority processing', 'API access', 'Advanced metrics'],
      cta: 'Go Premium',
      href: '/pricing',
      highlighted: false,
    },
  ];

  return (
    <section className="bg-white section-container">
      <div className="text-center mb-14">
        <p className="text-accent-cyan font-semibold text-sm uppercase tracking-wider mb-3">Pricing</p>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Start free, upgrade when you need more. No hidden fees.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div 
            key={plan.name}
            className={`rounded-2xl p-6 transition-all duration-300 ${
              plan.highlighted 
                ? 'bg-primary-900 text-white ring-2 ring-accent-lime shadow-xl scale-105' 
                : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Popular Badge */}
            {plan.highlighted && (
              <span className="inline-block bg-accent-lime text-primary-900 text-xs font-bold px-3 py-1 rounded-full mb-4">
                MOST POPULAR
              </span>
            )}

            {/* Plan Name */}
            <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
              {plan.name}
            </h3>
            <p className={`text-sm mb-4 ${plan.highlighted ? 'text-gray-300' : 'text-gray-600'}`}>
              {plan.description}
            </p>

            {/* Price */}
            <div className="mb-6">
              <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                {plan.price}
              </span>
              <span className={`text-sm ${plan.highlighted ? 'text-gray-300' : 'text-gray-500'}`}>
                {plan.period}
              </span>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, idx) => (
                <li key={idx} className={`flex items-center gap-2 text-sm ${plan.highlighted ? 'text-gray-200' : 'text-gray-600'}`}>
                  <svg className={`w-4 h-4 ${plan.highlighted ? 'text-accent-lime' : 'text-accent-green'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link 
              href={plan.href}
              className={`block text-center py-3 px-4 rounded-lg font-semibold transition-all ${
                plan.highlighted 
                  ? 'bg-accent-lime text-primary-900 hover:bg-accent-green' 
                  : 'bg-primary-900 text-white hover:bg-primary-800'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link href="/pricing" className="inline-flex items-center gap-2 text-accent-cyan font-medium hover:text-accent-lime transition-colors">
          View full pricing comparison
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
