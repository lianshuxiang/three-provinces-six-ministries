#!/bin/bash

echo "🚀 测试御史台自动优化执行系统 v2.0..."
echo ""

cd /home/admin/.openclaw

# 运行自动批准模式（演示）
node run-system-auto-yushitai-v2.js "测试任务：验证自动优化执行能力" test high 5 auto-approve
