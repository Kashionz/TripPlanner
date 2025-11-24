/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'primary': '#5D7C89',
                'secondary': '#E8DCCA',
                'accent': '#D98E73',
                'background': '#F9F9F9',
                'surface': '#FFFFFF',
                'text': '#333333',
            },
            fontFamily: {
                sans: ['"Noto Sans JP"', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
