// content array tells tailwind which pages to apply yhe css properties too

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          400: '#ff7f6e',
          500: '#ff6b55',
          600: '#ff5741',
        }
      }
    },
  },
  plugins: [],
}