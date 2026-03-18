#!/bin/bash
cd "$(dirname "$0")"
echo "Starting YYClaw Gateway on :6700 and Admin on :6701..."
node --experimental-sqlite server.js &
echo $! > .pid-gateway
node --experimental-sqlite admin-server.js &
echo $! > .pid-admin
echo "✅ Gateway: http://localhost:6700"
echo "✅ Admin:   http://localhost:6701"
wait
