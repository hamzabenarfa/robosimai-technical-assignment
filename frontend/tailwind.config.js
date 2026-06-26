/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter var",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "JetBrains Mono",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        // Text
        ink: { DEFAULT: "#e6e8ec", soft: "#a0a8b4", faint: "#6b7482" },
        // Borders / dividers
        line: { DEFAULT: "#262b33", strong: "#363d48" },
        // Dark panel surfaces, layered for depth (subtle = page, DEFAULT = panel, sunken = inputs)
        surface: { DEFAULT: "#161a21", subtle: "#0f1117", sunken: "#0b0d11" },
        // Teal accent system, brightened for dark backgrounds
        accent: {
          DEFAULT: "#0d9488",
          hover: "#14b8a6",
          ink: "#5eead4",
          soft: "#0f3b36",
          tint: "#0e211e",
        },
        // 3D viewport (deepest tone so it reads as a recessed focal area)
        viewport: { DEFAULT: "#0a0c10", panel: "#161a21" },
        danger: { DEFAULT: "#f87171", soft: "#2a1517", line: "#5a2a2c" },
      },
      borderRadius: {
        panel: "0.75rem",
        btn: "0.5rem",
      },
      boxShadow: {
        // Elevation for a dark UI: deep black drop plus a faint top highlight
        card: "0 1px 2px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
        panel:
          "0 1px 2px rgba(0,0,0,0.4), 0 16px 40px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
        float: "0 12px 32px rgba(0,0,0,0.65)",
      },
      keyframes: {
        "toast-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "toast-in": "toast-in 180ms cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [],
};
