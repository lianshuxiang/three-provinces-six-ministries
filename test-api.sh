#!/bin/bash

###############################################################################
# 待办事项 REST API 测试脚本
# 测试所有 CRUD 操作
###############################################################################

API_URL="http://localhost:3000"
API_KEY="your-api-key-here"

echo "🧪 待办事项 REST API 测试"
echo "=========================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
PASS_COUNT=0
FAIL_COUNT=0

# 测试函数
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    
    echo -n "测试 $method $endpoint ... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "${API_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $API_KEY")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "${API_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $API_KEY" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ 通过${NC} (HTTP $http_code)"
        ((PASS_COUNT++))
    else
        echo -e "${RED}✗ 失败${NC} (期望 $expected_status, 实际 $http_code)"
        echo "   响应: $body"
        ((FAIL_COUNT++))
    fi
}

# 等待服务器启动
echo "等待 API 服务器启动..."
sleep 3
echo ""

# 测试 1: 健康检查
echo "1️⃣ 测试健康检查端点"
test_api "GET" "/health" "" 200
echo ""

# 测试 2: 获取空的待办列表
echo "2️⃣ 测试获取空待办列表"
test_api "GET" "/todos" "" 200
echo ""

# 测试 3: 创建第一个待办
echo "3️⃣ 测试创建待办事项"
test_api "POST" "/todos" '{"title":"学习三省六部系统"}' 201
echo ""

# 测试 4: 创建第二个待办
echo "4️⃣ 测试创建第二个待办"
test_api "POST" "/todos" '{"title":"测试 REST API"}' 201
echo ""

# 测试 5: 获取所有待办
echo "5️⃣ 测试获取所有待办"
test_api "GET" "/todos" "" 200
echo ""

# 测试 6: 获取单个待办
echo "6️⃣ 测试获取单个待办"
test_api "GET" "/todos/1" "" 200
echo ""

# 测试 7: 更新待办
echo "7️⃣ 测试更新待办"
test_api "PUT" "/todos/1" '{"title":"学习三省六部系统（已更新）","completed":true}' 200
echo ""

# 测试 8: 删除待办
echo "8️⃣ 测试删除待办"
test_api "DELETE" "/todos/2" "" 200
echo ""

# 测试 9: 获取不存在的待办
echo "9️⃣ 测试获取不存在的待办"
test_api "GET" "/todos/999" "" 404
echo ""

# 测试 10: 创建空标题的待办（应该失败）
echo "🔟 测试输入验证"
test_api "POST" "/todos" '{"title":""}' 400
echo ""

# 显示统计
echo "======================================"
echo "📊 测试统计"
echo "======================================"
echo -e "✅ 通过: ${GREEN}${PASS_COUNT}${NC}"
echo -e "❌ 失败: ${RED}${FAIL_COUNT}${NC}"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  有 ${FAIL_COUNT} 个测试失败${NC}"
    exit 1
fi
