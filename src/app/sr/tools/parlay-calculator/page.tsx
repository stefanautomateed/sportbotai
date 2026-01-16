'use client';

import { useState, useCallback } from 'react';

/**
 * Parlay Kalkulator - Serbian Version
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

function decimalToAmerican(decimal: number): string {
    if (decimal >= 2) {
        return `+${Math.round((decimal - 1) * 100)}`;
    } else {
        return `${Math.round(-100 / (decimal - 1))}`;
    }
}

export default function ParlayCalculatorPageSr() {
    const [stake, setStake] = useState('100');
    const [oddsFormat, setOddsFormat] = useState<'american' | 'decimal'>('decimal');
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
            setError('Unesite ispravan iznos uloga');
            return;
        }

        const decimalOdds: number[] = [];
        for (let i = 0; i < legs.length; i++) {
            if (!legs[i].odds.trim()) {
                setError(`Unesite kvote za Leg ${i + 1}`);
                return;
            }
            const decimal = toDecimal(legs[i].odds, oddsFormat);
            if (!decimal) {
                setError(`Neispravne kvote za Leg ${i + 1}`);
                return;
            }
            decimalOdds.push(decimal);
        }

        const totalDecimal = decimalOdds.reduce((acc, odds) => acc * odds, 1);
        const impliedProb = (1 / totalDecimal) * 100;
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
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
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
                                <path d="M3 3v18h18" />
                                <path d="M7 16l4-4 4 4 5-6" />
                            </svg>
                            Besplatan Alat
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
                            Parlay
                            <span className="block text-gradient-accent">Kalkulator</span>
                        </h1>

                        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
                            Izračunajte potencijalne isplate za višestruke kombinovane opklade.
                            Dodajte do 15 legova i pogledajte ukupne kvote trenutno.
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
                                            setLegs(legs.map(leg => ({ ...leg, odds: '' })));
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

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Ulog (€)
                            </label>
                            <input
                                type="number"
                                value={stake}
                                onChange={(e) => { setStake(e.target.value); setResult(null); }}
                                placeholder="100"
                                className="input-field text-lg"
                            />
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-400">
                                    Parlay Legovi ({legs.length})
                                </label>
                                <button
                                    onClick={addLeg}
                                    disabled={legs.length >= 15}
                                    className="text-sm text-accent hover:text-accent-light disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                                >
                                    + Dodaj Leg
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
                            Izračunaj Parlay
                        </button>

                        {error && (
                            <p className="mt-4 text-sm text-danger text-center">{error}</p>
                        )}

                        {result && (
                            <div className="animate-fadeInUp mt-6">
                                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

                                <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
                                    Rezultati Parlay-a
                                </h3>

                                <div className="bg-accent/10 rounded-xl p-5 border border-accent/30 mb-4">
                                    <div className="text-xs text-accent uppercase tracking-wider mb-1">Potencijalna Isplata</div>
                                    <div className="text-3xl font-bold text-accent">€{result.potentialPayout}</div>
                                    <div className="text-sm text-accent/70 mt-1">Profit: €{result.potentialProfit}</div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Američke</div>
                                        <div className="text-lg font-bold text-white">{result.totalAmericanOdds}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Decimalne</div>
                                        <div className="text-lg font-bold text-white">{result.totalDecimalOdds}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Verovatnoća</div>
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
                        Kako Koristiti Parlay Kalkulator
                    </h2>
                    <p className="text-gray-400 mb-6">
                        Parlay kalkulator vam omogućava da brzo izračunate isplatu vaše kombinovane opklade unosom kvota za svaki leg.
                        Bilo da se kladite na NFL, NBA, fudbal ili bilo koji drugi sport, ovaj besplatni parlay kalkulator pokazuje vaše ukupne kvote i potencijalnu zaradu.
                    </p>

                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold mb-3">1</div>
                            <h3 className="text-white font-semibold mb-2">Unesite Ulog</h3>
                            <p className="text-gray-400 text-sm">Unesite iznos koji želite da uložite na vašu parlay opkladu.</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold mb-3">2</div>
                            <h3 className="text-white font-semibold mb-2">Dodajte Parlay Legove</h3>
                            <p className="text-gray-400 text-sm">Unesite kvote za svaki leg. Dodajte do 15 legova u vaš parlay.</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold mb-3">3</div>
                            <h3 className="text-white font-semibold mb-2">Pogledajte Isplatu</h3>
                            <p className="text-gray-400 text-sm">Parlay kalkulator trenutno prikazuje vaše ukupne kvote i potencijalnu isplatu.</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
