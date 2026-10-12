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
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        gold: {
          light: '#fef08a',
          DEFAULT: '#eab308',
          dark: '#ca8a04',
        },
        silver: {
          light: '#f1f5f9',
          DEFAULT: '#94a3b8',
          dark: '#64748b',
        },
        bronze: {
          light: '#fed7aa',
          DEFAULT: '#d97706',
          dark: '#b45309',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-green': 'flashGreen 1.5s ease-out',
        'flash-red': 'flashRed 1.5s ease-out',
      },
      keyframes: {
        flashGreen: {
          '0%': { backgroundColor: 'rgba(16, 185, 129, 0.25)', transform: 'scale(1.01)' },
          '100%': { backgroundColor: 'transparent', transform: 'scale(1)' },
        },
        flashRed: {
          '0%': { backgroundColor: 'rgba(239, 68, 68, 0.25)' },
          '100%': { backgroundColor: 'transparent' },
        }
      }
    },
  },
  plugins: [],
}
