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
          DEFAULT: '#7C3AED',
          light: '#A78BFA',
          dark: '#5B21B6',
        },
        kids: {
          DEFAULT: '#FCD34D',
          dark: '#EAB308',
          text: '#1E293B',
        },
        sense: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#047857',
          text: '#FFFFFF',
        },
        background: '#F8FAFC',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(2rem, 5vw, 4.5rem)', { lineHeight: '1.1', fontWeight: '700' }],
        'heading': ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.2', fontWeight: '700' }],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(124, 58, 237, 0.1)',
        'soft-lg': '0 8px 30px rgba(124, 58, 237, 0.12)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
        'gradient-banner': 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 80%)',
        'gradient-sense': 'linear-gradient(135deg, #10B981 0%, #34D399 80%)',
        'gradient-kids': 'linear-gradient(135deg, #FCD34D 0%, #FBBF24 80%)',
      },
    },
  },
  plugins: [],
};

export default config;
