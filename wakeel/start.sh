#!/bin/bash
# Wakeel (وكيل) — start the platform server (Dify must be running: docker compose up -d in ../docker)
cd "$(dirname "$0")"
echo "Wakeel starting — open http://localhost/ (single URL, served via nginx)"
exec python3 server.py
