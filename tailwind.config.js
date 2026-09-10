/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nfl-navy': '#013369',
        'nfl-red': '#D50A0A',
        'nfl-gold': '#FACC15',
      }
    },
  },
  plugins: [],
}
