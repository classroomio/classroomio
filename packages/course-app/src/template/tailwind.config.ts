import 'dotenv/config';

import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';
import tailwindcssAnimate from 'tailwindcss-animate';

const getFont = (): string => {
  switch (process.env.VITE_TEMPLATE) {
    case 'posthog':
      return 'Matter, sans-serif';
    case 'classic':
      return 'Inter, sans-serif';
    case 'minimal':
      return 'Inter, sans-serif';
    case 'examprep':
      return 'Playfair Display, serif';
    case 'webflow':
      return 'Lato, sans-serif';
    case 'bootcamp':
      return 'Roboto Slab, serif';
    default:
      return 'Cal Sans, sans-serif';
  }
};

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{html,js,svelte,ts}'],
  safelist: ['dark'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
        },
        posthog: {
          DEFAULT: 'hsl(var(--posthog-primary) / <alpha-value>)',
          secondary: 'hsl(var(--posthog-secondary) / <alpha-value>)',
          background: 'hsl(var(--posthog-background) / <alpha-value>)',
          border: 'hsl(var(--posthog-border) / <alpha-value>)',
          ring: 'hsl(var(--posthog-ring) / <alpha-value>)'
        },
        bootcamp: {
          DEFAULT: 'hsl(var(--bootcamp-primary) / <alpha-value>)',
          secondary: 'hsl(var(--bootcamp-secondary) / <alpha-value>)'
        },
        classic: {
          DEFAULT: 'hsl(var(--classic-primary) / <alpha-value>)',
          secondary: 'hsl(var(--classic-secondary) / <alpha-value>)'
        },
        examprep: {
          DEFAULT: 'hsl(var(--examprep-primary) / <alpha-value>)',
          secondary: 'hsl(var(--examprep-secondary) / <alpha-value>)'
        },
        minimal: {
          DEFAULT: 'hsl(var(--minimal-primary) / <alpha-value>)',
          secondary: 'hsl(var(--minimal-secondary) / <alpha-value>)'
        },
        webflow: {
          DEFAULT: 'hsl(var(--webflow-primary) / <alpha-value>)',
          secondary: 'hsl(var(--webflow-secondary) / <alpha-value>)'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)'
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: [...fontFamily.sans],
        roboto: ['Roboto', ...fontFamily.sans],
        matter: ['Matter', ...fontFamily.sans],
        slab: ['Roboto Slab', ...fontFamily.serif]
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--bits-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--bits-accordion-content-height)' },
          to: { height: '0' }
        },
        'caret-blink': {
          '0%,70%,100%': { opacity: '1' },
          '20%,50%': { opacity: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'caret-blink': 'caret-blink 1.25s ease-out infinite'
      }
    },
    fontFamily: {
      app: getFont()
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
