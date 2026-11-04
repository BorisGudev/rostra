#!/bin/sh
# Rebuild and wrap rostra.html in the same skeleton the publisher adds. Output: .preview/index.html
cd "$(dirname "$0")" && python3 build.py >/dev/null && mkdir -p .preview && {
  printf '<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%%}[hidden]{display:none!important}</style></head><body>'
  cat rostra.html
  printf '</body></html>'
} > .preview/index.html && echo "preview ready: $(wc -c < .preview/index.html) bytes"
