import http.server
import socketserver
import os
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')
PORT = 8000

class RangeHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler with full Range request (HTTP 206) support for instant audio seeking."""
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Range, Content-Type, Accept-Ranges')
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path):
            return super().send_head()

        ctype = self.guess_type(path)
        if path.endswith('.json'):
            ctype = 'application/json; charset=utf-8'

        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None

        fs = os.fstat(f.fileno())
        total_length = fs.st_size

        range_header = self.headers.get('Range')
        if range_header and range_header.startswith('bytes='):
            # Parse Range header
            range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
            if range_match:
                start_str, end_str = range_match.groups()
                start = int(start_str) if start_str else 0
                end = int(end_str) if end_str else total_length - 1
                if start >= total_length:
                    self.send_error(416, "Requested Range Not Satisfiable")
                    f.close()
                    return None
                end = min(end, total_length - 1)
                content_length = end - start + 1

                self.send_response(206)
                self.send_header('Content-Type', ctype)
                self.send_header('Content-Range', f'bytes {start}-{end}/{total_length}')
                self.send_header('Content-Length', str(content_length))
                self.send_header('Last-Modified', self.date_time_string(fs.st_mtime))
                self.end_headers()

                f.seek(start)
                return RangeFileWrapper(f, content_length)

        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(total_length))
        self.send_header('Last-Modified', self.date_time_string(fs.st_mtime))
        self.end_headers()
        return f

class RangeFileWrapper:
    def __init__(self, file, length):
        self.file = file
        self.length = length
        self.bytes_read = 0

    def read(self, size=-1):
        if self.bytes_read >= self.length:
            return b""
        if size < 0:
            to_read = self.length - self.bytes_read
        else:
            to_read = min(size, self.length - self.bytes_read)
        data = self.file.read(to_read)
        self.bytes_read += len(data)
        return data

    def close(self):
        self.file.close()

def run_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), RangeHTTPRequestHandler) as httpd:
        print("==================================================")
        print(f"Busrida App (Embera Dobida) corriendo en:")
        print(f"http://localhost:{PORT}")
        print("Soporte completo HTTP Range 206 para audio sin pausas activo.")
        print("==================================================")
        sys.stdout.flush()
        httpd.serve_forever()

if __name__ == '__main__':
    run_server()
