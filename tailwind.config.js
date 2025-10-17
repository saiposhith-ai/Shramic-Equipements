/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",  // If using src/ folder
    "./app/**/*.{js,ts,jsx,tsx,mdx}",  // App Router
    "./pages/**/*.{js,ts,jsx,tsx,mdx}", // If using Pages Router (unlikely)
    "./components/**/*.{js,ts,jsx,tsx,mdx}",  // Your component folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}