/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neonBlue: '#3C8DAB', // Minecraft Diamond
        neonRed: '#ff3333', // Minecraft Redstone
        mcGreen: '#5b8731', // Grass Green
        mcDirt: '#79553a', // Dirt Brown
        mcStone: '#7d7d7d', // Stone Gray
        mcGold: '#f0c330', // Gold Ingot
        mcObsidian: '#14101e',
        darkBg: '#0a0a0a',
        panel: '#c6c6c6' // Light gray GUI
      },
      fontFamily: {
        mono: ['VT323', 'monospace'],
        sans: ['VT323', 'monospace']
      }
    },
  },
  plugins: [],
}
