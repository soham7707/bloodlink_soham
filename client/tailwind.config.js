/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#802828",
      },
    },
  },
  plugins: [],
  //not overlap with other ui libraries
  corePlugins: {
    preflight: false,
  },
};
