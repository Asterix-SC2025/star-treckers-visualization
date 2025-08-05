# Install dependencies
pnpm install

# Create missing Tailwind config
echo 'export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}' > tailwind.config.js

# Start the dev server
pnpm dev