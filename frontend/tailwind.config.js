/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B1020",
        surface: "#111827",
        card: "#151D31",
        primary: "#6C63FF",
        accent: "#00D4FF",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        text: "#F8FAFC",
        muted: "#94A3B8",
        border: "#26324A",
      },
      typography: {
        DEFAULT: {
          css: {
            color: "#F8FAFC",
          },
        },
      },
    },
  },
  plugins: [],
}
