/** @type {import('tailwindcss').Config} */
// Keep in sync with src/theme/colors.js
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        splash: '#BF824F',
        brand: '#BF824F',
        card: '#F7F3EE',
        background: '#FFF8F1',
        ink: '#1A1614',
        muted: '#8D8680',
        field: '#F3EFEA',
        peach: '#E4A56B',
        success: '#00AD28',
        danger: '#E5484D',
      },
    },
  },
  plugins: [],
};
