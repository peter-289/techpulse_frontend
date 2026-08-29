/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        brand: 'hsl(var(--brand))',
        primary: {
          DEFAULT: '#2563eb',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#64748b',
          foreground: '#475569',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'SF Pro Text', 'Segoe UI', 'sans-serif'],
        mono: ['Cascadia Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

