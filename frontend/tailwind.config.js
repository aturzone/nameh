/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        nameh: {
          bg: '#FFFFFF',
          surface: '#F8FAFC',
          border: '#E2E8F0',
          primary: '#0F172A',
          secondary: '#64748B',
          accent: '#1E3A8A',
          'accent-hover': '#1E40AF',
          danger: '#EF4444',
          unread: '#2563EB',
          hover: '#F1F5F9',
        }
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body: ['IBM Plex Sans', 'Vazirmatn', 'Tahoma', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
