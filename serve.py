#!/usr/bin/env python3
"""Serveur local : pas de listing de dossiers, pas de .git ni de scripts."""
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = 8000

BLOCKED_DIRS = {".git", "_audit", "__pycache__"}
BLOCKED_SUFFIXES = {".py", ".pyc", ".pyo", ".md"}


def is_blocked(rel: Path) -> bool:
    if {p.lower() for p in rel.parts} & BLOCKED_DIRS:
        return True
    name = rel.name.lower()
    if name.startswith("."):
        return True
    if rel.suffix.lower() in BLOCKED_SUFFIXES:
        return True
    return False


class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def list_directory(self, path):
        self.send_error(HTTPStatus.NOT_FOUND, "Not Found")
        return None

    def send_error(self, code, message=None, explain=None):
        if code == HTTPStatus.NOT_FOUND or code == 404:
            page = ROOT / "404.html"
            if page.is_file():
                body = page.read_bytes()
                self.send_response(HTTPStatus.NOT_FOUND)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                if self.command != "HEAD":
                    self.wfile.write(body)
                return
        return super().send_error(code, message, explain)

    def do_GET(self):
        raw = unquote(self.path.split("?", 1)[0])
        if raw in ("/sitemap.xml", "sitemap.xml"):
            self.send_sitemap()
            return
        return super().do_GET()

    def send_sitemap(self):
        host = self.headers.get("Host", "127.0.0.1:8000")
        scheme = "https" if "github.io" in host else "http"
        origin = f"{scheme}://{host}"
        pages = [
            ("/", "1.0", "weekly"),
            ("/disciplines.html", "0.9", "monthly"),
            ("/planning.html", "0.9", "weekly"),
            ("/clubs.html", "0.8", "monthly"),
            ("/nos-clubs.html", "0.7", "monthly"),
            ("/abonnements.html", "0.9", "weekly"),
            ("/contact.html", "0.8", "monthly"),
        ]
        body = '<?xml version="1.0" encoding="UTF-8"?>\n'
        body += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        for path, prio, freq in pages:
            body += "  <url>\n"
            body += f"    <loc>{origin}{path}</loc>\n"
            body += f"    <changefreq>{freq}</changefreq>\n"
            body += f"    <priority>{prio}</priority>\n"
            body += "  </url>\n"
        body += "</urlset>\n"
        data = body.encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/xml; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_head(self):
        raw = unquote(self.path.split("?", 1)[0])
        if raw not in ("/", "") and raw.endswith("/"):
            self.send_error(HTTPStatus.NOT_FOUND, "Not Found")
            return None
        rel = Path(raw.lstrip("/").replace("\\", "/"))
        if rel.parts and is_blocked(rel):
            self.send_error(HTTPStatus.NOT_FOUND, "Not Found")
            return None
        return super().send_head()


if __name__ == "__main__":
    httpd = ThreadingHTTPServer((HOST, PORT), QuietHandler)
    print(f"Boxing Center — http://{HOST}:{PORT}/  (local only)", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nArrêt.")
        httpd.server_close()
