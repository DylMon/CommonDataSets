#!/usr/bin/env python3
"""Local static file server with correct MIME types (Windows' Python
http.server reads .js MIME type from the registry, which on this machine
returns text/plain — breaking ES module <script type="module" src="...">
per the HTML spec's strict MIME check. Real production hosting doesn't
have this problem; this override just makes local testing match it)."""
import http.server

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
})

http.server.test(HandlerClass=Handler, port=8000)
