/**
 * Pricing Teaser section for landing page
 * 
 * Brief overview of pricing plans with CTA to /pricing page.
 */

import Link from 'next/link';

export default function PricingTeaser() {
  return (
    <section className="section-container">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Start for free or unlock advanced features with Pro and Premium plans.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* FREE */}
        <div className="card text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
          <div className="text-4xl font-bold text-gray-900 mb-4">
            €0<span className="text-lg text-gray-500 font-normal">/mo</span>
          </div>
          <p className="text-gray-600 mb-6">Try basic features</p>
          <Link href="/pricing" className="btn-secondary w-full block text-center">
            Learn More
          </Link>
        </div>

        {/* PRO - highlighted */}
        <div className="card text-center border-2 border-primary-600 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-sm font-bold px-4 py-1 rounded-full">
            POPULAR
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
          <div className="text-4xl font-bold text-primary-600 mb-4">
            €9.99<span className="text-lg text-gray-500 font-normal">/mo</span>
          </div>
          <p className="text-gray-600 mb-6">For serious analysts</p>
          <Link href="/pricing" className="btn-primary w-full block text-center">
            Activate Pro
          </Link>
        </div>

        {/* PREMIUM */}
        <div className="card text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Premium</h3>
          <div className="text-4xl font-bold text-gray-900 mb-4">
            €19.99<span className="text-lg text-gray-500 font-normal">/mo</span>
          </div>
          <p className="text-gray-600 mb-6">Maximum capabilities</p>
          <Link href="/pricing" className="btn-secondary w-full block text-center">
            Learn More
          </Link>
        </div>
      </div>

      <div className="text-center mt-8">
        <Link href="/pricing" className="text-primary-600 font-medium hover:underline">
          View detailed plan comparison →
        </Link>
      </div>
    </section>
  );
}
