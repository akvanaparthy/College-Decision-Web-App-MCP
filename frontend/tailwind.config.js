/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 60-30-10 palette with explicit roles. Warm parchment dominates,
        // forest as the trust accent, ochre as the call-to-action accent.
        parchment: {
          DEFAULT: '#F5F1E8', // 60% — page background
          deep: '#EFE9DA',
          tint: '#FAF7EE', // 30% — surfaces (cards, panels)
        },
        ink: {
          DEFAULT: '#1A1814', // 100% body text
          70: 'rgba(26, 24, 20, 0.72)', // secondary text
          50: 'rgba(26, 24, 20, 0.52)', // tertiary / labels
          30: 'rgba(26, 24, 20, 0.30)', // hairlines
          10: 'rgba(26, 24, 20, 0.10)', // soft dividers
        },
        forest: {
          DEFAULT: '#2C4A3E', // primary accent — links, focused states
          dark: '#1F3329',
          tint: 'rgba(44, 74, 62, 0.10)',
        },
        ochre: {
          DEFAULT: '#B5731A', // 10% accent — CTAs, badges
          dark: '#8B5713',
          tint: 'rgba(181, 115, 26, 0.12)',
        },
        success: '#2E7D5C',
        warn: '#B5731A',
        error: '#A63D2A',
      },
      fontFamily: {
        // Display (headlines, school names, hero numerals): condensed serif
        // Body (default): geometric sans
        // Mono (data labels, ids, small caps tags): variable mono
        display: [
          'Instrument Serif',
          'Iowan Old Style',
          'Apple Garamond',
          'Georgia',
          'serif',
        ],
        sans: [
          'Geist',
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: [
          'Geist Mono',
          'JetBrains Mono',
          'SF Mono',
          'ui-monospace',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      fontSize: {
        // Major Third type scale (1.25×) starting at 16px body.
        // Step naming aligns with semantic role rather than literal size.
        micro: ['0.75rem', { lineHeight: '1.45' }], // 12px
        small: ['0.8125rem', { lineHeight: '1.5' }], // 13px
        body: ['1rem', { lineHeight: '1.55' }], // 16px
        subhead: ['1.25rem', { lineHeight: '1.4' }], // 20px
        head: ['1.5625rem', { lineHeight: '1.25' }], // 25px
        title: ['1.953rem', { lineHeight: '1.15' }], // 31px
        display: ['2.441rem', { lineHeight: '1.05', letterSpacing: '-0.01em' }], // 39px
        hero: ['3.052rem', { lineHeight: '1.0', letterSpacing: '-0.015em' }], // 49px
      },
      letterSpacing: {
        tightest: '-0.02em',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(26, 24, 20, 0.04), 0 8px 28px -16px rgba(26, 24, 20, 0.10)',
        soft: '0 1px 0 rgba(26, 24, 20, 0.04)',
      },
      animation: {
        'fade-up': 'fadeUp 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
