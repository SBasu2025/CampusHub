/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EDF6F9",
          100: "#D7EAF0",
          200: "#B4D8E3",
          300: "#90C6D6",
          400: "#5FADC5",
          500: "#218DAE",
          600: "#1E7A97",
          700: "#1C687F",
          800: "#195568",
          900: "#174251",
        },

        secondary: {
          50: "#EEFAFC",
          100: "#D9F3F8",
          200: "#B7E8F1",
          300: "#95DDEB",
          400: "#66CEE2",
          500: "#2BBBD7",
          600: "#27A1B9",
          700: "#23879B",
          800: "#1F6D7D",
          900: "#1A535F",
        },

        tertiary: {
          50: "#FFFDF7",
          100: "#FEFAED",
          200: "#FEF6DD",
          300: "#FEF2CC",
          400: "#FDECB6",
          500: "#FCE59A",
          600: "#D6C486",
          700: "#B1A372",
          800: "#8B835E",
          900: "#666249",
        },

        accent: {
          50: "#FFFCF2",
          100: "#FFF8E1",
          200: "#FFF1C6",
          300: "#FFEBAC",
          400: "#FFE287",
          500: "#FFD758",
          600: "#D9B84E",
          700: "#B39A45",
          800: "#8D7B3B",
          900: "#675D32",
        },

        neutral: {
          0: "#FFFFFF",
          50: "#F5F8FA",
          100: "#EAF0F3",
          200: "#D6E0E5",
          300: "#B7C5CC",
          400: "#8FA1AA",
          500: "#657883",
          600: "#4A5A64",
          700: "#37444C",
          800: "#242E34",
          900: "#151C20",
          950: "#0C1114",
        },

        danger: "#E14B4B",

        "danger-bg": "#FDEAEA",
        "danger-text": "#9A2E2E",

        "success-alt": "#2FAE6B",
      },

      fontFamily: {
        heading: ['"Plus Jakarta Sans"', "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },

      fontSize: {
        display: ["3rem", { lineHeight: "1.1", fontWeight: "800" }],
        h1: ["2rem", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["1.5rem", { lineHeight: "1.3", fontWeight: "700" }],
        h3: ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        body: ["0.9375rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.5", fontWeight: "400" }],
        caption: [
          "0.75rem",
          {
            lineHeight: "1.4",
            fontWeight: "500",
            letterSpacing: "0.04em",
          },
        ],
      },

      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
      },

      boxShadow: {
        sm: "0 1px 2px rgba(23,66,81,0.06)",
        md: "0 4px 12px rgba(23,66,81,0.08)",
        lg: "0 12px 32px rgba(23,66,81,0.12)",
        "glow-primary": "0 8px 24px rgba(33,141,174,0.25)",
      },

      backgroundImage: {
        "gradient-brand":
          "linear-gradient(135deg, #218DAE 0%, #2BBBD7 100%)",
        "gradient-warm":
          "linear-gradient(135deg, #FFD758 0%, #FCE59A 100%)",
      },

      keyframes: {
        shimmer: {
          "0%": {
            backgroundPosition: "-200% 0",
          },
          "100%": {
            backgroundPosition: "200% 0",
          },
        },

        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(16px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },

        "scale-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.95)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },

        "count-up-flash": {
          "0%": {
            opacity: "0.6",
            transform: "scale(0.98)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },
      },

      animation: {
        shimmer: "shimmer 1.5s linear infinite",
        "fade-in-up": "fade-in-up 300ms ease-out",
        "scale-in": "scale-in 220ms ease-out",
        "count-up-flash": "count-up-flash 300ms ease-out",
      },
    },
  },

  plugins: [],
};