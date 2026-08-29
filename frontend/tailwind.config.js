/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff5f5',
          100: '#ffe3e3',
          200: '#ffc9c9',
          300: '#ffa2a2',
          400: '#f86b6b',
          500: '#e53625',
          600: '#d92509', // Warna Utama Merah #d92509
          700: '#b41a03',
          800: '#951808',
          900: '#7b1a0e',
          950: '#430904'
        },
        gold: {
          50: '#fffde7',
          100: '#fff9c2',
          200: '#fff385',
          300: '#ffe647',
          400: '#efc419', // Warna Kombinasi Gold #efc419
          500: '#d9ac0c',
          600: '#b38606',
          700: '#8f6308',
          800: '#764e0e',
          900: '#644012',
          950: '#3a2205'
        }
      }
    }
  },
  plugins: []
};
