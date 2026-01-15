'use client';

import { useState, useCallback } from 'react';

/**
 * Parlay Calculator Tool
 * 
 * Calculates total odds and potential payout for multi-leg parlays.
 * SEO target: "parlay calculator", "parlay odds calculator", "accumulator calculator"
 */

interface ParlayLeg {
    id: number;
    odds: string;
}

interface ParlayResult {
    totalDecimalOdds: string;
    totalAmericanOdds: string;
    impliedProbability: string;
    potentialPayout: string;
    potentialProfit: string;
}

// Convert any odds format to decimal
function toDecimal(odds: string, format: 'american' | 'decimal'): number | null {
    const num = parseFloat(odds);
    if (isNaN(num)) return null;

    if (format === 'decimal') {
        return num >= 1 ? num : null;
    } else {
        // American to decimal
        if (num > 0) {
            return (num / 100) + 1;
        } else if (num < -99) {
            return (100 / Math.abs(num)) + 1;
        }
        return null;
    }
}

// Convert decimal to American
function decimalToAmerican(decimal: number): string {
    if (decimal >= 2) {
        return `+${Math.round((decimal - 1) * 100)}`;
    } else {
        return `${Math.round(-100 / (decimal - 1))}`;
    }
}

export default function ParlayCalculatorPage() {
    const [stake, setStake] = useState('100');
    const [oddsFormat, setOddsFormat] = useState<'american' | 'decimal'>('american');
    const [legs, setLegs] = useState<ParlayLeg[]>([
        { id: 1, odds: '' },
        { id: 2, odds: '' },
    ]);
    const [result, setResult] = useState<ParlayResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const addLeg = () => {
        if (legs.length < 15) {
            setLegs([...legs, { id: Date.now(), odds: '' }]);
            setResult(null);
        }
    };

    const removeLeg = (id: number) => {
        if (legs.length > 2) {
            setLegs(legs.filter(leg => leg.id !== id));
            setResult(null);
        }
    };

    const updateLeg = (id: number, odds: string) => {
        setLegs(legs.map(leg => leg.id === id ? { ...leg, odds } : leg));
        setResult(null);
    };

    const calculateParlay = useCallback(() => {
        setError(null);
        setResult(null);

        const stakeNum = parseFloat(stake);
        if (isNaN(stakeNum) || stakeNum <= 0) {
            setError('Please enter a valid stake amount');
            return;
        }

        // Convert all legs to decimal odds
        const decimalOdds: number[] = [];
        for (let i = 0; i < legs.length; i++) {
            if (!legs[i].odds.trim()) {
                setError(`Please enter odds for Leg ${i + 1}`);
                return;
            }
            const decimal = toDecimal(legs[i].odds, oddsFormat);
            if (!decimal) {
                setError(`Invalid odds for Leg ${i + 1}`);
                return;
            }
            decimalOdds.push(decimal);
        }

        // Calculate total parlay odds (multiply all legs)
        const totalDecimal = decimalOdds.reduce((acc, odds) => acc * odds, 1);

        // Calculate implied probability
        const impliedProb = (1 / totalDecimal) * 100;

        // Calculate payouts
        const potentialPayout = stakeNum * totalDecimal;
        const potentialProfit = potentialPayout - stakeNum;

        setResult({
            totalDecimalOdds: totalDecimal.toFixed(2),
            totalAmericanOdds: decimalToAmerican(totalDecimal),
            impliedProbability: `${impliedProb.toFixed(2)}%`,
            potentialPayout: potentialPayout.toFixed(2),
            potentialProfit: potentialProfit.toFixed(2),
        });
    }, [stake, legs, oddsFormat]);

    return (
        <main className="min-h-screen bg-bg-primary">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px]" />
                </div>

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
                    {/* Back Link */}
                    <a
                        href="/tools"
                        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        All Tools
                    </a>

                    {/* Page Header */}
                    <div className="text-center mb-10 sm:mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full text-xs sm:text-sm font-medium text-gray-300 border border-white/10 mb-6">
                            <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 3v18h18" />
                                <path d="M7 16l4-4 4 4 5-6" />
                            </svg>
                            Free Betting Tool
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
                            Parlay
                            <span className="block text-gradient-accent">Calculator</span>
                        </h1>

                        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
                            Calculate potential payouts for multi-leg parlays.
                            Add up to 15 legs and see your total odds instantly.
                        </p>
                    </div>

                    {/* Calculator Card */}
                    <div className="card-glass p-6 sm:p-8 max-w-xl mx-auto">
                        {/* Odds Format Toggle */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-3">
                                Odds Format
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['american', 'decimal'] as const).map((format) => (
                                    <button
                                        key={format}
                                        onClick={() => {
                                            setOddsFormat(format);
                                            setLegs(legs.map(leg => ({ ...leg, odds: '' })));
                                            setResult(null);
                                            setError(null);
                                        }}
                                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${oddsFormat === format
                                            ? 'bg-accent text-primary-900 shadow-glow-accent'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                                            }`}
                                    >
                                        {format}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stake Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Stake ($)
                            </label>
                            <input
                                type="number"
                                value={stake}
                                onChange={(e) => { setStake(e.target.value); setResult(null); }}
                                placeholder="100"
                                className="input-field text-lg"
                            />
                        </div>

                        {/* Parlay Legs */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-400">
                                    Parlay Legs ({legs.length})
                                </label>
                                <button
                                    onClick={addLeg}
                                    disabled={legs.length >= 15}
                                    className="text-sm text-accent hover:text-accent-light disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                                >
                                    + Add Leg
                                </button>
                            </div>

                            <div className="space-y-3">
                                {legs.map((leg, index) => (
                                    <div key={leg.id} className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500 w-8">{index + 1}.</span>
                                        <input
                                            type="text"
                                            value={leg.odds}
                                            onChange={(e) => updateLeg(leg.id, e.target.value)}
                                            placeholder={oddsFormat === 'american' ? '-110' : '1.91'}
                                            className="input-field flex-1"
                                        />
                                        {legs.length > 2 && (
                                            <button
                                                onClick={() => removeLeg(leg.id)}
                                                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={calculateParlay}
                            className="btn-primary w-full py-4 text-lg"
                        >
                            Calculate Parlay
                        </button>

                        {error && (
                            <p className="mt-4 text-sm text-danger text-center">{error}</p>
                        )}

                        {/* Results */}
                        {result && (
                            <div className="animate-fadeInUp mt-6">
                                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

                                <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
                                    Parlay Results
                                </h3>

                                {/* Main Result */}
                                <div className="bg-accent/10 rounded-xl p-5 border border-accent/30 mb-4">
                                    <div className="text-xs text-accent uppercase tracking-wider mb-1">Potential Payout</div>
                                    <div className="text-3xl font-bold text-accent">${result.potentialPayout}</div>
                                    <div className="text-sm text-accent/70 mt-1">Profit: ${result.potentialProfit}</div>
                                </div>

                                {/* Odds Breakdown */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total American</div>
                                        <div className="text-lg font-bold text-white">{result.totalAmericanOdds}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Decimal</div>
                                        <div className="text-lg font-bold text-white">{result.totalDecimalOdds}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Win Prob</div>
                                        <div className="text-lg font-bold text-white">{result.impliedProbability}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* How to Use Section */}
            <section className="border-t border-white/10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                        How to Use This Parlay Calculator
                    </h2>
                    <p className="text-gray-400 mb-6">
                        The parlay calculator allows you to quickly calculate the payout of your parlay bet by inputting the odds for each leg.
                        Whether you&apos;re betting NFL, NBA, MLB, or any other sport, this free parlay calculator shows your total odds and potential winnings.
                    </p>

                    <div className="grid sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold mb-3">1</div>
                            <h3 className="text-white font-semibold mb-2">Enter Your Stake</h3>
                            <p className="text-gray-400 text-sm">Input the amount you want to wager on your parlay bet.</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold mb-3">2</div>
                            <h3 className="text-white font-semibold mb-2">Add Parlay Legs</h3>
                            <p className="text-gray-400 text-sm">Enter the odds for each leg. Add up to 15 legs to your parlay.</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold mb-3">3</div>
                            <h3 className="text-white font-semibold mb-2">See Your Payout</h3>
                            <p className="text-gray-400 text-sm">The parlay calculator instantly shows your total odds and potential payout.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Examples Section */}
            <section className="border-t border-white/10 bg-white/[0.01]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                        Parlay Calculator Examples by Sport
                    </h2>

                    <div className="space-y-6">
                        {/* NFL Example */}
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">🏈</span>
                                <h3 className="text-lg font-semibold text-white">NFL Parlay Example</h3>
                            </div>
                            <p className="text-gray-400 mb-4">
                                Let&apos;s say you want to bet a 3-leg NFL parlay with a $100 stake:
                            </p>
                            <ul className="text-gray-300 space-y-1 mb-4 text-sm">
                                <li>• <strong>Leg 1:</strong> Kansas City Chiefs -6.5 at -110</li>
                                <li>• <strong>Leg 2:</strong> Buffalo Bills Moneyline at +150</li>
                                <li>• <strong>Leg 3:</strong> Over 45.5 points (Eagles vs. Cowboys) at -105</li>
                            </ul>
                            <p className="text-gray-400 text-sm">
                                Using the parlay calculator: The combined odds equal approximately +597, meaning a $100 bet returns $697 total ($597 profit) if all three legs win.
                            </p>
                        </div>

                        {/* NBA Example */}
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">🏀</span>
                                <h3 className="text-lg font-semibold text-white">NBA Parlay Example</h3>
                            </div>
                            <p className="text-gray-400 mb-4">
                                Here&apos;s a 2-leg NBA parlay example with $50 stake:
                            </p>
                            <ul className="text-gray-300 space-y-1 mb-4 text-sm">
                                <li>• <strong>Leg 1:</strong> Lakers -4.5 at -110</li>
                                <li>• <strong>Leg 2:</strong> Celtics Moneyline at -140</li>
                            </ul>
                            <p className="text-gray-400 text-sm">
                                The parlay calculator shows combined odds of +188. A $50 wager would return $144 total ($94 profit) if both teams cover.
                            </p>
                        </div>

                        {/* MLB Example */}
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">⚾</span>
                                <h3 className="text-lg font-semibold text-white">MLB Parlay Example</h3>
                            </div>
                            <p className="text-gray-400 mb-4">
                                MLB same-game parlays are popular. Here&apos;s a 4-leg example:
                            </p>
                            <ul className="text-gray-300 space-y-1 mb-4 text-sm">
                                <li>• <strong>Leg 1:</strong> Yankees Moneyline at -130</li>
                                <li>• <strong>Leg 2:</strong> Over 8.5 runs at -115</li>
                                <li>• <strong>Leg 3:</strong> Aaron Judge 1+ hit at -200</li>
                                <li>• <strong>Leg 4:</strong> Dodgers Moneyline at -150</li>
                            </ul>
                            <p className="text-gray-400 text-sm">
                                Input these odds into the parlay calculator to see your exact payout. Four favorites like this typically result in +300 to +400 parlay odds.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section - Expanded */}
            <section className="border-t border-white/10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                        Parlay Calculator FAQ
                    </h2>

                    <div className="space-y-4">
                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                What is a parlay bet?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                A parlay (also called an accumulator or multi) is a single bet that combines multiple selections into one wager. All selections must win for the parlay to pay out. The parlay calculator multiplies the odds together, creating higher potential payouts but with lower probability of winning. For example, a 3-leg NFL parlay with each leg at -110 pays approximately +597.
                            </div>
                        </details>

                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                How does the parlay calculator work?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                The parlay calculator converts all odds to decimal format, then multiplies them together to get the total parlay odds. For American odds: +200 becomes 3.0 in decimal, -150 becomes 1.67. The calculator then multiplies your stake by the combined decimal odds to show your potential payout. Sportsbooks automatically calculate this too, but a parlay calculator lets you check the math yourself.
                            </div>
                        </details>

                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                How are parlay odds calculated?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                Parlay odds are calculated by multiplying the decimal odds of each leg. Example: Leg 1 (-110 = 1.91) × Leg 2 (+100 = 2.00) × Leg 3 (-105 = 1.95) = 7.45 total decimal odds, or approximately +645 in American odds. A $100 stake would return $745 total. The parlay calculator handles this conversion automatically.
                            </div>
                        </details>

                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                Are a parlay calculator and odds payout calculator the same thing?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                No. A parlay calculator is designed to figure out the total payout for multi-leg bets, combining the odds of each leg to show your potential return. An odds payout calculator is typically used for single bets, calculating how much you&apos;d win based on the odds and your stake. A parlay calculator handles the compounding nature of parlays, while an odds calculator does not.
                            </div>
                        </details>

                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                Are parlays a good betting strategy?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                Parlays offer higher payouts but have lower expected value than straight bets. The more legs you add, the more the house edge compounds. Most professional bettors avoid large parlays (5+ legs), but 2-3 leg correlated parlays can occasionally offer value. Use the parlay calculator to see exactly how much the odds compound.
                            </div>
                        </details>

                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                What happens if one leg of my parlay pushes?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                If a leg pushes (ties), that leg is typically removed from the parlay and the odds are recalculated with the remaining legs. A 4-leg parlay becomes a 3-leg parlay. Some sportsbooks have different rules—DraftKings and FanDuel typically remove the leg, while some books may grade the entire parlay as a push. Always check your book&apos;s terms.
                            </div>
                        </details>

                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                What is a same game parlay (SGP)?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                A same game parlay (SGP) combines multiple bets from the same event—like an NFL moneyline, over/under, and player props all in one parlay. Most sportsbooks offer SGPs with adjusted odds since the outcomes are correlated. You can use this parlay calculator for SGPs by entering the odds shown for each leg on your sportsbook.
                            </div>
                        </details>

                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                How many legs can I add to a parlay?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                Most sportsbooks allow parlays with 2-15 legs. This parlay calculator supports up to 15 legs. Keep in mind that while 10+ leg parlays have huge payouts, they&apos;re extremely difficult to hit. A 10-leg parlay at -110 each has only about a 0.09% chance of winning (roughly 1 in 1,100).
                            </div>
                        </details>
                    </div>
                </div>
            </section>
        </main>
    );
}
