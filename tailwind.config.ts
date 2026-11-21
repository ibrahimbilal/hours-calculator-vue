import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        accent: '#0d9488',
        muted: '#64748b',
        textc: '#616163',
        input: '#f7f7f7',
        inputb: '#e7e7e7',
        card: '#ffffff',
      },
      boxShadow: {
        fab: '0 8px 24px rgba(13, 148, 136, 0.45)',
        'fab-muted': '0 4px 12px rgba(100, 116, 139, 0.25)',
        'nav-top': '0 -4px 24px rgba(13, 148, 136, 0.08)',
        'week-current': '0 4px 20px rgba(13, 148, 136, 0.12)',
        'summary-card': '0 4px 24px rgba(13, 148, 136, 0.1)',
        week: '0 2px 16px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [
    plugin(({ addComponents }) => {
      addComponents({
        '.pwa-titlebar': {
          '@media (display-mode: window-controls-overlay)': {
            position: 'fixed',
            top: '0',
            left: '0',
            zIndex: '50',
            boxSizing: 'border-box',
            paddingLeft: 'env(titlebar-area-x, env(safe-area-inset-left, 0px))',
            paddingTop: 'env(titlebar-area-y, 0)',
            paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
            width: 'env(titlebar-area-width, 100%)',
            height: 'env(titlebar-area-height, 2.75rem)',
            WebkitAppRegion: 'drag',
            appRegion: 'drag',
            '& :where(button, a, input, select, [role=button])': {
              WebkitAppRegion: 'no-drag',
              appRegion: 'no-drag',
            },
          },
        },
        '.pwa-main-offset': {
          '@media (display-mode: window-controls-overlay)': {
            paddingTop: 'calc(env(titlebar-area-height, 2.75rem) + 0.5rem)',
          },
        },
      })
    }),
  ],
} satisfies Config