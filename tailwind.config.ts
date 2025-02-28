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
        }
    },
    plugins: [],
}
export default config
