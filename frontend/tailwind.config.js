/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sancta: {
          maroon: '#6b2d3c',
          'maroon-dark': '#5a2634',
          gold: '#b8860b',
          beige: '#f5f0e8',
          'beige-pattern': '#ebe5db',
        },
      },
    },
  },
  plugins: [],
};
