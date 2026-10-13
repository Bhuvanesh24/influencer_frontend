/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        base: 'rgb(var(--color-bg-base) / <alpha-value>)',
        surface: 'rgb(var(--color-bg-surface) / <alpha-value>)',
        'surface-raised': 'rgb(var(--color-bg-surface-raised) / <alpha-value>)',
        selected: 'rgb(var(--color-bg-selected) / <alpha-value>)',
        border: 'rgb(var(--color-border-subtle) / <alpha-value>)',
        ink: 'rgb(var(--color-text-primary) / <alpha-value>)',
        'ink-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'ink-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        inverse: 'rgb(var(--color-text-inverse) / <alpha-value>)',
        'ink-disabled': 'rgb(var(--color-text-disabled) / <alpha-value>)',
        action: {
          DEFAULT: 'rgb(var(--color-action-primary) / <alpha-value>)',
          press: 'rgb(var(--color-action-primary-press) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent-primary) / <alpha-value>)',
          strong: 'rgb(var(--color-accent-strong) / <alpha-value>)',
        },
        money: {
          positive: 'rgb(var(--color-money-positive) / <alpha-value>)',
          held: 'rgb(var(--color-money-held) / <alpha-value>)',
        },
        danger: 'rgb(var(--color-status-danger) / <alpha-value>)',
        info: 'rgb(var(--color-status-info) / <alpha-value>)',
        trust: {
          high: 'rgb(var(--color-trust-high) / <alpha-value>)',
          medium: 'rgb(var(--color-trust-medium) / <alpha-value>)',
          low: 'rgb(var(--color-trust-low) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['Manrope_700Bold', 'var(--font-display)'],
        'display-medium': ['Manrope_600SemiBold', 'var(--font-display)'],
        sans: ['Inter_400Regular', 'var(--font-body)'],
        'sans-medium': ['Inter_500Medium', 'var(--font-body)'],
        'sans-semibold': ['Inter_600SemiBold', 'var(--font-body)'],
        'sans-bold': ['Inter_700Bold', 'var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        // No fontWeight here: each weight is its own font file (see fontFamily above), and
        // pairing a named static font with a numeric weight invites faux-bold on Android.
        // New names must also be registered in src/lib/cn.ts or tailwind-merge drops them.
        display: ['34px', { lineHeight: '40px', letterSpacing: '-0.8px' }],
        h1: ['28px', { lineHeight: '34px', letterSpacing: '-0.6px' }],
        h2: ['22px', { lineHeight: '28px', letterSpacing: '-0.3px' }],
        h3: ['17px', { lineHeight: '24px', letterSpacing: '-0.1px' }],
        body: ['16px', { lineHeight: '24px' }],
        'body-sm': ['14px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '16px' }],
      },
      // Every step is spelled out in px on purpose: NativeWind resolves Tailwind's stock rem
      // values at 14px/rem on native, so any step left to the default (e.g. `h-11`) would come
      // out ~12% small — 38.5pt instead of a 44pt touch target.
      spacing: {
        0.5: '2px',
        1: '4px',
        1.5: '6px',
        2: '8px',
        2.5: '10px',
        3: '12px',
        3.5: '14px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        9: '36px',
        10: '40px',
        11: '44px',
        12: '48px',
        13: '52px',
        14: '56px',
        16: '64px',
        20: '80px',
        24: '96px',
        28: '112px',
        40: '160px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '20px',
      },
    },
  },
  plugins: [],
};
