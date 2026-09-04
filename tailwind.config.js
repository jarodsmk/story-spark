/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
