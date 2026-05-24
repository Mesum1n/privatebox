/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#0a0a0a',  // deepest bg
          1: '#111111',  // card bg
          2: '#1a1a1a',  // elevated
          3: '#242424',  // inputs / borders
          4: '#2e2e2e',  // hover states
        },
        border: {
          subtle: '#1f1f1f',
          default: '#2a2a2a',
          strong: '#3a3a3a',
        },
        text: {
          primary: '#f0f0f0',
          secondary: '#8a8a8a',
          muted: '#555555',
        },
        accent: {
          DEFAULT: '#4ade80',   // green – "safe / local"
          muted: '#16a34a22',
          hover: '#22c55e',
        },
        danger: '#f87171',
        warn: '#fbbf24',
      },
      fontFamily: {
        // Clean, utilitarian – not the usual Inter
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        tool: '10px',
        card: '14px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-border': {
          '0%, 100%': { borderColor: 'rgb(74 222 128 / 0.3)' },
          '50%': { borderColor: 'rgb(74 222 128 / 0.8)' },
        }
      },
      animation: {
        'fade-up': 'fade-up 0.25s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-border': 'pulse-border 2s ease-in-out infinite',
      }
    }
  },
  plugins: []
}
