#!/usr/bin/env python3
"""Local HTTPS-only OpenAI-compatible provider used by browser acceptance tests."""

import argparse
import json
import ssl
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class MockAiHandler(BaseHTTPRequestHandler):
    def do_POST(self):  # noqa: N802
        if self.path != '/chat/completions':
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        length = int(self.headers.get('Content-Length', '0'))
        body = json.loads(self.rfile.read(length or 0) or '{}')
        messages = body.get('messages', [])
        user_prompt = next((item.get('content', '') for item in messages if item.get('role') == 'user'), '')
        content = '模拟 AI 整理结果' if '整理' in user_prompt else '模拟 AI 汇总结果'
        response = json.dumps({'choices': [{'message': {'content': content}}]}, ensure_ascii=False).encode('utf-8')
        self.send_response(HTTPStatus.OK)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(response)))
        self.end_headers()
        self.wfile.write(response)

    def log_message(self, format, *args):  # noqa: A003
        return


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, required=True)
    parser.add_argument('--cert', required=True)
    parser.add_argument('--key', required=True)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), MockAiHandler)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(args.cert, args.key)
    server.socket = context.wrap_socket(server.socket, server_side=True)
    server.serve_forever()


if __name__ == '__main__':
    main()
