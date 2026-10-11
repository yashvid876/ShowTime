/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FBF1F4", 100: "#F6DDE5", 200: "#EDB9CA", 300: "#DE8AA6", 400: "#C85A81",
          500: "#A83560", 600: "#8A2549", 700: "#731E3D", 800: "#5C1831", 900: "#43111F",
        },
        gold: { 100: "#FCEFD0", 300: "#F4CF7A", 400: "#EDB84A", 500: "#E3A12B", 600: "#B07612" },
        ink: {
          50: "#F6F7F9", 100: "#ECEEF3", 200: "#D9DCE5", 300: "#B5B9C7", 400: "#878CA0",
          500: "#5C6272", 600: "#454A5A", 700: "#353A48", 800: "#262A36", 900: "#1A1D26",
        },
        ok: { 50: "#E8F6EF", 600: "#1E8E5A", 700: "#17724A" },
        danger: { 50: "#FCEDED", 600: "#C73636", 700: "#A32828" },
        warn: { 50: "#FFF5E0", 600: "#A8650A" },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Figtree", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,29,38,.06), 0 4px 16px -8px rgba(26,29,38,.12)",
        pop: "0 12px 40px -12px rgba(26,29,38,.35)",
      },
    },
  },
  plugins: [],
};
