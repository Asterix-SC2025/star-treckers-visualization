# LAN Orientation Viewer - Quick Start

A real-time 3D orientation viewer that shows IMU data in your browser.

## 🚀 Quick Start (2 minutes)

### 1. Install Dependencies
```bash
# Install pnpm (if you don't have it)
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 2. Create Missing Config
```bash
# Create Tailwind config (required)
echo 'export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: { extend: {} },
  plugins: [],
}' > tailwind.config.js
```

### 3. Start the App
```bash
# Start web interface
pnpm dev
```

Open `http://localhost:3000` - you'll see a 3D viewer with fake data!

## 🔧 Optional: Real IMU Data

### Start Relay Server (for real data)
```bash
cd mac_relay
pip install fastapi uvicorn websockets
python main.py
```

### Raspberry Pi Setup
```bash
cd pi_publisher
pip install -r requirements.txt
# Edit MAC_IP in publish_udp.py to your Mac's IP
python publish_udp.py [your_mac_ip]
```

## 📁 Moving the Project

**Safe to move anywhere!** Just run these commands in the new location:

```bash
pnpm install
# (recreate tailwind.config.js if needed)
pnpm dev
```

## 🎯 What You Get

- **Split-screen 3D viewer**: Overview + First-person view
- **Real-time data**: 60 FPS orientation updates
- **Auto-reconnect**: Handles connection drops
- **Fake data mode**: Works without hardware
- **Settings panel**: Configure WebSocket URL and FOV

## 🐛 Troubleshooting

- **White screen?** Check browser console for errors
- **No 3D?** Make sure you created `tailwind.config.js`
- **Connection errors?** The app works with fake data by default

That's it! The app should work immediately with fake data.
