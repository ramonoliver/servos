/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Aurora Suave ─────────────────────────────────────────
        bg: "#FBFAFF",
        surface: { DEFAULT: "#FFFFFF", alt: "#F4F2FB", hover: "#ECEAF6" },
        sidebar: { bg: "#F7F6FC", border: "#ECEAF4" },
        ink: { DEFAULT: "#1B1726", soft: "#423C52", muted: "#736D82", faint: "#A39DAE", ghost: "#CDC9D4" },
        // brand — fresh warm coral (refreshed from terracotta)
        brand: { DEFAULT: "#FF6B57", deep: "#F0492F", light: "#FFF1EE", glow: "#FFF7F5" },
        success: { DEFAULT: "#22B892", light: "#E2FBF3", deep: "#1A8E70" },
        danger: { DEFAULT: "#F2566E", light: "#FFECEF" },
        amber: { DEFAULT: "#E0A21B", light: "#FFF6E2", deep: "#C2871A" },
        info: { DEFAULT: "#2BA8D6", light: "#E8F7FD" },
        border: { DEFAULT: "#E7E5F0", soft: "#F0EEF8" },
        // luminous accents
        lavender: { DEFAULT: "#9B8CFB", light: "#F0ECFF", deep: "#6D5DF0" },
        rose: { DEFAULT: "#FB7199", light: "#FFEDF2", deep: "#E14B82" },
        sky: { DEFAULT: "#38BDF0", light: "#E8F8FE" },
        mint: { DEFAULT: "#2DD4A7", light: "#E2FBF3" },
        sun: { DEFAULT: "#FFC24B", light: "#FFF6E2", deep: "#C2871A" },
      },
      fontFamily: {
        body: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        display: ["'Schibsted Grotesk'", "'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
      borderRadius: { sm: "12px", md: "16px", lg: "22px", xl: "30px" },
      boxShadow: {
        soft: "0 2px 6px rgba(27,23,38,0.04), 0 1px 2px rgba(27,23,38,0.04)",
        lift: "0 8px 24px -10px rgba(60,40,90,0.18), 0 2px 8px rgba(27,23,38,0.04)",
        float: "0 28px 60px -22px rgba(70,45,110,0.28), 0 6px 18px rgba(27,23,38,0.05)",
        coral: "0 14px 30px -10px rgba(255,107,87,0.45)",
      },
    },
  },
  plugins: [],
};
