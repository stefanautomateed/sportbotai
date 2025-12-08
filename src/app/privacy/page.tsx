/**
 * Privacy Policy Page (/privacy)
 * 
 * Privacy policy for the BetSense AI platform.
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for the BetSense AI platform.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <section className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
          <p className="text-gray-400 mt-2">Last updated: December 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="section-container">
        <div className="max-w-4xl mx-auto">
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              BetSense AI ("we", "us", "our") respects the privacy of its users. 
              This Privacy Policy explains how we collect, use, store 
              and protect your data when you use our platform.
            </p>
            <p className="text-gray-600 leading-relaxed">
              By using BetSense AI, you consent to the collection and use of information 
              in accordance with this policy.
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. Data We Collect</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">2.1 Data you provide directly:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li>Email address (upon registration)</li>
              <li>Payment data (processed by Stripe, we do not store card data)</li>
              <li>Data you enter in the analyzer (sports, teams, odds)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">2.2 Automatically collected data:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>IP address</li>
              <li>Browser and operating system type</li>
              <li>Pages you visit and time spent on them</li>
              <li>Cookies for site functionality</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. How We Use Your Data</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We use your data to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Provide and maintain the Service</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send service notifications (changes, maintenance)</li>
              <li>Improve user experience and performance</li>
              <li>Usage analytics (anonymized)</li>
              <li>Abuse prevention and security purposes</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Data Sharing</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>We do not sell your personal data to third parties.</strong>
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              We only share data with:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Stripe:</strong> for payment processing (see Stripe&apos;s privacy policy)</li>
              <li><strong>Hosting providers:</strong> Vercel for application hosting</li>
              <li><strong>AI providers:</strong> OpenAI/Anthropic for processing analyses (data is anonymized)</li>
              <li><strong>Legal requirements:</strong> when legally required</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Cookies</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We use the following types of cookies:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Necessary:</strong> for site functionality and authentication</li>
              <li><strong>Analytical:</strong> to understand how you use the site</li>
              <li><strong>Functional:</strong> to remember your preferences</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              You can control cookies through your browser settings.
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. Data Security</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We implement industry standards for data protection:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>HTTPS encryption for all communications</li>
              <li>Password hashing (we never store plain-text)</li>
              <li>Regular security patch updates</li>
              <li>Limited data access to authorized personnel only</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Request a copy of your data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for marketing communications</li>
              <li>Transfer your data to another service</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              To exercise these rights, contact us at privacy@betsenseai.com
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your data for as long as you have an active account. After account deletion, 
              data will be removed within 30 days, except for data we are legally 
              required to keep (e.g., transaction data for tax purposes).
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. Minors</h2>
            <p className="text-gray-600 leading-relaxed">
              BetSense AI is not intended for persons under 18 years of age. We do not knowingly 
              collect data from minors. If you learn that a minor has used 
              our service, please contact us.
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">10. Policy Changes</h2>
            <p className="text-gray-600 leading-relaxed">
              We may occasionally update this Privacy Policy. We will notify you of significant changes 
              via email or notification on the platform. Continued 
              use of the Service after changes constitutes acceptance of the new policy.
            </p>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">11. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For any questions regarding privacy, contact us at:
              <br />
              <strong>Email:</strong> privacy@betsenseai.com
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
