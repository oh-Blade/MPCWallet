#!/bin/bash
# start.sh — 启动三个 MPC 参与方服务器

echo ""
echo "  ┌─────────────────────────────────────────────────┐"
echo "  │          MPC Wallet — 三方演示                   │"
echo "  │                                                  │"
echo "  │  方 1: http://localhost:3001                     │"
echo "  │  方 2: http://localhost:3002                     │"
echo "  │  方 3: http://localhost:3003                     │"
echo "  │                                                  │"
echo "  │  Ctrl+C 停止所有服务                              │"
echo "  └─────────────────────────────────────────────────┘"
echo ""

# Kill any existing processes on these ports
for port in 3001 3002 3003; do
  pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    kill $pid 2>/dev/null
    echo "  已停止旧进程 (port $port)"
  fi
done

sleep 0.5

# Start three party servers
node src/server.js 1 3001 &
PID1=$!
node src/server.js 2 3002 &
PID2=$!
node src/server.js 3 3003 &
PID3=$!

echo "  进程 PID: $PID1 $PID2 $PID3"
echo ""

# Cleanup on exit
trap "kill $PID1 $PID2 $PID3 2>/dev/null; echo '  已停止所有服务'" EXIT INT TERM

wait
