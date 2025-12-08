/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Deep Navy (Sports/Tech feel)
        primary: {
          50: '#eef4ff',
          100: '#d9e5ff',
          200: '#bcd0ff',
          300: '#8eb3ff',
          400: '#5988ff',
          500: '#3361ff',
          600: '#1a3ff5',
          700: '#142de1',
          800: '#1726b6',
          900: '#0f172a', // Main dark navy
          950: '#080c1a',
        },
        // Accent: Lime/Cyan for CTAs and highlights
        accent: {
          lime: '#84cc16',
          cyan: '#06b6d4',
          green: '#22c55e',
          gold: '#eab308',
          red: '#ef4444',
        },
        // Surface colors for dark sections
        surface: {
          dark: '#0f172a',
          darker: '#080c1a',
          card: '#1e293b',
          border: '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      },
      boxShadow: {
        'glow-lime': '0 0 20px rgba(132, 204, 22, 0.3)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
      },
    },
  },
  plugins: [],
};
