import type {Config} from 'tailwindcss'

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic':
                    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
            // boxShadow: {
            // 'bright': '0 4px 6px -1px rgba(90, 197, 242, 0.8), 0 2px 4px -2px rgba(90, 197, 242, 0.8)',
            // 'bright': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
            // },

            boxShadow: {
                'bright': '0 20px 30px -10px rgba(204, 142, 53, 0.7), 0 15px 15px -10px rgba(204, 142, 53, 0.5)',
                'inset': 'inset 0 8px 6px 0 rgba(0.77, 0.77, 0.77, 0.98)',
                'bright-inset': '0 6px 220px -4px rgba(204, 142, 53, 0.7), 0 6px 4px -10px rgba(204, 142, 53, 0.5), inset 0 8px 6px 0 rgba(77, 77, 77, 0.98)',
            },
            keyframes: {
                'neon-glow': {
                    '0%, 100%': {
                        boxShadow: '0 0 6px rgba(0,255,157, 0.7), 0 0 14px rgba(0,255,157, 0.5)',
                    },
                    '50%': {
                        boxShadow: '0 0 12px rgba(0,255,157, 0.9), 0 0 24px rgba(0,255,157, 0.7)',
                    },
                },
                'pulse-once': {
                    '0%': {
                        transform: 'scale(1)',
                        opacity: '1',
                    },
                    '50%': {
                        transform: 'scale(1.2)',
                        opacity: '0.4',
                    },
                    '100%': {
                        transform: 'scale(1)',
                        opacity: '1',
                    },
                },
                'pulse-once-reverse': {
                    '0%': {
                        transform: 'scale(1)',
                        opacity: '1',
                    },
                    '50%': {
                        transform: 'scale(0.8)',
                        opacity: '0.4',
                    },
                    '100%': {
                        transform: 'scale(1)',
                        opacity: '1',
                    },
                },
            },
            animation: {
                'pulse-once': 'pulse-once 0.8s ease-in-out',
                'pulse-once-reverse': 'pulse-once-reverse 0.8s ease-in-out',
                'neon-glow': 'neon-glow 2s ease-in-out infinite',
            },
        }
    },
    plugins: [],
}
export default config
