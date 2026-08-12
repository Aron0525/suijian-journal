#!/usr/bin/env python3
"""Serve the local PWA and proxy OpenAI-compatible model requests on the same origin."""

from __future__ import annotations

import argparse
import json
import os
import ssl
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse, urlunparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
MAX_BODY_BYTES = 512_000
MODEL_TIMEOUT_SECONDS = 75
CHAT_COMPLETIONS_PATH = '/chat/completions'
DEFAULT_ALLOWED_AI_HOSTS = {'api.deepseek.com', 'api.openai.com'}


def allowed_ai_hosts() -> set[str]:
    configured = os.environ.get('AI_ALLOWED_HOSTS', '')
    return DEFAULT_ALLOWED_AI_HOSTS | {host.strip().lower() for host in configured.split(',') if host.strip()}


def normalize_chat_endpoint(raw_endpoint: str) -> str:
    """Allow providers' base URLs while always forwarding to Chat Completions."""
    parsed = urlparse(raw_endpoint.strip())
    path = parsed.path.rstrip('/')
    if not path.endswith(CHAT_COMPLETIONS_PATH):
        path = f'{path}{CHAT_COMPLETIONS_PATH}' if path else CHAT_COMPLETIONS_PATH
    return urlunparse(parsed._replace(path=path))


def is_allowed_model_endpoint(endpoint: str) -> bool:
    parsed = urlparse(endpoint)
    return parsed.scheme == 'https' and bool(parsed.hostname) and parsed.hostname.lower() in allowed_ai_hosts()


def model_ssl_context() -> ssl.SSLContext:
    """Allow an explicitly configured private CA without disabling TLS checks."""
    trusted_ca_file = os.environ.get('AI_TRUSTED_CA_FILE')
    return ssl.create_default_context(cafile=trusted_ca_file) if trusted_ca_file else ssl.create_default_context()


class JournalHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):  # noqa: N802
        if self.path != '/api/ai':
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        self.proxy_model_request()

    def end_headers(self):
        self.send_header(
            'Content-Security-Policy',
            "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; "
            "style-src 'self'; img-src 'self' data:; connect-src 'self' https://*.supabase.co https://aron0525.github.io; "
            "worker-src 'self'",
        )
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        super().end_headers()

    def do_OPTIONS(self):  # noqa: N802
        if self.path == '/api/ai':
            self.send_response(HTTPStatus.NO_CONTENT)
            self.send_header('Allow', 'POST, OPTIONS')
            self.end_headers()
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def proxy_model_request(self):
        raw_length = self.headers.get('Content-Length')
        try:
            content_length = int(raw_length or '0')
        except ValueError:
            self.write_json(HTTPStatus.BAD_REQUEST, {'error': {'message': 'Content-Length 无效'}})
            return
        if content_length <= 0 or content_length > MAX_BODY_BYTES:
            self.write_json(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {'error': {'message': '请求内容大小不符合要求'}})
            return

        try:
            payload = json.loads(self.rfile.read(content_length))
            config = payload['config']
            endpoint = config['endpoint'].strip()
            model = config['model'].strip()
            api_key = config['apiKey'].strip()
            system = payload['system'].strip()
            prompt = payload['prompt'].strip()
        except (KeyError, AttributeError, TypeError, json.JSONDecodeError):
            self.write_json(HTTPStatus.BAD_REQUEST, {'error': {'message': '模型请求参数不完整'}})
            return

        endpoint = normalize_chat_endpoint(endpoint)
        parsed = urlparse(endpoint)
        if (
            not is_allowed_model_endpoint(endpoint)
            or not model
            or not api_key
            or not system
            or not prompt
        ):
            self.write_json(HTTPStatus.BAD_REQUEST, {'error': {'message': '请检查 API 地址、模型名称、Key 和请求内容'}})
            return

        upstream_payload = json.dumps({
            'model': model,
            'temperature': 0.3,
            'messages': [
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': prompt},
            ],
        }).encode('utf-8')
        upstream_request = Request(
            endpoint,
            data=upstream_payload,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}',
                'User-Agent': 'suijian-local-pwa/1.0',
            },
            method='POST',
        )

        try:
            with urlopen(upstream_request, timeout=MODEL_TIMEOUT_SECONDS, context=model_ssl_context()) as response:
                self.forward_response(response.status, response.read(), response.headers.get_content_type())
        except HTTPError as error:
            self.forward_response(error.code, error.read(), error.headers.get_content_type() if error.headers else 'application/json')
        except URLError as error:
            self.write_json(HTTPStatus.BAD_GATEWAY, {'error': {'message': f'连接模型 API 失败：{error.reason}'}})
        except TimeoutError:
            self.write_json(HTTPStatus.GATEWAY_TIMEOUT, {'error': {'message': '模型 API 响应超时'}})

    def forward_response(self, status: int, body: bytes, content_type: str):
        self.send_response(status)
        self.send_header('Content-Type', content_type or 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def write_json(self, status: HTTPStatus, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)


def main():
    parser = argparse.ArgumentParser(description='岁笺本地 PWA 服务与模型代理')
    parser.add_argument('--host', default='127.0.0.1', help='默认只监听本机')
    parser.add_argument('--port', default=4173, type=int)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), JournalHandler)
    print(f'岁笺运行于 http://{args.host}:{args.port}')
    server.serve_forever()


if __name__ == '__main__':
    main()
