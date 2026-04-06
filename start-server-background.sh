#!/bin/bash
# 启动 HTTP 服务器
cd /home/admin/.openclaw/workspace
nohup node simple-server.js > /tmp/server.log 2>&1 &
echo $! > /tmp/server.pid
sleep 2
if ps -p $(cat /tmp/server.pid) > /dev/null 2>&1; then
    echo "✅ 服务器启动成功"
    echo "📍 PID: $(cat /tmp/server.pid)"
    echo "🌐 访问: http://120.77.80.229:3000"
    echo "📋 日志: /tmp/server.log"
else
    echo "❌ 服务器启动失败"
    cat /tmp/server.log
fi
