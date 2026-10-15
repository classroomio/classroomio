#!/usr/bin/env python3
"""Static server for the prototype that never caches, so edits show up on a normal reload.

Usage: python3 serve.py [port]   (default 8899)
"""
import os
import re
import sys
from urllib.parse import parse_qsl, urlencode, urlsplit
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


ROUTES = [
    (r'^/$', 'site.html', []),
    (r'^/org/[^/]+/dash$', 'dashboard.html', []),
    (r'^/org/[^/]+/setup$', 'setup.html', []),
    (r'^/org/[^/]+/courses$', 'courses.html', []),
    (r'^/org/[^/]+/courses/templates$', 'templates.html', []),
    (r'^/org/[^/]+/landingpage/edit$', 'landing-editor.html', []),
    (r'^/org/[^/]+/settings$', 'settings.html', []),
    (r'^/org/[^/]+/settings/org$', 'org-settings.html', []),
    (r'^/org/[^/]+/audience$', 'audience.html', []),
    (r'^/courses/([^/]+)/lessons/([^/]+)$', 'course.html', ['id', 'lesson']),
    (r'^/courses/([^/]+)/([^/]+)$', 'course.html', ['id', 'tab']),
    (r'^/courses$', 'public-courses.html', []),
    (r'^/course/([^/]+)/enroll$', 'enroll.html', ['course']),
    (r'^/course/([^/]+)/lesson/([^/]+)$', 'learn.html', ['course', 'item']),
    (r'^/course/([^/]+)$', 'public-course.html', ['course']),
]


class NoCache(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parts = urlsplit(path)
        for pattern, page, names in ROUTES:
            match = re.match(pattern, parts.path)
            if not match:
                continue
            extra = urlencode(list(zip(names, match.groups())))
            query = '&'.join(q for q in (extra, parts.query) if q)
            self.path = '/' + page + ('?' + query if query else '')
            return super().translate_path(self.path)
        resolved = super().translate_path(path)
        if not os.path.exists(resolved) and parts.path.count('/') > 1:
            for depth in range(1, parts.path.count('/')):
                tail = '/' + '/'.join(parts.path.split('/')[depth + 1:])
                candidate = super().translate_path(tail)
                if os.path.isfile(candidate):
                    return candidate
        return resolved

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8899
    ThreadingHTTPServer(('', port), NoCache).serve_forever()
