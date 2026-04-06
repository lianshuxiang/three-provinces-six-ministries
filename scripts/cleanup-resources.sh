#!/bin/bash

###############################################################################
# 端口和进程清理脚本
# 规则: R005_PORT_CLEANUP
# 用途: 清理测试完成后遗留的服务器进程和端口
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 统计变量
CLEANED_COUNT=0
FAILED_COUNT=0

###############################################################################
# 1. 清理 Node.js 测试服务器进程
###############################################################################
cleanup_node_servers() {
    log_info "正在扫描 Node.js 测试服务器进程..."
    
    # 查找所有 node 进程
    local node_pids=$(ps aux | grep "node.*server" | grep -v grep | awk '{print $2}')
    
    if [ -z "$node_pids" ]; then
        log_info "没有发现运行中的 Node.js 服务器进程"
        return 0
    fi
    
    for pid in $node_pids; do
        local cmd=$(ps -p $pid -o command= | head -1)
        local port=$(netstat -tlnp 2>/dev/null | grep $pid | awk '{print $4}' | grep -oE '[0-9]+$' | head -1)
        
        log_info "发现进程: PID=$pid, 端口=$port, 命令=$cmd"
        
        # 优雅终止
        if kill $pid 2>/dev/null; then
            sleep 2
            
            # 检查是否还在运行
            if ps -p $pid > /dev/null 2>&1; then
                log_warning "进程 $pid 未响应，强制终止..."
                kill -9 $pid 2>/dev/null || true
            fi
            
            log_success "✓ 已终止进程 $pid (端口 $port)"
            ((CLEANED_COUNT++))
        else
            log_error "✗ 无法终止进程 $pid"
            ((FAILED_COUNT++))
        fi
    done
}

###############################################################################
# 2. 清理 Python 测试服务器进程
###############################################################################
cleanup_python_servers() {
    log_info "正在扫描 Python 测试服务器进程..."
    
    # 查找 Python HTTP 服务器
    local python_pids=$(ps aux | grep -E "python.*http\.server|python.*SimpleHTTPServer" | grep -v grep | awk '{print $2}')
    
    if [ -z "$python_pids" ]; then
        log_info "没有发现运行中的 Python 服务器进程"
        return 0
    fi
    
    for pid in $python_pids; do
        local cmd=$(ps -p $pid -o command= | head -1)
        local port=$(netstat -tlnp 2>/dev/null | grep $pid | awk '{print $4}' | grep -oE '[0-9]+$' | head -1)
        
        log_info "发现进程: PID=$pid, 端口=$port, 命令=$cmd"
        
        if kill $pid 2>/dev/null; then
            sleep 1
            log_success "✓ 已终止进程 $pid (端口 $port)"
            ((CLEANED_COUNT++))
        else
            log_error "✗ 无法终止进程 $pid"
            ((FAILED_COUNT++))
        fi
    done
}

###############################################################################
# 3. 清理临时文件
###############################################################################
cleanup_temp_files() {
    log_info "正在清理临时文件..."
    
    # 临时文件列表
    local temp_files=(
        "/tmp/server.log"
        "/tmp/server.pid"
        "/tmp/*.test.log"
        "/tmp/test-*.out"
    )
    
    for pattern in "${temp_files[@]}"; do
        local files=$(ls $pattern 2>/dev/null || true)
        
        if [ -n "$files" ]; then
            for file in $files; do
                if rm -f "$file"; then
                    log_success "✓ 已删除: $file"
                    ((CLEANED_COUNT++))
                else
                    log_error "✗ 无法删除: $file"
                    ((FAILED_COUNT++))
                fi
            done
        fi
    done
}

###############################################################################
# 4. 清理特定端口
###############################################################################
cleanup_specific_port() {
    local port=$1
    
    log_info "正在清理端口 $port..."
    
    # 查找占用该端口的进程
    local pid=$(sudo lsof -ti:$port 2>/dev/null || true)
    
    if [ -z "$pid" ]; then
        log_info "端口 $port 未被占用"
        return 0
    fi
    
    log_info "发现进程 $pid 占用端口 $port"
    
    # 终止进程
    if kill $pid 2>/dev/null; then
        sleep 2
        
        # 检查是否还在运行
        if ps -p $pid > /dev/null 2>&1; then
            log_warning "进程 $pid 未响应，强制终止..."
            kill -9 $pid 2>/dev/null || true
        fi
        
        log_success "✓ 已终止进程 $pid 并释放端口 $port"
        ((CLEANED_COUNT++))
    else
        log_error "✗ 无法终止进程 $pid"
        ((FAILED_COUNT++))
    fi
}

###############################################################################
# 5. 验证清理结果
###############################################################################
verify_cleanup() {
    log_info "正在验证清理结果..."
    
    local remaining=$(ps aux | grep -E "node.*server|python.*http\.server" | grep -v grep | wc -l)
    
    if [ "$remaining" -eq 0 ]; then
        log_success "✓ 所有测试服务器进程已清理"
    else
        log_warning "⚠ 仍有 $remaining 个测试服务器进程在运行"
    fi
    
    # 检查临时文件
    local temp_remaining=$(ls /tmp/server.log /tmp/server.pid 2>/dev/null | wc -l)
    
    if [ "$temp_remaining" -eq 0 ]; then
        log_success "✓ 所有临时文件已清理"
    else
        log_warning "⚠ 仍有 $temp_remaining 个临时文件未清理"
    fi
}

###############################################################################
# 6. 显示统计信息
###############################################################################
show_summary() {
    echo ""
    echo "========================================"
    echo "📊 清理统计"
    echo "========================================"
    echo -e "✅ 成功清理: ${GREEN}${CLEANED_COUNT}${NC} 个资源"
    echo -e "❌ 清理失败: ${RED}${FAILED_COUNT}${NC} 个资源"
    echo "========================================"
    echo ""
    
    if [ "$FAILED_COUNT" -gt 0 ]; then
        log_warning "部分资源清理失败，可能需要手动处理"
        return 1
    else
        log_success "所有资源清理完成！"
        return 0
    fi
}

###############################################################################
# 7. 记录审计日志
###############################################################################
audit_log() {
    local action=$1
    local resource=$2
    local result=$3
    
    local log_dir="/var/log/openclaw"
    local log_file="$log_dir/cleanup.log"
    
    # 创建日志目录
    sudo mkdir -p "$log_dir" 2>/dev/null || true
    
    # 写入日志
    if [ -d "$log_dir" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] [R005_PORT_CLEANUP] $action: $resource - $result" | sudo tee -a "$log_file" > /dev/null
    fi
}

###############################################################################
# 主函数
###############################################################################
main() {
    echo ""
    echo "🧹 端口和进程清理工具 (R005_PORT_CLEANUP)"
    echo "========================================"
    echo ""
    
    # 检查是否指定了特定端口
    if [ -n "$1" ]; then
        cleanup_specific_port "$1"
    else
        # 清理所有测试服务器
        cleanup_node_servers
        cleanup_python_servers
        
        # 清理临时文件
        cleanup_temp_files
    fi
    
    # 验证清理结果
    verify_cleanup
    
    # 显示统计
    show_summary
    
    # 记录审计日志
    audit_log "cleanup_all" "test_resources" "cleaned_$CLEANED_COUNT_failed_$FAILED_COUNT"
}

# 运行主函数
main "$@"
