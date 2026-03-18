#!/bin/bash
cd "$(dirname "$0")"
[ -f .pid-gateway ] && kill $(cat .pid-gateway) 2>/dev/null && rm .pid-gateway
[ -f .pid-admin ] && kill $(cat .pid-admin) 2>/dev/null && rm .pid-admin
echo "YYClaw stopped."
