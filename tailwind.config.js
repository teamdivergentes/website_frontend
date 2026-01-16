/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        // Design tokens principaux
        black: '#101111',
        'green-primary': '#32d299',
        'green-dark': '#28413b',
        white: '#FFFFFF',
        // Tokens supplémentaires du design system
        'text-secondary': '#E2E2E2',
        'text-dark': '#000000',
        'bg-overlay': 'rgba(255, 255, 255, 0.05)',
      },
      spacing: {
        // Système 8px - mappé aux classes Tailwind standard
        // p-1 = 8px, p-2 = 16px, p-3 = 24px, etc.
        // Garde aussi les valeurs par défaut de Tailwind (0, 0.5, 1.5, 2.5, etc.)
        1: '8px',
        2: '16px',
        3: '24px',
        4: '32px',
        5: '40px',
        6: '48px',
        7: '56px',
        8: '64px',
      },
      fontFamily: {
        heading: ['Bebas Neue', 'sans-serif'],      // Titres principaux
        body: ['Asar', 'serif'],                     // Corps de texte
        secondary: ['Athiti', 'sans-serif'],         // UI, badges, labels
        decorative: ['Bokor', 'sans-serif'],         // Éléments décoratifs (fallback pour Boosting)
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        none: '0px',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
