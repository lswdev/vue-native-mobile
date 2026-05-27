export default {
    content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    50: 'var(--color-primary-50)',
                    500: 'var(--color-primary-500)',
                    700: 'var(--color-primary-700)',
                },
                surface: {
                    DEFAULT: 'var(--color-surface)',
                    raised: 'var(--color-surface-raised)',
                },
            },
            fontFamily: {
                sans: ['Pretendard', 'system-ui', 'sans-serif'],
            },
            spacing: {
                safe_bottom: 'env(safe-area-inset-bottom)',
                safe_top: 'env(safe-area-inset-top)',
            },
            borderRadius: {
                card: '0.75rem',
            },
            boxShadow: {
                card: '0 2px 12px 0 rgba(0,0,0,0.08)',
                popup: '0 8px 32px 0 rgba(0,0,0,0.16)',
            },
        },
    },
    plugins: [],
};
