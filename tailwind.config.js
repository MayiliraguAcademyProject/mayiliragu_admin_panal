/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ea580c',
          container: '#2c1404',
        },
        secondary: {
          DEFAULT: '#fff7ed',
          container: '#ffedd5',
        },
        accent: {
          DEFAULT: '#f97316',
          dark: '#431407',
          onContainer: '#c2410c',
        },
        error: '#BA1A1A',
        background: {
          start: '#fffdfb',
          end: '#fff3e5',
        },
        text: {
          primary: '#26160c',
          secondary: '#605247',
        },
        border: '#eaddd0',
        cardBg: '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
