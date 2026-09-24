/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4ee',
          100: '#fbe6d5',
          200: '#f5c9a8',
          300: '#eda571',
          400: '#e37f45',
          500: '#d15f27',
          600: '#b1481d',
          700: '#8f381a',
          800: '#742f1b',
          900: '#602919',
          950: '#341409',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 10px -2px rgba(52, 20, 9, 0.08), 0 1px 2px -1px rgba(52, 20, 9, 0.06)',
        card: '0 4px 20px -4px rgba(52, 20, 9, 0.10), 0 2px 6px -2px rgba(52, 20, 9, 0.06)',
        lifted: '0 12px 32px -8px rgba(52, 20, 9, 0.18)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.35s ease-out both',
        slideUp: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
