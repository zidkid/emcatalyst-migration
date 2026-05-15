/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#ed1c24',
          50:  '#fff0f0',
          100: '#ffd6d6',
          200: '#ffadad',
          hover: '#c8141b',
          active: '#a00e14',
        },
        neutral: {
          0:   '#ffffff',
          50:  '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#6c757d',
          800: '#343a40',
          900: '#212529',
        },
        success: '#17c765',
        warning: '#ffa21e',
        error:   '#ef4444',
        info:    '#3b82f6',
        emcure: {
          red:   '#ed1c24',
          blue:  '#003087',
          light: '#fff0f0',
        }
      },
      borderRadius: {
        sm:   '4px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        full: '9999px',
      },
      boxShadow: {
        sm:         '0 2px 6px rgba(0,0,0,.08)',
        md:         '0 4px 12px rgba(0,0,0,.10)',
        lg:         '0 8px 24px rgba(0,0,0,.12)',
        'primary-sm': '0 0 0 3px rgba(237,28,36,.15)',
        'primary-md': '0 4px 16px rgba(237,28,36,.25)',
        dropdown:   '0 10px 24px rgba(62,57,107,.18)',
      },
      spacing: {
        'topbar': '55px',
        'sidenav': '220px',
      },
    },
  },
  plugins: [],
}
