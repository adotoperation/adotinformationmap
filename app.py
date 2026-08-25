import os
import sys
import threading
import urllib.request
from http.server import HTTPServer, SimpleHTTPRequestHandler
import webview

if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PORT = 8080

GOOGLE_URLS = {
    "/api/data": "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=630627369",
    "/api/academy_data": "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=1376867691",
    "/api/branch_data": "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=211834294",
    "/api/apartment_data": "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=642130592",
    "/api/yoy_data": "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=452840178",
    "/api/university_data": "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=541959206"
}

class MapRequestHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        path = path.split('?', 1)[0].split('#', 1)[0]
        rel_path = path.lstrip('/')
        if not rel_path:
            rel_path = 'index.html'
        return os.path.join(BASE_DIR, rel_path)

    def do_GET(self):
        clean_path = self.path.split('?', 1)[0]
        if clean_path in GOOGLE_URLS:
            target_url = GOOGLE_URLS[clean_path]
            try:
                req = urllib.request.Request(
                    target_url,
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                )
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = resp.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/csv; charset=utf-8')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Cache-Control', 'no-cache')
                    self.end_headers()
                    self.wfile.write(data)
            except Exception as e:
                print(f"Error fetching {clean_path}: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"error": "Failed to fetch Google Sheets data"}')
        else:
            super().do_GET()

    def log_message(self, format, *args):
        pass

def start_server():
    server = HTTPServer(('127.0.0.1', PORT), MapRequestHandler)
    server.serve_forever()

if __name__ == '__main__':
    t = threading.Thread(target=start_server, daemon=True)
    t.start()
    
    window = webview.create_window(
        '전국 학교 & 학원가 & 지점 통합 분석 지도',
        f'http://localhost:{PORT}',
        width=1400,
        height=900,
        min_size=(1024, 768)
    )
    webview.start()
