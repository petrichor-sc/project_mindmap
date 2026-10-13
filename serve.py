#!/usr/bin/env python3
"""Serve this exact app folder with caching disabled for local development."""
import argparse
import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent

class FreshHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.js': 'application/javascript', '.mjs': 'application/javascript', '.json': 'application/json'}
    def send_head(self):
        if 'If-Modified-Since' in self.headers:
            del self.headers['If-Modified-Since']
        return super().send_head()
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    parser = argparse.ArgumentParser(description='Open the latest Project Mind Map folder without browser caching.')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error('Choose a port between 1 and 65535.')
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(FreshHandler, directory=str(APP_DIR)))
    except OSError as error:
        print(f'Could not use port {args.port}: {error}')
        print('Stop the old Python server with Ctrl+C, then run this script again.')
        print('Alternatively: py serve.py --port 8001 (use Export/Import to move notes to the new address).')
        raise SystemExit(1)
    version = json.loads((APP_DIR / 'version.json').read_text(encoding='utf-8'))
    print(f"Project Mind Map {version['version']} / build {version['build']}", flush=True)
    print(f'Serving folder: {APP_DIR}', flush=True)
    print(f'Open: http://localhost:{args.port}/', flush=True)
    print('Cache disabled. Ctrl+C stops this server.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped.')
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
