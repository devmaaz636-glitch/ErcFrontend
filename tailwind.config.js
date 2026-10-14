/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        splash: '#BF824F',
        card: '#F7F3EE',
        ink: '#1A1614',
        muted: '#8D8680',
        field: '#F3EFEA',
        peach: '#E4A56B',
      },
    },
  },
  plugins: [],
};