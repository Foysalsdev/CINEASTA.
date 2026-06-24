import type { Config } from 'tailwindcss'

// Brand palette derived from the CINEASTA logo (deep agency green).
export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eaf4ee',
          100: '#cce4d5',
          200: '#a3cfb4',
          300: '#71b48d',
          400: '#3f9866',
          500: '#1f7d49',
          600: '#176a3a', // primary — matches logo
          700: '#13552f',
          800: '#0f4326',
          900: '#0b321d',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
}
