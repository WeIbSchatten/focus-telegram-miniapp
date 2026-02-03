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
          DEFAULT: '#3e6787',
          light: '#5a7d9a',
          dark: '#2d4a62',
        },
        kids: {
          DEFAULT: '#b48b8b',
          light: '#c9a5a5',
          dark: '#9a7272',
          text: '#1a1a1a',
        },
        sense: {
          DEFAULT: '#f4d4bd',
          light: '#f8e4d4',
          dark: '#e8c4a8',
          text: '#5c4033',
        },
        background: '#fdf5ef',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(2rem, 5vw, 4.5rem)', { lineHeight: '1.1', fontWeight: '700' }],
        'heading': ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.2', fontWeight: '700' }],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(62, 103, 135, 0.15)',
        'soft-lg': '0 8px 30px rgba(62, 103, 135, 0.18)',
        sense: '0 4px 20px rgba(244, 212, 189, 0.25)',
        kids: '0 4px 20px rgba(180, 139, 139, 0.2)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2d4a62 0%, #3e6787 100%)',
        'gradient-banner': 'linear-gradient(135deg, #2d4a62 0%, #3e6787 80%)',
        'gradient-sense': 'linear-gradient(135deg, #e8c4a8 0%, #f4d4bd 80%)',
        'gradient-kids': 'linear-gradient(135deg, #9a7272 0%, #b48b8b 80%)',
      },
    },
  },
  plugins: [],
};

export default config;
