import asyncio
import json
import time
import math
from typing import Set, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Orientation Relay Server")

# Enable CORS for web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
clients: Set[WebSocket] = set()
latest_message: Optional[str] = None
fake_mode = True  # Set to False when receiving real data

class UdpProtocol(asyncio.DatagramProtocol):
    def __init__(self, on_message_callback):
        self.on_message = on_message_callback
        
    def datagram_received(self, data: bytes, addr):
        global fake_mode
        fake_mode = False  # Switch to real data mode
        
        try:
            # Decode and parse the incoming data
            message = json.loads(data.decode('utf-8'))
            
            # Validate and normalize the message
            normalized = self.normalize_message(message)
            if normalized:
                self.on_message(json.dumps(normalized))
                
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            print(f"Failed to decode message from {addr}: {e}")
        except Exception as e:
            print(f"Error processing message from {addr}: {e}")
    
    def normalize_message(self, msg: dict) -> Optional[dict]:
        """Normalize incoming message to standard format"""
        try:
            # Extract quaternion
            if 'q' not in msg or not isinstance(msg['q'], list) or len(msg['q']) != 4:
                print("Invalid quaternion in message")
                return None
            
            w, x, y, z = msg['q']
            
            # Normalize quaternion
            length = math.sqrt(w*w + x*x + y*y + z*z)
            if length == 0:
                w, x, y, z = 1, 0, 0, 0
            else:
                w, x, y, z = w/length, x/length, y/length, z/length
            
            # Build normalized message
            normalized = {
                'ts_unix_ms': int(time.time() * 1000),
                'q': [w, x, y, z],
                'fov_deg': max(10, min(120, msg.get('fov_deg', 40.0))),  # Clamp FOV
            }
            
            # Optional fields
            if 'lat' in msg:
                normalized['lat'] = msg['lat']
            if 'lon' in msg:
                normalized['lon'] = msg['lon']
            if 'alt_m' in msg:
                normalized['alt_m'] = msg['alt_m']
                
            return normalized
            
        except (ValueError, TypeError) as e:
            print(f"Error normalizing message: {e}")
            return None

async def udp_server():
    """Start UDP server to receive data from Pi"""
    loop = asyncio.get_running_loop()
    
    def on_message(message: str):
        global latest_message
        latest_message = message
    
    try:
        transport, protocol = await loop.create_datagram_endpoint(
            lambda: UdpProtocol(on_message),
            local_addr=('0.0.0.0', 9001)
        )
        print("UDP server listening on 0.0.0.0:9001")
        return transport
    except Exception as e:
        print(f"Failed to start UDP server: {e}")
        return None

async def fake_data_generator():
    """Generate fake orientation data for testing"""
    global latest_message, fake_mode
    
    while True:
        if fake_mode:  # Only generate fake data when not receiving real data
            t = time.time()
            
            # Generate smooth rotation around Y axis
            angle = 0.5 * t
            w = math.cos(angle / 2)
            x = 0.0
            y = math.sin(angle / 2)
            z = 0.0
            
            # Add some pitch variation
            pitch_angle = 0.2 * math.sin(0.3 * t)
            pitch_w = math.cos(pitch_angle / 2)
            pitch_x = math.sin(pitch_angle / 2)
            
            # Combine rotations (simplified)
            combined_w = w * pitch_w - x * pitch_x
            combined_x = w * pitch_x + x * pitch_w
            combined_y = y * pitch_w
            combined_z = z * pitch_w
            
            fake_msg = {
                'ts_unix_ms': int(time.time() * 1000),
                'q': [combined_w, combined_x, combined_y, combined_z],
                'fov_deg': 40.0 + 10 * math.sin(0.1 * t),  # Varying FOV
                'lat': 42.6977,
                'lon': 23.3219,
                'alt_m': 600
            }
            
            latest_message = json.dumps(fake_msg)
        
        await asyncio.sleep(1/60)  # 60 Hz

@app.websocket("/ws/orientation")
async def websocket_endpoint(websocket: WebSocket):
    client_addr = websocket.client.host if websocket.client else "unknown"
    
    try:
        await websocket.accept()
        clients.add(websocket)
        print(f"✅ Client connected from {client_addr}. Total clients: {len(clients)}")
        
        while True:
            # Send latest data if available
            if latest_message:
                try:
                    await websocket.send_text(latest_message)
                except Exception as e:
                    print(f"❌ Error sending to client {client_addr}: {e}")
                    break
            
            await asyncio.sleep(1/60)  # 60 Hz broadcast rate
            
    except WebSocketDisconnect:
        print(f"🔌 Client {client_addr} disconnected normally")
    except Exception as e:
        print(f"❌ WebSocket error with client {client_addr}: {e}")
    finally:
        clients.discard(websocket)
        print(f"📉 Client {client_addr} removed. Total clients: {len(clients)}")

@app.get("/")
async def root():
    return {
        "message": "Orientation Relay Server",
        "clients_connected": len(clients),
        "fake_mode": fake_mode,
        "endpoints": {
            "websocket": "/ws/orientation",
            "udp_port": 9001
        }
    }

@app.get("/status")
async def status():
    return {
        "clients_connected": len(clients),
        "fake_mode": fake_mode,
        "has_data": latest_message is not None,
        "uptime": time.time()
    }

def get_local_ip():
    """Get the local IP address"""
    import socket
    try:
        # Connect to a remote address to determine local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "localhost"

@app.on_event("startup")
async def startup_event():
    # Start UDP server
    udp_task = asyncio.create_task(udp_server())
    
    # Start fake data generator
    fake_task = asyncio.create_task(fake_data_generator())
    
    print("=" * 50)
    print("🚀 Orientation Relay Server Started")
    print("=" * 50)
    print(f"📡 WebSocket endpoint: ws://localhost:8000/ws/orientation")
    print(f"📡 WebSocket endpoint (LAN): ws://{get_local_ip()}:8000/ws/orientation")
    print(f"🔌 UDP server: 0.0.0.0:9001")
    print(f"📊 Status endpoint: http://localhost:8000/status")
    print(f"🌐 Web interface: http://localhost:3000")
    print("=" * 50)
    print("💡 Tips:")
    print("   - Use the LAN IP for connecting from other devices")
    print("   - Check firewall settings if connection fails")
    print("   - Fake data mode is active until Pi connects")
    print("=" * 50)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
