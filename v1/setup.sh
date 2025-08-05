#!/bin/bash

echo "🚀 Setting up LAN Orientation Viewer..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Create Tailwind config if it doesn't exist
if [ ! -f "tailwind.config.js" ]; then
    echo "⚙️  Creating Tailwind config..."
    cat > tailwind.config.js << 'EOF'
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: { extend: {} },
  plugins: [],
}
EOF
fi

echo "✅ Setup complete!"
echo "🎯 Run 'pnpm dev' to start the app"
echo "🌐 Open http://localhost:3000 in your browser" 