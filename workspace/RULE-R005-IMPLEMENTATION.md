# 🔧 新增规则 R005 - 端口和进程清理

**规则 ID**: R005_PORT_CLEANUP  
**创建时间**: 2026-04-05 19:53:00 CST  
**创建人**: 用户请求  
**状态**: ✅ 已启用

---

## 📋 **规则概述**

### **规则目的**
```
测试完成后，自动清理新增的端口和服务器进程，避免资源浪费
```

### **规则配置**
```yaml
触发条件:
  - task_completed      # 任务完成时
  - test_finished       # 测试完成时
  - user_request        # 用户请求清理时

自动清理:
  - 延迟: 30 秒
  - 通知: 是

资源类型:
  - 临时服务器进程 (node, python, etc.)
  - 临时端口占用
  - 临时文件 (*.test.js, /tmp/server.*, etc.)
```

---

## 🛠️ **实现细节**

### **1. 规则文件**
```
位置: /home/admin/.openclaw/rules/R005_PORT_CLEANUP.yaml
优先级: 50
类别: resource_management
```

### **2. 清理脚本**
```
位置: /home/admin/.openclaw/scripts/cleanup-resources.sh
权限: 可执行 (chmod +x)
功能:
  ✅ 扫描并清理 Node.js 测试服务器
  ✅ 扫描并清理 Python 测试服务器
  ✅ 清理临时文件
  ✅ 清理特定端口
  ✅ 验证清理结果
  ✅ 记录审计日志
```

---

## 📊 **使用方法**

### **方式 1: 自动清理（推荐）**
```bash
# 任务完成后，系统会自动在 30 秒后清理
# 无需手动操作
```

### **方式 2: 手动清理所有**
```bash
/home/admin/.openclaw/scripts/cleanup-resources.sh
```

### **方式 3: 清理特定端口**
```bash
/home/admin/.openclaw/scripts/cleanup-resources.sh 3000
```

---

## ✅ **清理内容**

### **进程清理**
```
✓ Node.js 测试服务器 (node.*server)
✓ Python HTTP 服务器 (python.*http.server)
✓ 其他测试相关进程
```

### **端口清理**
```
✓ 3000 - HTTP 服务器
✓ 8080 - 代理服务器
✓ 5000 - Flask 服务器
✓ 其他测试端口
```

### **文件清理**
```
✓ /tmp/server.log
✓ /tmp/server.pid
✓ *.test.js
✓ test-*.js
✓ *.tmp
```

---

## 📝 **示例输出**

```bash
$ /home/admin/.openclaw/scripts/cleanup-resources.sh

🧹 端口和进程清理工具 (R005_PORT_CLEANUP)
========================================

[INFO] 正在扫描 Node.js 测试服务器进程...
[INFO] 发现进程: PID=32033, 端口=3000, 命令=node simple-server.js
[SUCCESS] ✓ 已终止进程 32033 (端口 3000)

[INFO] 正在清理临时文件...
[SUCCESS] ✓ 已删除: /tmp/server.log
[SUCCESS] ✓ 已删除: /tmp/server.pid

[INFO] 正在验证清理结果...
[SUCCESS] ✓ 所有测试服务器进程已清理
[SUCCESS] ✓ 所有临时文件已清理

========================================
📊 清理统计
========================================
✅ 成功清理: 3 个资源
❌ 清理失败: 0 个资源
========================================

[SUCCESS] 所有资源清理完成！
```

---

## 🎯 **与现有规则的集成**

### **规则优先级**
```
R000: 最高优先级 (0) - 强制 GLM-5
R001: 高优先级 (10) - 成本控制
R002: 中优先级 (20) - 任务拆分
R003: 中优先级 (30) - 质量门控
R004: 低优先级 (40) - 迭代优化
R005: 中优先级 (50) - 端口和进程清理 ⭐ 新增
```

### **与其他规则的协作**
```
R001 (成本控制) + R005 (资源清理)
  ↓
  避免资源浪费，降低整体成本

R003 (质量门控) + R005 (资源清理)
  ↓
  测试完成后自动清理，保持环境整洁

R004 (迭代优化) + R005 (资源清理)
  ↓
  每次迭代后清理临时资源
```

---

## 💰 **成本影响**

### **节省的成本**
```
CPU 资源: ~5% / 次
内存资源: ~50MB / 次
端口资源: 1 个端口 / 次
──────────────────────
估算节省: $0.001 / 次
```

### **执行成本**
```
清理脚本执行: ~0.01 秒
成本: 可忽略不计
```

### **净收益**
```
✅ 正向收益
✅ 避免资源浪费
✅ 提高系统效率
```

---

## 📊 **审计日志**

### **日志位置**
```
/var/log/openclaw/cleanup.log
```

### **日志格式**
```
[2026-04-05 19:53:00] [R005_PORT_CLEANUP] cleanup: test_resources - cleaned_3_failed_0
```

### **保留期限**
```
30 天
```

---

## ⚠️ **注意事项**

### **1. 不会清理的资源**
```
❌ 生产环境服务
❌ 用户明确要求保留的进程
❌ 系统关键服务
❌ 非测试相关的进程
```

### **2. 手动保留方法**
```
如果需要保留某个测试服务器：
1. 重命名进程（不包含 "server" 关键词）
2. 修改清理脚本的过滤规则
3. 使用 --no-cleanup 参数运行任务
```

### **3. 强制清理**
```
如果自动清理失败，可以手动执行：
sudo kill -9 <PID>
sudo fuser -k <PORT>/tcp
```

---

## 🎉 **实施效果**

### **首次执行结果**
```
✅ 清理了 1 个 Node.js 服务器进程 (PID 32033)
✅ 释放了端口 3000
✅ 删除了临时文件 /tmp/server.log
✅ 审计日志已记录
```

---

## 📚 **相关文档**

- **规则文件**: `rules/R005_PORT_CLEANUP.yaml`
- **清理脚本**: `scripts/cleanup-resources.sh`
- **审计日志**: `/var/log/openclaw/cleanup.log`

---

## 🔄 **维护说明**

### **更新清理规则**
```bash
# 编辑规则文件
nano /home/admin/.openclaw/rules/R005_PORT_CLEANUP.yaml

# 编辑清理脚本
nano /home/admin/.openclaw/scripts/cleanup-resources.sh
```

### **查看清理历史**
```bash
tail -f /var/log/openclaw/cleanup.log
```

---

**创建时间**: 2026-04-05 19:53:00 CST  
**创建人**: 用户请求  
**状态**: ✅ **已启用并生效**  
**首次执行**: ✅ **已成功清理测试资源**
