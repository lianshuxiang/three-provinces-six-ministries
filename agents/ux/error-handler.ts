/**
 * 友好错误提示
 * 
 * 职责：
 * 1. 错误分类
 * 2. 友好错误消息生成
 * 3. 修复建议
 * 4. 用户引导
 */

import type { ExecutionRecord, EdictTask } from '../types';

export type ErrorType = 
  | 'technical' 
  | 'security' 
  | 'permission' 
  | 'resource' 
  | 'budget'
  | 'validation'
  | 'network'
  | 'timeout'
  | 'unknown';

export interface FriendlyError {
  type: ErrorType;
  title: string;
  emoji: string;
  message: string;
  details: string[];
  suggestions: string[];
  actions: ErrorAction[];
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorAction {
  label: string;
  description: string;
  command?: string;
  auto?: boolean;
}

export class ErrorHandler {
  /**
   * 处理错误
   */
  handleError(
    error: Error,
    context?: {
      task?: EdictTask;
      record?: ExecutionRecord;
      stage?: string;
    }
  ): FriendlyError {
    // 分类错误
    const errorType = this.classifyError(error);
    
    // 生成友好错误
    return this.generateFriendlyError(error, errorType, context);
  }
  
  /**
   * 分类错误
   */
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    // 技术错误
    if (message.includes('syntax') || 
        message.includes('type') ||
        message.includes('undefined')) {
      return 'technical';
    }
    
    // 安全错误
    if (message.includes('security') ||
        message.includes('injection') ||
        message.includes('xss')) {
      return 'security';
    }
    
    // 权限错误
    if (message.includes('permission') ||
        message.includes('unauthorized') ||
        message.includes('forbidden')) {
      return 'permission';
    }
    
    // 资源错误
    if (message.includes('memory') ||
        message.includes('resource') ||
        message.includes('limit')) {
      return 'resource';
    }
    
    // 预算错误
    if (message.includes('budget') ||
        message.includes('cost') ||
        message.includes('expensive')) {
      return 'budget';
    }
    
    // 验证错误
    if (message.includes('validation') ||
        message.includes('invalid') ||
        message.includes('failed')) {
      return 'validation';
    }
    
    // 网络错误
    if (message.includes('network') ||
        message.includes('connection') ||
        message.includes('econnrefused')) {
      return 'network';
    }
    
    // 超时错误
    if (message.includes('timeout') ||
        message.includes('timed out')) {
      return 'timeout';
    }
    
    return 'unknown';
  }
  
  /**
   * 生成友好错误
   */
  private generateFriendlyError(
    error: Error,
    type: ErrorType,
    context?: any
  ): FriendlyError {
    const templates: Record<ErrorType, () => FriendlyError> = {
      technical: () => ({
        type: 'technical',
        title: '技术错误',
        emoji: '🔧',
        message: '代码执行过程中遇到了技术问题',
        details: [
          `错误类型: ${error.name}`,
          `错误信息: ${error.message}`,
        ],
        suggestions: [
          '检查代码语法',
          '查看详细错误日志',
          '尝试简化任务',
        ],
        actions: [
          { label: '查看详情', description: '查看完整的错误信息', auto: false },
          { label: '重试', description: '重新执行该任务', auto: true },
        ],
        retryable: true,
        severity: 'medium',
      }),
      
      security: () => ({
        type: 'security',
        title: '安全检查失败',
        emoji: '🛡️',
        message: '检测到潜在的安全风险',
        details: [
          '安全检查未通过',
          '可能存在代码注入或敏感数据泄露风险',
        ],
        suggestions: [
          '检查代码是否包含恶意内容',
          '避免使用动态生成的代码',
          '审查敏感数据处理逻辑',
        ],
        actions: [
          { label: '查看风险', description: '查看详细的安全报告', auto: false },
          { label: '修改代码', description: '手动修改代码以通过安全检查', auto: false },
        ],
        retryable: false,
        severity: 'critical',
      }),
      
      permission: () => ({
        type: 'permission',
        title: '权限不足',
        emoji: '🔒',
        message: '当前操作需要更高的权限',
        details: [
          '权限验证失败',
          '当前用户权限不足以执行此操作',
        ],
        suggestions: [
          '联系管理员获取权限',
          '使用预览模式查看操作',
          '调整任务范围',
        ],
        actions: [
          { label: '联系管理员', description: '请求权限提升', auto: false },
          { label: '预览模式', description: '在预览模式下查看操作', auto: false },
        ],
        retryable: false,
        severity: 'high',
      }),
      
      resource: () => ({
        type: 'resource',
        title: '资源不足',
        emoji: '💾',
        message: '系统资源不足以完成当前任务',
        details: [
          '内存或文件句柄不足',
          '可能需要释放部分资源',
        ],
        suggestions: [
          '关闭不必要的程序',
          '简化任务复杂度',
          '等待系统释放资源',
        ],
        actions: [
          { label: '重试', description: '等待后重试', auto: true },
          { label: '简化', description: '降低任务复杂度', auto: false },
        ],
        retryable: true,
        severity: 'medium',
      }),
      
      budget: () => ({
        type: 'budget',
        title: '预算超支',
        emoji: '💰',
        message: '任务成本超出预算限制',
        details: [
          '当前任务成本过高',
          '建议优化任务以降低成本',
        ],
        suggestions: [
          '简化任务拆分',
          '使用更便宜的模型（GLM-4.7）',
          '减少迭代次数',
        ],
        actions: [
          { label: '优化', description: '自动优化任务计划', auto: true },
          { label: '调整预算', description: '提高预算上限', auto: false },
        ],
        retryable: true,
        severity: 'medium',
      }),
      
      validation: () => ({
        type: 'validation',
        title: '验证失败',
        emoji: '✅',
        message: '任务结果未通过验证检查',
        details: [
          '测试未通过',
          '代码质量检查失败',
        ],
        suggestions: [
          '查看失败原因',
          '修复错误后重试',
          '调整测试标准',
        ],
        actions: [
          { label: '查看详情', description: '查看验证报告', auto: false },
          { label: '自动修复', description: '尝试自动修复问题', auto: true },
        ],
        retryable: true,
        severity: 'medium',
      }),
      
      network: () => ({
        type: 'network',
        title: '网络错误',
        emoji: '🌐',
        message: '网络连接出现问题',
        details: [
          '无法连接到服务器',
          '请检查网络连接',
        ],
        suggestions: [
          '检查网络连接',
          '稍后重试',
          '检查 API 配置',
        ],
        actions: [
          { label: '重试', description: '重新尝试连接', auto: true },
        ],
        retryable: true,
        severity: 'medium',
      }),
      
      timeout: () => ({
        type: 'timeout',
        title: '执行超时',
        emoji: '⏱️',
        message: '任务执行时间超过限制',
        details: [
          '任务运行时间过长',
          '可能存在性能问题',
        ],
        suggestions: [
          '简化任务复杂度',
          '增加超时时间',
          '检查是否有死循环',
        ],
        actions: [
          { label: '重试', description: '重新执行任务', auto: true },
          { label: '调整超时', description: '增加超时限制', auto: false },
        ],
        retryable: true,
        severity: 'medium',
      }),
      
      unknown: () => ({
        type: 'unknown',
        title: '未知错误',
        emoji: '❓',
        message: '遇到了未知的问题',
        details: [
          `错误: ${error.message}`,
        ],
        suggestions: [
          '查看详细日志',
          '联系技术支持',
          '尝试重新执行',
        ],
        actions: [
          { label: '查看日志', description: '查看详细错误日志', auto: false },
          { label: '重试', description: '重新执行任务', auto: true },
        ],
        retryable: true,
        severity: 'low',
      }),
    };
    
    return templates[type]();
  }
  
  /**
   * 生成用户友好的错误消息
   */
  generateUserMessage(error: FriendlyError): string {
    const lines = [
      `${error.emoji} ${error.title}`,
      ``,
      error.message,
      ``,
    ];
    
    if (error.details.length > 0) {
      lines.push(`**详情**:`);
      error.details.forEach(detail => {
        lines.push(`  • ${detail}`);
      });
      lines.push(``);
    }
    
    if (error.suggestions.length > 0) {
      lines.push(`**建议**:`);
      error.suggestions.forEach((suggestion, i) => {
        lines.push(`  ${i + 1}. ${suggestion}`);
      });
      lines.push(``);
    }
    
    if (error.actions.length > 0) {
      lines.push(`**可选操作**:`);
      error.actions.forEach((action, i) => {
        const autoText = action.auto ? ' (自动)' : '';
        lines.push(`  ${i + 1}. ${action.label}${autoText}: ${action.description}`);
      });
    }
    
    return lines.join(`\n`);
  }
  
  /**
   * 生成简短的错误消息
   */
  generateBriefMessage(error: FriendlyError): string {
    return `${error.emoji} ${error.title}: ${error.message}`;
  }
  
  /**
   * 检查错误是否可重试
   */
  isRetryable(error: Error): boolean {
    const friendlyError = this.handleError(error);
    return friendlyError.retryable;
  }
  
  /**
   * 获取错误严重性
   */
  getSeverity(error: Error): FriendlyError['severity'] {
    const friendlyError = this.handleError(error);
    return friendlyError.severity;
  }
}

// 导出单例
export const errorHandler = new ErrorHandler();
