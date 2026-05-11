/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  safelist: [
    'bg-emcure-blue', 'bg-emcure-red', 'bg-emcure-light',
    'text-emcure-blue', 'text-emcure-red',
    'border-emcure-blue', 'hover:bg-emcure-blue',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        emcure: {
          blue:  '#003087',
          red:   '#c8102e',
          light: '#e8eef8',
        }
      }
    },
  },
  plugins: [],
}
