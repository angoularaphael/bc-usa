#!/usr/bin/env python3
"""Serveur local : pages en routes dossier, pas de listing, pas de .git ni de scripts."""
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = 8000

PAGES = {"disciplines", "planning", "clubs", "nos-clubs", "abonnements", "contact"}
BLOCKED_DIRS = {".git", "_audit", "__pycache__"}
BLOCKED_SUFFIXES = {".py", ".pyc", ".pyo", ".md"}
SECURITY_HEADERS = (
    ("X-Content-Type-Options", "nosniff"),
    ("X-Frame-Options", "SAMEORIGIN"),
    ("Referrer-Policy", "strict-origin-when-cross-origin"),
    ("Permissions-Policy", "camera=(), microphone=(), geolocation=()"),
)


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

    def end_headers(self):
        for key, value in SECURITY_HEADERS:
            self.send_header(key, value)
        super().end_headers()

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

    def redirect(self, location):
        self.send_response(HTTPStatus.MOVED_PERMANENTLY)
        self.send_header("Location", location)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def route_request(self):
        parsed = urlparse(self.path)
        raw = unquote(parsed.path)
        qs = f"?{parsed.query}" if parsed.query else ""

        if raw in ("/sitemap.xml", "sitemap.xml"):
            self.send_sitemap()
            return True

        if raw == "/index.html":
            self.redirect(f"/{qs}" if qs else "/")
            return True

        if raw.endswith(".html"):
            stem = raw[1:-5]
            if stem in PAGES:
                self.redirect(f"/{stem}/{qs}")
                return True
            if raw.endswith("/index.html"):
                folder = raw[1:-11].strip("/")
                if folder in PAGES:
                    self.redirect(f"/{folder}/{qs}")
                    return True

        stripped = raw.strip("/")
        if stripped in PAGES and not raw.endswith("/"):
            self.redirect(f"/{stripped}/{qs}")
            return True

        if stripped in PAGES and raw.endswith("/"):
            self.path = f"/{stripped}/index.html"
            if parsed.query:
                self.path += f"?{parsed.query}"
            return False

        if raw not in ("/", "") and raw.endswith("/"):
            self.send_error(HTTPStatus.NOT_FOUND, "Not Found")
            return True

        rel = Path(raw.lstrip("/").replace("\\", "/"))
        if rel.parts and is_blocked(rel):
            self.send_error(HTTPStatus.NOT_FOUND, "Not Found")
            return True
        return False

    def do_GET(self):
        if self.route_request():
            return
        return super().do_GET()

    def do_HEAD(self):
        if self.route_request():
            return
        return super().do_HEAD()

    def send_sitemap(self):
        host = self.headers.get("Host", "127.0.0.1:8000")
        scheme = "https" if "github.io" in host else "http"
        origin = f"{scheme}://{host}"
        pages = [
            ("/", "1.0", "weekly"),
            ("/disciplines/", "0.9", "monthly"),
            ("/planning/", "0.9", "weekly"),
            ("/clubs/", "0.8", "monthly"),
            ("/nos-clubs/", "0.7", "monthly"),
            ("/abonnements/", "0.9", "weekly"),
            ("/contact/", "0.8", "monthly"),
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
        raw = unquote(urlparse(self.path).path)
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
