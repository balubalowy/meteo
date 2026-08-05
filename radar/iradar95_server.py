import os
import urllib.request
import urllib.parse
from http.server import SimpleHTTPRequestHandler
import socketserver

PORT = 8000
IMGW_BASE = "https://danepubliczne.imgw.pl"

class ProxyHandler(SimpleHTTPRequestHandler):
    
    def do_GET(self):
        # Intercept ALL requests to /datastore/getfiledown/ and proxy them to IMGW
        if self.path.startswith("/datastore/getfiledown/"):
            self._proxy_download(self.path)
            return

        # Also handle explicit /api/download?path=...
        if self.path.startswith("/api/download?"):
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            rel_path = qs.get("path", [""])[0]
            if not rel_path:
                self.send_error(400, "Missing path")
                return
            self._proxy_download("/datastore/getfiledown/" + rel_path)
            return

        # RainViewer API proxy
        if self.path.startswith("/api/rainviewer/"):
            rest = self.path[len("/api/rainviewer/"):]
            target = "https://api.rainviewer.com/" + rest
            try:
                req = urllib.request.Request(target, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = resp.read()
                    self.send_response(200)
                    ct = resp.headers.get('Content-Type', 'application/json')
                    self.send_header('Content-Type', ct)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(data)
            except Exception as e:
                self.send_error(500, f"RainViewer proxy error: {e}")
            return

        return super().do_GET()

    def _proxy_download(self, path):
        target_url = IMGW_BASE + path
        try:
            req = urllib.request.Request(target_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=60) as response:
                data = response.read()
                self.send_response(200)
                ct = response.headers.get('Content-Type', 'application/octet-stream')
                self.send_header('Content-Type', ct)
                self.send_header('Content-Length', str(len(data)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)
        except Exception as e:
            self.send_error(502, f"IMGW download error: {e}")
    
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else ""
        params = urllib.parse.parse_qs(post_body)
        
        if self.path == "/api/products":
            pt = params.get('productType', ['oper'])[0]
            self._proxy_post(IMGW_BASE + "/pl/datastore/getProductList", {'productType': pt})
            return
        
        if self.path == "/api/files":
            pt = params.get('productType', ['oper'])[0]
            path = params.get('path', [''])[0]
            self._proxy_post(IMGW_BASE + "/pl/datastore/getFilesList", {'productType': pt, 'path': path})
            return
        
        self.send_error(404, "Not Found")
    
    def _proxy_post(self, url, form_data):
        data = urllib.parse.urlencode(form_data).encode('utf-8')
        try:
            req = urllib.request.Request(url, data=data, headers={
                'User-Agent': 'Mozilla/5.0',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
            })
            with urllib.request.urlopen(req, timeout=30) as response:
                html = response.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(html)
        except Exception as e:
            self.send_error(502, f"Proxy error: {e}")

    def log_message(self, format, *args):
        # Color-coded logging
        msg = format % args
        if "200" in msg:
            print(f"\033[92m{msg}\033[0m")
        elif "404" in msg or "502" in msg or "500" in msg:
            print(f"\033[91m{msg}\033[0m")
        else:
            print(msg)

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
        print(f"{'='*50}")
        print(f"  iRadar95 Server")
        print(f"  http://localhost:{PORT}/iradar95.html")
        print(f"  Ctrl+C aby zatrzymac")
        print(f"{'='*50}")
        httpd.serve_forever()
