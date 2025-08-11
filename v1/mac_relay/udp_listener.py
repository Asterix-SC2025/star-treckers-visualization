import socket

UDP_IP = "0.0.0.0"  # Listen on all interfaces
UDP_PORT = 9001     # Must match MAC_PORT in your publish_udp.py

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((UDP_IP, UDP_PORT))

print(f"Listening for UDP packets on port {UDP_PORT}...")

while True:
    data, addr = sock.recvfrom(1024)
    print(f"Received from {addr}: {data.decode()}")