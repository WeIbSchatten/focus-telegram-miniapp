import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#404267',
          light: '#5c5a7a',
          dark: '#201E45',
        },
        kids: {
          DEFAULT: '#F07B7B',
          light: '#f59999',
          dark: '#e85c5c',
          text: '#1a1a1a',
        },
        sense: {
          DEFAULT: '#6D8C8E',
          light: '#8fa8aa',
          dark: '#556d6f',
          text: '#1a2d2e',
        },
        background: '#f0f0f5',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(2rem, 5vw, 4.5rem)', { lineHeight: '1.1', fontWeight: '700' }],
        'heading': ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.2', fontWeight: '700' }],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(64, 66, 103, 0.15)',
        'soft-lg': '0 8px 30px rgba(64, 66, 103, 0.18)',
        sense: '0 4px 20px rgba(109, 140, 142, 0.25)',
        kids: '0 4px 20px rgba(240, 123, 123, 0.25)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #201E45 0%, #404267 100%)',
        'gradient-banner': 'linear-gradient(135deg, #201E45 0%, #404267 80%)',
        'gradient-sense': 'linear-gradient(135deg, #556d6f 0%, #6D8C8E 80%)',
        'gradient-kids': 'linear-gradient(135deg, #e85c5c 0%, #F07B7B 80%)',
      },
    },
  },
  plugins: [],
};

export default config;
