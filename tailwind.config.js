/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.75rem, 6.2vw, 6rem)', { lineHeight: '0.96', letterSpacing: '-0.03em' }],
        'display-l': ['clamp(2.25rem, 4.4vw, 4rem)', { lineHeight: '1.0', letterSpacing: '-0.025em' }],
        'title-m': ['clamp(1.5rem, 2.1vw, 2.125rem)', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
        'body-l': ['clamp(1.0625rem, 1.15vw, 1.25rem)', { lineHeight: '1.55' }],
        'body-m': ['1rem', { lineHeight: '1.6' }],
        'body-s': ['0.9375rem', { lineHeight: '1.55' }],
        'mono-label': ['0.75rem', { letterSpacing: '0.12em' }],
        'mono-data': ['0.8125rem', { letterSpacing: '0.02em' }],
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        inout: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
    },
  },
  plugins: [],
}
