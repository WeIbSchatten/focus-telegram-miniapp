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
          DEFAULT: '#B8A9E8',
          light: '#D4C8F0',
          dark: '#8B7BB8',
        },
        kids: {
          DEFAULT: '#FEF08A',
          dark: '#FDE047',
          /** Текст на пастельном жёлтом — тёмный для контраста */
          text: '#1a1a1a',
        },
        sense: {
          DEFAULT: '#7DD3CE',
          light: '#99E5E0',
          dark: '#5BB5B0',
          /** Текст на пастельном teal — тёмный для контраста */
          text: '#134E4A',
        },
        background: '#FAF9F7',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(2rem, 5vw, 4.5rem)', { lineHeight: '1.1', fontWeight: '700' }],
        'heading': ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.2', fontWeight: '700' }],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(184, 169, 232, 0.15)',
        'soft-lg': '0 8px 30px rgba(184, 169, 232, 0.18)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #8B7BB8 0%, #B8A9E8 100%)',
        'gradient-banner': 'linear-gradient(135deg, #8B7BB8 0%, #B8A9E8 80%)',
        'gradient-sense': 'linear-gradient(135deg, #5BB5B0 0%, #7DD3CE 80%)',
      },
    },
  },
  plugins: [],
};

export default config;
