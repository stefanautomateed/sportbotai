'use client';

import { useState, useCallback } from 'react';

/**
 * Hedge Kalkulator - Serbian Version
 */

interface HedgeResult {
    hedgeBet: string;
    originalProfit: string;
    hedgeProfit: string;
    guaranteedProfit: string;
    profitIfOriginalWins: string;
    profitIfHedgeWins: string;
}

function toDecimal(odds: string, format: 'american' | 'decimal'): number | null {
    const num = parseFloat(odds);
    if (isNaN(num)) return null;

    if (format === 'decimal') {
        return num >= 1 ? num : null;
    } else {
        if (num > 0) {
            return (num / 100) + 1;
        } else if (num < -99) {
            return (100 / Math.abs(num)) + 1;
        }
        return null;
    }
}

export default function HedgeCalculatorPageSr() {
    const [originalStake, setOriginalStake] = useState('');
    const [originalOdds, setOriginalOdds] = useState('');
    const [hedgeOdds, setHedgeOdds] = useState('');
    const [oddsFormat, setOddsFormat] = useState<'american' | 'decimal'>('decimal');
    const [result, setResult] = useState<HedgeResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const calculateHedge = useCallback(() => {
        setError(null);
        setResult(null);

        const stake = parseFloat(originalStake);
        if (isNaN(stake) || stake <= 0) {
            setError('Unesite ispravan iznos uloga');
            return;
        }

        const origDecimal = toDecimal(originalOdds, oddsFormat);
        const hedgeDecimal = toDecimal(hedgeOdds, oddsFormat);

        if (!origDecimal) {
            setError('Unesite ispravne originalne kvote');
            return;
        }

        if (!hedgeDecimal) {
            setError('Unesite ispravne hedge kvote');
            return;
        }

        const totalPayout = stake * origDecimal;
        const hedgeBet = totalPayout / hedgeDecimal;
        const profitIfOriginalWins = totalPayout - stake - hedgeBet;
        const profitIfHedgeWins = (hedgeBet * hedgeDecimal) - stake - hedgeBet;
        const guaranteedProfit = Math.min(profitIfOriginalWins, profitIfHedgeWins);

        setResult({
            hedgeBet: hedgeBet.toFixed(2),
            originalProfit: (totalPayout - stake).toFixed(2),
            hedgeProfit: ((hedgeBet * hedgeDecimal) - hedgeBet).toFixed(2),
            guaranteedProfit: guaranteedProfit.toFixed(2),
            profitIfOriginalWins: profitIfOriginalWins.toFixed(2),
            profitIfHedgeWins: profitIfHedgeWins.toFixed(2),
        });
    }, [originalStake, originalOdds, hedgeOdds, oddsFormat]);

    return (
        <main className="min-h-screen bg-bg-primary">
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-violet/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px]" />
                </div>

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
                    <a
                        href="/sr/tools"
                        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Svi Alati
                    </a>

                    <div className="text-center mb-10 sm:mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full text-xs sm:text-sm font-medium text-gray-300 border border-white/10 mb-6">
                            <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="M9 12l2 2 4-4" />
                            </svg>
                            Besplatan Alat
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
                            Hedge
                            <span className="block text-gradient-accent">Kalkulator</span>
                        </h1>

                        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
                            Izračunajte optimalan hedge da biste zaključali garantovan profit
                            ili minimizirali potencijalne gubitke na vašim opkladama.
                        </p>
                    </div>

                    {/* Calculator Card */}
                    <div className="card-glass p-6 sm:p-8 max-w-xl mx-auto">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-3">
                                Format Kvota
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['american', 'decimal'] as const).map((format) => (
                                    <button
                                        key={format}
                                        onClick={() => {
                                            setOddsFormat(format);
                                            setOriginalOdds('');
                                            setHedgeOdds('');
                                            setResult(null);
                                            setError(null);
                                        }}
                                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${oddsFormat === format
                                            ? 'bg-accent text-primary-900 shadow-glow-accent'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                                            }`}
                                    >
                                        {format === 'american' ? 'Američke' : 'Decimalne'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Originalni Ulog (€)
                                </label>
                                <input
                                    type="number"
                                    value={originalStake}
                                    onChange={(e) => setOriginalStake(e.target.value)}
                                    placeholder="npr. 100"
                                    className="input-field text-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Originalne Kvote ({oddsFormat === 'american' ? 'npr. +200' : 'npr. 3.00'})
                                </label>
                                <input
                                    type="text"
                                    value={originalOdds}
                                    onChange={(e) => setOriginalOdds(e.target.value)}
                                    placeholder={oddsFormat === 'american' ? '+200 ili -150' : '3.00'}
                                    className="input-field text-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Hedge Kvote ({oddsFormat === 'american' ? 'npr. -110' : 'npr. 1.91'})
                                </label>
                                <input
                                    type="text"
                                    value={hedgeOdds}
                                    onChange={(e) => setHedgeOdds(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && calculateHedge()}
                                    placeholder={oddsFormat === 'american' ? '-110' : '1.91'}
                                    className="input-field text-lg"
                                />
                            </div>
                        </div>

                        <button
                            onClick={calculateHedge}
                            className="btn-primary w-full py-4 text-lg"
                        >
                            Izračunaj Hedge
                        </button>

                        {error && (
                            <p className="mt-4 text-sm text-danger text-center">{error}</p>
                        )}

                        {result && (
                            <div className="animate-fadeInUp mt-6">
                                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

                                <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
                                    Rezultati Hedge-a
                                </h3>

                                <div className="bg-accent/10 rounded-xl p-5 border border-accent/30 mb-4">
                                    <div className="text-xs text-accent uppercase tracking-wider mb-1">Uložite Ovaj Iznos za Hedge</div>
                                    <div className="text-3xl font-bold text-accent">€{result.hedgeBet}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ako Original Pobedi</div>
                                        <div className={`text-xl font-bold ${parseFloat(result.profitIfOriginalWins) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            €{result.profitIfOriginalWins}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ako Hedge Pobedi</div>
                                        <div className={`text-xl font-bold ${parseFloat(result.profitIfHedgeWins) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            €{result.profitIfHedgeWins}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Garantovani Minimum</div>
                                    <div className={`text-lg font-semibold ${parseFloat(result.guaranteedProfit) >= 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                                        €{result.guaranteedProfit} {parseFloat(result.guaranteedProfit) >= 0 ? 'profit' : 'gubitak'} u svakom slučaju
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
                        Kako Koristiti Hedge Kalkulator
                    </h2>
                    <p className="text-gray-400 mb-6">
                        Hedge kalkulator vam pomaže da zaključate garantovan profit ili minimizirate gubitak na postojećoj opkladi.
                        Bilo da imate futures opkladu, parlay ili jednostavnu opkladu u povoljnoj poziciji, ovaj besplatni hedge kalkulator pokazuje tačno koliko da uložite.
                    </p>

                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className="w-8 h-8 rounded-full bg-violet/10 flex items-center justify-center text-violet font-bold mb-3">1</div>
                            <h3 className="text-white font-semibold mb-2">Unesite Originalnu Opkladu</h3>
                            <p className="text-gray-400 text-sm">Unesite vaš originalni ulog i kvote na koje ste se kladili.</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className="w-8 h-8 rounded-full bg-violet/10 flex items-center justify-center text-violet font-bold mb-3">2</div>
                            <h3 className="text-white font-semibold mb-2">Unesite Hedge Kvote</h3>
                            <p className="text-gray-400 text-sm">Unesite trenutne kvote za suprotan ishod.</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className="w-8 h-8 rounded-full bg-violet/10 flex items-center justify-center text-violet font-bold mb-3">3</div>
                            <h3 className="text-white font-semibold mb-2">Pogledajte Hedge Iznos</h3>
                            <p className="text-gray-400 text-sm">Hedge kalkulator pokazuje tačno koliko da uložite za garantovan profit.</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
