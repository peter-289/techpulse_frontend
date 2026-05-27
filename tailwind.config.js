/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        // maps to CSS token --brand (defined in tokens.css)
        brand: 'hsl(var(--brand))',
      },
    },
  },
  plugins: [],
};

