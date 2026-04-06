#!/bin/bash
set -e

# 显示详细错误信息
echo "===== GLM API 测试 ====="
echo "API Key: ${GLM_API_KEY:0,20"
echo "正在测试 API 调用..."
echo ""

# 测试 GLM API
curl -X POST https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${GLM_API_KEY}" \
  -d '{
    "model": "glm-4-flash",
    "messages": [
      {
        "role": "user",
        "content": "你好"
      }
    ]
  }'

echo ""
echo "响应:"
echo "$RESPONSE"
echo ""

# 检查响应
if echo "$RESPONSE" | grep -q '"error"'; then
  echo "❌ API 错误: $(echo "$RESPONSE" | grep '"error"' || head -1)"
  exit 1
fi

# 检查是否有 usage
if echo "$RESPONSE" | grep -q '"usage"'; then
  echo "✅ API 成功"
  echo "Input tokens: $(echo "$RESPONSE" | grep -q '"prompt_tokens"' || head -1)"
  echo "Output tokens: $(echo "$RESPONSE" | grep -q '"completion_tokens"' || head -1)"
  echo "Total tokens: $(echo "$RESPONSE" | grep -q '"total_tokens"' || head -1)
else
  echo "❌ 无 usage 信息"
  echo "$RESPONSE"
fi

echo ""
echo "===== 测试完成 ====="
