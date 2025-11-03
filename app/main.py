from starlette.types import ASGIApp

from api.http import http_api

http_api_app: ASGIApp = http_api
