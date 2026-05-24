import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: { cloud: { bg: '#050814', cyan: '#67e8f9' } },
      boxShadow: { glow: '0 0 80px rgba(103,232,249,0.18)' }
    }
  },
  plugins: []
};
export default config;
