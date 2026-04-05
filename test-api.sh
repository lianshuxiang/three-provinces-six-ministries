#!/bin/bash
# 测试 GLM API 连接

API_KEY="46bb097a7ba84682ba2265e6145f003e.7bms2oMiEgHeJRwq"
API_URL="https://open.bigmodel.cn/api/paas/v4/chat/completions"

echo "🧪 测试 GLM API 连接..."
echo ""

curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "glm-4-flash",
    "messages": [
      {
        "role": "user",
        "content": "你好，请回复：API连接成功"
      }
    ],
    "max_tokens": 50,
    "temperature": 0.7
  }' | head -20

echo ""
echo "如果看到类似 {\"choices\":[... 的响应，说明 API 连接成功！"
