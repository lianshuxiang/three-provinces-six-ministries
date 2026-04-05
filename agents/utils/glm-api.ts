/**
 * GLM API 调用工具
 * 封装智谱 AI 的 API 调用
 */

import type { Ministry } from '../types';
import { GLOBAL_CONFIG } from './global-config';

export interface GLMCallOptions {
  model?: 'glm-5'; // 最高权限规则 R000：只允许 GLM-5
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface GLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
}

// GLM 定价（每 1K tokens，单位：美元）
// 最高权限规则 R000：只保留 GLM-5
const GLM_PRICING = {
  'glm-5': { input: 0.001, output: 0.002, cached: 0.0001 }
};

export class GLMAPICaller {
  private apiKey: string;
  private baseUrl: string = 'https://open.bigmodel.cn/api/paas/v4';

  constructor() {
    this.apiKey = process.env.GLM_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GLM_API_KEY not found in environment variables');
    }
  }

  /**
   * 调用 GLM API
   */
  async call(
    prompt: string,
    options: GLMCallOptions = {}
  ): Promise<GLMResponse> {
    const {
      model = 'glm-5',
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt
    } = options;

    // 最高权限规则 R000：验证模型
    GLOBAL_CONFIG.validateModel(model);

    const messages: any[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GLM API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      const usage = {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      };

      const cost = this.calculateCost(model, usage);

      return {
        content: data.choices[0].message.content,
        usage,
        cost
      };

    } catch (error: any) {
      throw new Error(`Failed to call GLM API: ${error.message}`);
    }
  }

  /**
   * 调用并解析 JSON 响应
   */
  async callForJSON<T>(
    prompt: string,
    options: GLMCallOptions = {}
  ): Promise<T> {
    const systemPrompt = options.systemPrompt || 
      'You are a helpful assistant. Always respond with valid JSON. Do not include any text outside the JSON object.';
    
    const response = await this.call(prompt, {
      ...options,
      systemPrompt
    });

    try {
      // 提取 JSON（处理可能的 markdown 代码块）
      let jsonStr = response.content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      
      return JSON.parse(jsonStr.trim());
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${response.content}`);
    }
  }

  /**
   * 计算成本
   */
  private calculateCost(
    model: keyof typeof GLM_PRICING,
    usage: { promptTokens: number; completionTokens: number }
  ): number {
    const pricing = GLM_PRICING[model];
    const inputCost = (usage.promptTokens / 1000) * pricing.input;
    const outputCost = (usage.completionTokens / 1000) * pricing.output;
    return inputCost + outputCost;
  }

  /**
   * 快速调用（使用 GLM-5）
   */
  async quickCall(prompt: string): Promise<string> {
    const response = await this.call(prompt, {
      model: 'glm-5',
      maxTokens: 1000
    });
    return response.content;
  }

  /**
   * 高质量调用（使用 GLM-5）
   */
  async qualityCall(prompt: string, systemPrompt?: string): Promise<string> {
    const response = await this.call(prompt, {
      model: 'glm-5',
      maxTokens: 3000,
      systemPrompt
    });
    return response.content;
  }

  /**
   * 获取模型推荐（基于任务类型）
   * 最高权限规则 R000：所有部门强制使用 GLM-5
   */
  static getRecommendedModel(ministry: Ministry): 'glm-5' {
    // 最高权限规则 R000：强制所有 agent 使用 GLM-5
    return 'glm-5';
  }
}
