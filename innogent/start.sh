#!/bin/bash
# Start Innogent (chat-first UI in front of the live Dify backend).
# Dify must already be running (docker compose up -d in ../docker).
cd "$(dirname "$0")"
echo "Starting Innogent on http://localhost:8800 ..."
exec python3 server.py
