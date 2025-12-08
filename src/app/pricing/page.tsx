/**
 * Pricing Page (/pricing)
 * 
 * Page with detailed overview of pricing plans and Stripe checkout.
 */

import { Metadata } from 'next';
import PricingCards from '@/components/PricingCards';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Choose the plan that suits you - Free, Pro or Premium. AI analysis of sports events.',
};

export default function PricingPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header section */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple Pricing
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            No hidden fees. Cancel anytime. Start free and upgrade when you&apos;re ready.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="section-container -mt-8">
        <PricingCards />
      </section>

      {/* FAQ section */}
      <section className="section-container">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-2">Can I cancel my subscription?</h3>
            <p className="text-gray-600">
              Yes, you can cancel your subscription at any time. There are no fixed-term contracts. 
              Access remains active until the end of the paid period.
            </p>
          </div>

          <div className="card">
            <h3 className="font-bold text-gray-900 mb-2">What payment methods are supported?</h3>
            <p className="text-gray-600">
              We accept all major cards (Visa, Mastercard, Amex) through the secure Stripe payment system.
            </p>
          </div>

          <div className="card">
            <h3 className="font-bold text-gray-900 mb-2">Are analyses a guarantee of winnings?</h3>
            <p className="text-gray-600">
              <strong>No.</strong> BetSense AI is an analytical tool that provides estimates based on available data. 
              Sports betting always carries risk and we cannot guarantee any outcome.
            </p>
          </div>

          <div className="card">
            <h3 className="font-bold text-gray-900 mb-2">What do I get with the Free plan?</h3>
            <p className="text-gray-600">
              The Free plan includes 3 analyses per day for soccer. Great for trying out the platform 
              before deciding to upgrade.
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-amber-50 border-t border-amber-200 py-8">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-amber-800 text-sm leading-relaxed">
            <strong>⚠️ Note:</strong> Payment for BetSense AI does not guarantee winnings. 
            Our tool is purely analytical and educational. Bet responsibly and only with money you can afford to lose.
          </p>
        </div>
      </section>
    </div>
  );
}
