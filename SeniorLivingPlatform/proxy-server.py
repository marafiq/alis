#!/usr/bin/env python3
"""
Local HTTP/HTTPS proxy server that handles JWT proxy authentication for NuGet.
Listens on localhost:8888 and forwards requests through the JWT-authenticated corporate proxy.
"""
import os
import sys
import socket
import select
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.error
import urllib.parse

# Get the upstream proxy from environment
UPSTREAM_PROXY = os.environ.get('HTTP_PROXY', os.environ.get('http_proxy', ''))

if not UPSTREAM_PROXY:
    print("ERROR: HTTP_PROXY environment variable not set")
    sys.exit(1)

# Parse upstream proxy
parsed_proxy = urllib.parse.urlparse(UPSTREAM_PROXY)
PROXY_HOST = parsed_proxy.hostname
PROXY_PORT = parsed_proxy.port or 80
PROXY_AUTH = f"{parsed_proxy.username}:{parsed_proxy.password}" if parsed_proxy.username else None

print(f"Starting proxy server on localhost:8888")
print(f"Upstream proxy: {PROXY_HOST}:{PROXY_PORT}")

class ProxyHandler(BaseHTTPRequestHandler):
    timeout = 60

    def do_CONNECT(self):
        """Handle HTTPS CONNECT requests for SSL tunneling"""
        try:
            # Parse destination
            host, port = self.path.split(':')
            port = int(port)

            # Connect to upstream proxy
            proxy_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            proxy_sock.settimeout(30)
            proxy_sock.connect((PROXY_HOST, PROXY_PORT))

            # Send CONNECT request to upstream proxy with authentication
            connect_req = f"CONNECT {host}:{port} HTTP/1.1\r\n"
            connect_req += f"Host: {host}:{port}\r\n"

            if PROXY_AUTH:
                import base64
                auth_str = base64.b64encode(PROXY_AUTH.encode()).decode()
                connect_req += f"Proxy-Authorization: Basic {auth_str}\r\n"

            connect_req += "\r\n"
            proxy_sock.sendall(connect_req.encode())

            # Read response from upstream proxy
            response = b""
            while b"\r\n\r\n" not in response:
                chunk = proxy_sock.recv(4096)
                if not chunk:
                    break
                response += chunk

            # Check if CONNECT succeeded
            if b"200" not in response.split(b"\r\n")[0]:
                self.send_error(502, f"Proxy CONNECT failed: {response.decode('latin-1', errors='ignore')}")
                proxy_sock.close()
                return

            # Send 200 to client
            self.send_response(200, 'Connection Established')
            self.end_headers()

            # Now tunnel data between client and proxy
            self._tunnel(self.connection, proxy_sock)

        except Exception as e:
            print(f"CONNECT error: {e}")
            self.send_error(502, f"CONNECT failed: {str(e)}")

    def _tunnel(self, client_sock, proxy_sock):
        """Tunnel data between client and proxy sockets"""
        try:
            sockets = [client_sock, proxy_sock]
            while True:
                ready, _, _ = select.select(sockets, [], [], 60)
                if not ready:
                    break

                for sock in ready:
                    data = sock.recv(8192)
                    if not data:
                        return

                    if sock is client_sock:
                        proxy_sock.sendall(data)
                    else:
                        client_sock.sendall(data)
        except Exception as e:
            print(f"Tunnel error: {e}")
        finally:
            proxy_sock.close()

    def do_GET(self):
        self.proxy_request()

    def do_POST(self):
        self.proxy_request()

    def proxy_request(self):
        """Handle HTTP requests"""
        try:
            # Setup proxy handler with authentication
            proxy_handler = urllib.request.ProxyHandler({
                'http': UPSTREAM_PROXY,
                'https': UPSTREAM_PROXY
            })
            opener = urllib.request.build_opener(proxy_handler)
            urllib.request.install_opener(opener)

            # Read request body if present
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else None

            # Create request
            req = urllib.request.Request(self.path, data=body, method=self.command)

            # Copy headers
            for key, value in self.headers.items():
                if key.lower() not in ['host', 'connection']:
                    req.add_header(key, value)

            # Make request
            with urllib.request.urlopen(req, timeout=30) as response:
                self.send_response(response.status)
                for key, value in response.headers.items():
                    if key.lower() not in ['connection', 'transfer-encoding']:
                        self.send_header(key, value)
                self.end_headers()
                self.wfile.write(response.read())

        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            print(f"Proxy error: {e}")
            self.send_error(500, str(e))

    def log_message(self, format, *args):
        print(f"{self.address_string()} - {format % args}")

if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', 8888), ProxyHandler)
    print("Proxy server ready. Use http://127.0.0.1:8888 as your proxy.")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down proxy server...")
        server.shutdown()
