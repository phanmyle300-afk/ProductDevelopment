/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF8",
        surface: "#FFFFFF",
        border: {
          DEFAULT: "#E5E5E0",
          subtle: "#EFEFEA",
          strong: "#D4D4CE",
        },
        text: {
          primary: "#1A1A1A",
          secondary: "#6B6B66",
          muted: "#9E9E98",
        },
        // Accent chính: Deep Teal
        accent: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E", // Primary solid accent
          800: "#115E59",
          900: "#134E4A",
          DEFAULT: "#0F766E",
        },
        // Semantic colors
        success: {
          DEFAULT: "#15803D",
          light: "#F0FDF4",
          border: "#DCFCE7",
        },
        warning: {
          DEFAULT: "#B45309",
          light: "#FFFBEB",
          border: "#FEF3C7",
        },
        danger: {
          DEFAULT: "#B91C1C",
          light: "#FEF2F2",
          border: "#FEE2E2",
        },
        info: {
          DEFAULT: "#0E7490",
          light: "#ECFEFF",
          border: "#CFFAFE",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "IBM Plex Mono", "monospace"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "18px" }],
        base: ["14px", { lineHeight: "21px" }],
        md: ["15px", { lineHeight: "22px" }],
        lg: ["16px", { lineHeight: "24px" }],
        xl: ["18px", { lineHeight: "26px" }],
        "2xl": ["20px", { lineHeight: "28px" }],
        "3xl": ["24px", { lineHeight: "32px" }],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "14px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        dropdown: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
        modal: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};

