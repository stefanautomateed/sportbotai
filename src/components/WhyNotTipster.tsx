/**
 * Why Not Tipster section
 * 
 * IMPORTANT: This section is key for positioning BetSense AI
 * as an educational tool, NOT a tipster service.
 * 
 * This is important for regulatory and ethical reasons.
 */

export default function WhyNotTipster() {
  return (
    <section className="bg-gray-900 text-white">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - text */}
          <div>
            <div className="inline-flex items-center px-4 py-2 bg-accent-red/20 rounded-full text-sm font-medium text-accent-red mb-6">
              ⚠️ Important to understand
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Why We&apos;re <span className="text-accent-red line-through">Not</span> a Tipster Service
            </h2>
            
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                <strong className="text-white">BetSense AI is not a tipster.</strong> We don&apos;t sell 
                &quot;sure tips&quot;, we don&apos;t promise winnings and we don&apos;t claim to have insider information.
              </p>
              <p>
                Our tool uses available public data and AI algorithms to generate 
                <strong className="text-white"> analytical estimates</strong> — but every estimate 
                has a margin of error and is never a guarantee.
              </p>
              <p>
                Betting always carries risk. Our goal is to provide you with 
                <strong className="text-white"> better insights</strong>, not to make decisions for you.
              </p>
            </div>
          </div>

          {/* Right side - comparison */}
          <div className="space-y-6">
            {/* What we ARE */}
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-6">
              <h3 className="text-accent-green font-bold text-lg mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                What BetSense AI IS
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-accent-green mt-1">✓</span>
                  AI-based analytical tool
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-green mt-1">✓</span>
                  Educational resource for understanding odds
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-green mt-1">✓</span>
                  Transparent about limitations
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-green mt-1">✓</span>
                  Promoter of responsible gambling
                </li>
              </ul>
            </div>

            {/* What we are NOT */}
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-6">
              <h3 className="text-accent-red font-bold text-lg mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                What BetSense AI is NOT
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-accent-red mt-1">✗</span>
                  Tipster service with &quot;sure tips&quot;
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-red mt-1">✗</span>
                  Source of insider information
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-red mt-1">✗</span>
                  Guarantee of winnings
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-red mt-1">✗</span>
                  Financial advisor
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
