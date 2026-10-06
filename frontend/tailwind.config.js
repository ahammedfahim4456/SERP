/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sandal: {
          50: '#FDFBF7',
          100: '#FAF5EE',
          200: '#F5EBE0',
          300: '#EBDCCE',
          400: '#DCC3AB',
          500: '#C7A789',
          600: '#A98767',
          700: '#8A6748',
          800: '#6E4E34',
          900: '#4E3522',
        },
        crimson: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#450A0A',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'sandal-soft': '0 8px 30px rgba(138, 103, 72, 0.08)',
        'sandal-card': '0 4px 20px -2px rgba(110, 78, 52, 0.06), 0 2px 6px -1px rgba(110, 78, 52, 0.04)',
        'crimson-glow': '0 0 25px -3px rgba(220, 38, 38, 0.35)',
        'emerald-glow': '0 0 25px -3px rgba(16, 185, 129, 0.35)',
      },
    },
  },
  plugins: [],
}
