/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          50: 'rgb(var(--theme-amber-50, 255 251 235) / <alpha-value>)',
          100: 'rgb(var(--theme-amber-100, 254 243 199) / <alpha-value>)',
          200: 'rgb(var(--theme-amber-200, 253 230 138) / <alpha-value>)',
          300: 'rgb(var(--theme-amber-300, 252 211 77) / <alpha-value>)',
          400: 'rgb(var(--theme-amber-400, 251 191 36) / <alpha-value>)',
          500: 'rgb(var(--theme-amber-500, 245 158 11) / <alpha-value>)',
          600: 'rgb(var(--theme-amber-600, 217 119 6) / <alpha-value>)',
          700: 'rgb(var(--theme-amber-700, 180 83 9) / <alpha-value>)',
          800: 'rgb(var(--theme-amber-800, 146 64 14) / <alpha-value>)',
          900: 'rgb(var(--theme-amber-900, 120 53 15) / <alpha-value>)',
          950: 'rgb(var(--theme-amber-950, 69 26 3) / <alpha-value>)',
        },
        spark: {
          50: '#fbf8f3',
          100: '#f5efe4',
          200: '#ebdeca',
          300: '#dec7a8',
          400: '#cca980',
          500: '#ba8e5e',
          600: '#a3744c',
          700: '#83593e',
          800: '#6c4937',
          900: '#583c2f',
          950: '#301f18',
        }
      }
    },
  },
  plugins: [],
}
