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
          DEFAULT: '#0C2C55',
          dark: '#0A243F',
          light: '#1A3D66',
        },
        secondary: {
          DEFAULT: '#296374',
          dark: '#1F4A57',
          light: '#3A7A8A',
        },
        tertiary: {
          DEFAULT: '#629FAD',
          dark: '#4D7F8C',
          light: '#7AB5C4',
        },
        light: {
          DEFAULT: '#EDEDCE',
          dark: '#D9D9B8',
          light: '#F5F5E0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
