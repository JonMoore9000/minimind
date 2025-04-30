module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['var(--font-comfortaa)', 'sans-serif'],
          mono: ['var(--font-ibm)', 'monospace'],
        },
      },
    },
    plugins: [],
  }