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
        ink: { DEFAULT: "#16181d", soft: "#5a6472", faint: "#98a2b3" },
        // Borders / dividers
        line: { DEFAULT: "#e6e8ec", strong: "#d3d7de" },
        // Light panel surfaces
        surface: { DEFAULT: "#ffffff", subtle: "#f6f7f9", sunken: "#eef0f3" },
        // Teal accent system
        accent: {
          DEFAULT: "#0f766e",
          hover: "#0d9488",
          ink: "#0a5e57",
          soft: "#d4f1ec",
          tint: "#f0fdfa",
        },
        // Dark 3D viewport (kept dark for contrast)
        viewport: { DEFAULT: "#0c0e12", panel: "#161a21" },
        danger: { DEFAULT: "#dc2626", soft: "#fef2f2", line: "#f3c7c7" },
      },
      borderRadius: {
        panel: "0.75rem",
        btn: "0.5rem",
      },
      boxShadow: {
        // Soft, layered elevation tuned for a light UI
        card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
        panel:
          "0 1px 2px rgba(16,24,40,0.04), 0 12px 32px -8px rgba(16,24,40,0.14)",
        float: "0 8px 24px rgba(8,12,20,0.45)",
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
