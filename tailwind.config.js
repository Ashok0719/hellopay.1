/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          primary: '#8b5cf6',
          secondary: '#3b82f6',
          dark: '#0f172a',
        }
      },
    },
  },
  plugins: [],
}
/*  */