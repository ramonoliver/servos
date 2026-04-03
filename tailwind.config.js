/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAF8",
        surface: { DEFAULT: "#FFFFFF", alt: "#F5F4F0", hover: "#EDECE8" },
        ink: { DEFAULT: "#171717", soft: "#333333", muted: "#666666", faint: "#999999", ghost: "#CCCCCC" },
        brand: { DEFAULT: "#F4532A", deep: "#D94420", light: "#FFF0EC", glow: "#FDF5F2" },
        success: { DEFAULT: "#5A8F6E", light: "#EAF3ED", deep: "#3D6B4E" },
        danger: { DEFAULT: "#B85C50", light: "#FAEEEC" },
        amber: { DEFAULT: "#C49A3C", light: "#FBF4E2" },
        info: { DEFAULT: "#5B7FA6", light: "#EBF1F7" },
        border: { DEFAULT: "#E8E8E4", soft: "#F0EFEB" },
      },
      fontFamily: {
        body: ["'DM Sans'", "system-ui", "sans-serif"],
        display: ["'Outfit'", "'DM Sans'", "system-ui", "sans-serif"],
      },
      borderRadius: { sm: "10px", md: "14px", lg: "20px", xl: "28px" },
    },
  },
  plugins: [],
};
