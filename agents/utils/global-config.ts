/**
 * 全局配置 - 最高权限规则 R000
 * 
 * 强制要求：所有模型调用必须使用 GLM-5
 * 此配置不可被覆盖
 */

export const GLOBAL_CONFIG = {
  // 最高权限规则 R000 - 模型配置
  MODEL: {
    // 允许的模型（只允许 GLM-5）
    ALLOWED_MODELS: ['glm-5'] as const,
    
    // 默认模型
    DEFAULT_MODEL: 'glm-5' as const,
    
    // 强制模式（不允许使用其他模型）
    STRICT_MODE: true,
    
    // 违规处理
    VIOLATION_ACTION: 'reject' as const,
    
    // 规则信息
    RULE: {
      ID: 'R000_SUPREME_MODEL',
      PRIORITY: 0,
      DESCRIPTION: '强制所有 agent 使用 GLM-5 模型',
      ENFORCED_AT: '2026-04-05T18:45:00+08:00',
      AUTHORITY: 'user_supreme'
    }
  },
  
  // 模型定价（仅 GLM-5）
  PRICING: {
    'glm-5': {
      input: 0.001,      // $/1K tokens
      output: 0.002,     // $/1K tokens
      cached: 0.0001     // $/1K tokens
    }
  },
  
  // 验证函数
  validateModel(model: string): void {
    if (!this.MODEL.ALLOWED_MODELS.includes(model as any)) {
      throw new Error(
        `🚫 违反最高权限规则 R000：禁止使用模型 "${model}"\n` +
        `✅ 只允许使用：${this.MODEL.ALLOWED_MODELS.join(', ')}\n` +
        `📋 规则详情：${this.MODEL.RULE.DESCRIPTION}\n` +
        `🕐 生效时间：${this.MODEL.RULE.ENFORCED_AT}`
      );
    }
  }
};

// 类型导出
export type AllowedModel = typeof GLOBAL_CONFIG.MODEL.ALLOWED_MODELS[number];

/**
 * 装饰器：强制验证模型
 */
export function ValidateModel(): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      // 检查参数中的模型
      for (const arg of args) {
        if (arg && typeof arg === 'object' && 'model' in arg) {
          GLOBAL_CONFIG.validateModel(arg.model);
        }
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}
