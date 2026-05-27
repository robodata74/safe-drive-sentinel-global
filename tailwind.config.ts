import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#e8ecf5',
          100: '#c5ceea',
          200: '#9eaddb',
          300: '#748ccb',
          400: '#5571be',
          500: '#3556b1',
          600: '#2a45a0',
          700: '#1c318a',
          800: '#111f6e',
          900: '#0a0f1e',
          950: '#060a14',
        },
        brand: {
          DEFAULT: '#1e6bff',
          50:  '#eff4ff',
          100: '#dce8ff',
          200: '#c0d5ff',
          300: '#94b8ff',
          400: '#6090ff',
          500: '#1e6bff',
          600: '#1755eb',
          700: '#1542d4',
          800: '#1636ab',
          900: '#163186',
        },
        surface: {
          DEFAULT: 'rgba(255,255,255,0.04)',
          hover:   'rgba(255,255,255,0.08)',
          active:  'rgba(255,255,255,0.12)',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%':       { transform: 'scale(1.5)', opacity: '0.4' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'pulse':   'pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
