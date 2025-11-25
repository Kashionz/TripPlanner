/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // 日系簡約風格色彩系統
      colors: {
        // 主色系 - 青磁色
        primary: {
          DEFAULT: "hsl(var(--primary))",
          light: "#6B8B8A",
          dark: "#4A6A69",
          foreground: "hsl(var(--primary-foreground))",
        },
        // 次色系 - 若竹色
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          light: "#9BAE94",
          dark: "#7A8C72",
          foreground: "hsl(var(--secondary-foreground))",
        },
        // 強調色 - 金茶色
        accent: {
          DEFAULT: "hsl(var(--accent))",
          light: "#D4B46A",
          dark: "#B39249",
          foreground: "hsl(var(--accent-foreground))",
        },
        // 背景色
        background: {
          DEFAULT: "hsl(var(--background))",
          secondary: "hsl(var(--muted))",
          tertiary: "hsl(var(--muted) / 0.5)",
        },
        // 文字色
        foreground: {
          DEFAULT: "hsl(var(--foreground))",
          secondary: "hsl(var(--muted-foreground))",
          muted: "hsl(var(--muted-foreground) / 0.7)",
        },
        // 邊框色
        border: {
          DEFAULT: "hsl(var(--border))",
          dark: "hsl(var(--border) / 0.8)",
        },
        // 語意化色彩
        success: {
          DEFAULT: "#7A9B76",
          light: "#8AAC86",
          dark: "#6A8A66",
        },
        warning: {
          DEFAULT: "#C4A35A",
          light: "#D4B46A",
          dark: "#B39249",
        },
        error: {
          DEFAULT: "#B87070",
          light: "#C88080",
          dark: "#A86060",
        },
        info: {
          DEFAULT: "#5B7B7A",
          light: "#6B8B8A",
          dark: "#4A6A69",
        },
        // shadcn/ui 需要的色彩
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        ring: "hsl(var(--ring))",
        input: "hsl(var(--input))",
      },
      // 字體設定
      fontFamily: {
        sans: [
          '"Noto Sans TC"',
          '"Noto Sans JP"',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
      },
      // 字重設定
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
      },
      // 圓角設定
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
      },
      // 間距設定
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      // 動畫設定
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          from: { transform: "translateY(-10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
      },
      // 過渡時間
      transitionDuration: {
        '400': '400ms',
        '500': '500ms',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}