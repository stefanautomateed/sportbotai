'use client';

import { useState, useCallback } from 'react';

/**
 * Konvertor Kvota - Serbian Version
 */

type OddsFormat = 'american' | 'decimal' | 'fractional';

interface ConvertedOdds {
    american: string;
    decimal: string;
    fractional: string;
    impliedProbability: string;
}

// Convert American odds to probability
function americanToProb(american: number): number {
    if (american > 0) {
        return 100 / (american + 100);
    } else {
        return Math.abs(american) / (Math.abs(american) + 100);
    }
}

// Convert probability to American
function probToAmerican(prob: number): number {
    if (prob >= 0.5) {
        return -Math.round((prob / (1 - prob)) * 100);
    } else {
        return Math.round(((1 - prob) / prob) * 100);
    }
}

// Convert probability to Decimal
function probToDecimal(prob: number): number {
    return 1 / prob;
}

// Convert decimal to probability
function decimalToProb(decimal: number): number {
    return 1 / decimal;
}

// Convert probability to fractional string
function probToFractional(prob: number): string {
    const decimal = 1 / prob;
    const numerator = decimal - 1;

    const commonDenoms = [1, 2, 4, 5, 8, 10, 20, 25, 50, 100];

    for (const denom of commonDenoms) {
        const num = numerator * denom;
        if (Math.abs(num - Math.round(num)) < 0.01) {
            return `${Math.round(num)}/${denom}`;
        }
    }

    return `${Math.round(numerator * 100)}/100`;
}

// Parse fractional string to probability
function fractionalToProb(fractional: string): number | null {
    const parts = fractional.split('/');
    if (parts.length !== 2) return null;

    const num = parseFloat(parts[0]);
    const denom = parseFloat(parts[1]);

    if (isNaN(num) || isNaN(denom) || denom === 0) return null;

    const decimal = (num / denom) + 1;
    return 1 / decimal;
}

export default function OddsConverterPageSr() {
    const [inputValue, setInputValue] = useState('');
    const [inputFormat, setInputFormat] = useState<OddsFormat>('decimal');
    const [result, setResult] = useState<ConvertedOdds | null>(null);
    const [error, setError] = useState<string | null>(null);

    const convertOdds = useCallback(() => {
        setError(null);
        setResult(null);

        if (!inputValue.trim()) {
            setError('Unesite vrednost kvote');
            return;
        }

        let probability: number | null = null;

        try {
            if (inputFormat === 'american') {
                const american = parseFloat(inputValue);
                if (isNaN(american) || american === 0 || (american > -100 && american < 100)) {
                    setError('Američke kvote moraju biti +100 ili više, ili -100 ili manje');
                    return;
                }
                probability = americanToProb(american);
            } else if (inputFormat === 'decimal') {
                const decimal = parseFloat(inputValue);
                if (isNaN(decimal) || decimal < 1) {
                    setError('Decimalne kvote moraju biti 1.00 ili više');
                    return;
                }
                probability = decimalToProb(decimal);
            } else if (inputFormat === 'fractional') {
                probability = fractionalToProb(inputValue);
                if (probability === null) {
                    setError('Unesite razlomačke kvote kao "3/1" ili "1/2"');
                    return;
                }
            }

            if (probability && probability > 0 && probability < 1) {
                const american = probToAmerican(probability);
                const decimal = probToDecimal(probability);
                const fractional = probToFractional(probability);
                const impliedPct = (probability * 100).toFixed(1);

                setResult({
                    american: american > 0 ? `+${american}` : `${american}`,
                    decimal: decimal.toFixed(2),
                    fractional,
                    impliedProbability: `${impliedPct}%`,
                });
            }
        } catch {
            setError('Neispravan format kvote');
        }
    }, [inputValue, inputFormat]);

    const formatOptions: { value: OddsFormat; label: string; placeholder: string }[] = [
        { value: 'american', label: 'Američke', placeholder: 'npr. -110 ili +150' },
        { value: 'decimal', label: 'Decimalne', placeholder: 'npr. 1.91 ili 2.50' },
        { value: 'fractional', label: 'Razlomačke', placeholder: 'npr. 3/1 ili 1/2' },
    ];

    const selectedFormat = formatOptions.find(f => f.value === inputFormat);

    return (
        <main className="min-h-screen bg-bg-primary">
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-violet/10 rounded-full blur-[80px]" />
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
                                <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
                            </svg>
                            Besplatan Alat
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
                            Konvertor Kvota
                            <span className="block text-gradient-accent">Kalkulator</span>
                        </h1>

                        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
                            Konvertujte između američkih, decimalnih i razlomačkih kvota trenutno.
                            Pogledajte impliciranu verovatnoću za bilo koju liniju klađenja.
                        </p>
                    </div>

                    {/* Converter Card */}
                    <div className="card-glass p-6 sm:p-8 max-w-xl mx-auto">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-3">
                                Ulazni Format
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {formatOptions.map((format) => (
                                    <button
                                        key={format.value}
                                        onClick={() => {
                                            setInputFormat(format.value);
                                            setInputValue('');
                                            setResult(null);
                                            setError(null);
                                        }}
                                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${inputFormat === format.value
                                            ? 'bg-accent text-primary-900 shadow-glow-accent'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                                            }`}
                                    >
                                        {format.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Unesite {selectedFormat?.label} Kvote
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && convertOdds()}
                                    placeholder={selectedFormat?.placeholder}
                                    className="input-field flex-1 text-lg"
                                />
                                <button
                                    onClick={convertOdds}
                                    className="btn-primary px-6 whitespace-nowrap"
                                >
                                    Konvertuj
                                </button>
                            </div>
                            {error && (
                                <p className="mt-2 text-sm text-danger">{error}</p>
                            )}
                        </div>

                        {result && (
                            <div className="animate-fadeInUp">
                                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

                                <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
                                    Konvertovane Kvote
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Američke</div>
                                        <div className="text-2xl font-bold text-white">{result.american}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Decimalne</div>
                                        <div className="text-2xl font-bold text-white">{result.decimal}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Razlomačke</div>
                                        <div className="text-2xl font-bold text-white">{result.fractional}</div>
                                    </div>
                                    <div className="bg-accent/10 rounded-xl p-4 border border-accent/30">
                                        <div className="text-xs text-accent uppercase tracking-wider mb-1">Implicirana Verovatnoća</div>
                                        <div className="text-2xl font-bold text-accent">{result.impliedProbability}</div>
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
                        Kako Koristiti Konvertor Kvota
                    </h2>
                    <p className="text-gray-400 mb-6">
                        Konvertor kvota trenutno konvertuje između američkih, decimalnih i razlomačkih formata kvota.
                        Bilo da se kladite na NFL, NBA, fudbal ili bilo koji sport, ovaj besplatni konvertor kvota prikazuje ekvivalentne kvote u svim formatima plus impliciranu verovatnoću.
                    </p>

                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold mb-3">1</div>
                            <h3 className="text-white font-semibold mb-2">Izaberite Format</h3>
                            <p className="text-gray-400 text-sm">Izaberite format kvote koju želite da konvertujete: Američke, Decimalne ili Razlomačke.</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold mb-3">2</div>
                            <h3 className="text-white font-semibold mb-2">Unesite Kvote</h3>
                            <p className="text-gray-400 text-sm">Unesite vrednost kvote. Primeri: -150, +200, 2.50, 5/1</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold mb-3">3</div>
                            <h3 className="text-white font-semibold mb-2">Pogledajte Sve Formate</h3>
                            <p className="text-gray-400 text-sm">Konvertor kvota trenutno prikazuje ekvivalentne kvote u svim formatima plus impliciranu verovatnoću.</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
