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
          DEFAULT: '#7109AA',
          light: '#A855F7',
          dark: '#5a0788',
        },
        kids: {
          DEFAULT: '#FFD300',
          dark: '#e6be00',
          /** Текст на жёлтом фоне — чёрный для контраста */
          text: '#1a1a1a',
        },
        sense: {
          DEFAULT: '#0D9488',
          light: '#14B8A6',
          dark: '#0F766E',
          /** Текст на teal фоне — белый для контраста */
          text: '#FFFFFF',
        },
        background: '#FFFFFF',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(2rem, 5vw, 4.5rem)', { lineHeight: '1.1', fontWeight: '700' }],
        'heading': ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.2', fontWeight: '700' }],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(113, 9, 170, 0.1)',
        'soft-lg': '0 8px 30px rgba(113, 9, 170, 0.12)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #7109AA 0%, #A855F7 100%)',
        'gradient-banner': 'linear-gradient(135deg, #7109AA 0%, #A855F7 80%)',
        'gradient-sense': 'linear-gradient(135deg, #0D9488 0%, #14B8A6 80%)',
      },
    },
  },
  plugins: [],
};

export default config;
