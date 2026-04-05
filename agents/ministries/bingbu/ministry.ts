/**
 * 兵部 - 安全防御部
 * 
 * 职责：
 * 1. 安全检查（代码审计）
 * 2. 权限验证
 * 3. 漏洞扫描
 * 4. 敏感数据保护
 * 5. 安全策略执行
 * 
 * 模型：GLM-5（强推理，安全关键）
 */

import type {
  EdictTask,
  ExecutionIteration,
  SharedContext,
  SecurityCheck,
  ValidationResult,
} from '../../types';

export class BingbuMinistry {
  private model: "glm-5" = "glm-5";
  
  /**
   * 执行安全检查任务
   */
  async executeTask(
    task: EdictTask,
    context: SharedContext
  ): Promise<ExecutionIteration[]> {
    const iterations: ExecutionIteration[] = [];
    const timestamp = new Date().toISOString();
    
    // 1. 执行安全检查
    const securityChecks = await this.performSecurityChecks(task, context);
    
    // 2. 生成报告
    const report = this.generateSecurityReport(securityChecks);
    
    // 3. 返回迭代记录
    iterations.push({
      round: 1,
      agent: "security",
      model: this.model,
      action: `安全检查: ${task.description}`,
      result: report.passed ? "success" : "failure",
      output: {
        checks: securityChecks,
        report,
      },
      timestamp,
    });
    
    return iterations;
  }
  
  /**
   * 执行安全检查
   */
  async performSecurityChecks(
    task: EdictTask,
    context: SharedContext
  ): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];
    
    // 1. 代码注入检查
    checks.push(await this.checkCodeInjection(task));
    
    // 2. 权限检查
    checks.push(await this.checkPermissions(task, context));
    
    // 3. 敏感数据检查
    checks.push(await this.checkSensitiveData(task));
    
    // 4. 依赖安全检查
    checks.push(await this.checkDependencySecurity(task));
    
    // 5. 配置安全检查
    checks.push(await this.checkConfigurationSecurity(task));
    
    return checks;
  }
  
  /**
   * 检查代码注入
   */
  private async checkCodeInjection(task: EdictTask): Promise<SecurityCheck> {
    const description = task.description.toLowerCase();
    const issues: string[] = [];
    
    // 检查危险模式
    const dangerousPatterns = [
      { pattern: /eval\s*\(/, risk: "eval() 使用可能导致代码注入" },
      { pattern: /Function\s*\(/, risk: "Function() 动态代码执行" },
      { pattern: /exec\s*\(/, risk: "exec() 命令执行" },
      { pattern: /child_process/, risk: "子进程创建" },
    ];
    
    for (const { pattern, risk } of dangerousPatterns) {
      if (pattern.test(description)) {
        issues.push(risk);
      }
    }
    
    return {
      name: "代码注入检查",
      passed: issues.length === 0,
      severity: issues.length > 0 ? "high" : "low",
      issues,
      recommendations: issues.length > 0 
        ? ["避免使用动态代码执行", "使用白名单验证输入"]
        : [],
    };
  }
  
  /**
   * 检查权限
   */
  private async checkPermissions(
    task: EdictTask,
    context: SharedContext
  ): Promise<SecurityCheck> {
    const issues: string[] = [];
    
    // 检查是否需要提权
    const privilegedKeywords = ["root", "admin", "sudo", "chmod 777"];
    const description = task.description.toLowerCase();
    
    for (const keyword of privilegedKeywords) {
      if (description.includes(keyword)) {
        issues.push(`检测到提权关键词: ${keyword}`);
      }
    }
    
    // 检查文件权限
    if (description.includes("写") || description.includes("删除")) {
      // 需要验证用户权限
      issues.push("需要验证写权限");
    }
    
    return {
      name: "权限检查",
      passed: issues.length === 0,
      severity: issues.length > 0 ? "medium" : "low",
      issues,
      recommendations: issues.length > 0
        ? ["验证用户身份", "使用最小权限原则", "记录权限变更"]
        : [],
    };
  }
  
  /**
   * 检查敏感数据
   */
  private async checkSensitiveData(task: EdictTask): Promise<SecurityCheck> {
    const issues: string[] = [];
    const description = task.description;
    
    // 检查敏感数据模式
    const sensitivePatterns = [
      { pattern: /password/i, risk: "密码字段" },
      { pattern: /api[_-]?key/i, risk: "API密钥" },
      { pattern: /secret/i, risk: "机密数据" },
      { pattern: /token/i, risk: "访问令牌" },
      { pattern: /\b\d{16}\b/, risk: "可能的信用卡号" },
      { pattern: /\b\d{11}\b/, risk: "可能的身份证号" },
    ];
    
    for (const { pattern, risk } of sensitivePatterns) {
      if (pattern.test(description)) {
        issues.push(`检测到敏感数据: ${risk}`);
      }
    }
    
    return {
      name: "敏感数据检查",
      passed: issues.length === 0,
      severity: issues.length > 0 ? "high" : "low",
      issues,
      recommendations: issues.length > 0
        ? ["加密敏感数据", "使用环境变量", "记录数据访问日志"]
        : [],
    };
  }
  
  /**
   * 检查依赖安全
   */
  private async checkDependencySecurity(task: EdictTask): Promise<SecurityCheck> {
    const issues: string[] = [];
    
    // 检查是否安装新依赖
    const description = task.description.toLowerCase();
    if (description.includes("安装") || description.includes("npm install")) {
      // 需要验证依赖安全性
      issues.push("需要验证新依赖的安全性");
    }
    
    return {
      name: "依赖安全检查",
      passed: issues.length === 0,
      severity: "medium",
      issues,
      recommendations: issues.length > 0
        ? ["检查依赖的已知漏洞", "验证依赖的维护状态", "使用 SCA 工具扫描"]
        : [],
    };
  }
  
  /**
   * 检查配置安全
   */
  private async checkConfigurationSecurity(task: EdictTask): Promise<SecurityCheck> {
    const issues: string[] = [];
    const description = task.description.toLowerCase();
    
    // 检查配置文件修改
    const configFilePatterns = [
      ".env",
      "config.json",
      "settings.json",
      ".npmrc",
      "database.yml",
    ];
    
    for (const pattern of configFilePatterns) {
      if (description.includes(pattern)) {
        issues.push(`修改配置文件: ${pattern}`);
      }
    }
    
    return {
      name: "配置安全检查",
      passed: issues.length === 0,
      severity: "medium",
      issues,
      recommendations: issues.length > 0
        ? ["备份原配置", "验证配置格式", "记录配置变更"]
        : [],
    };
  }
  
  /**
   * 生成安全报告
   */
  private generateSecurityReport(checks: SecurityCheck[]): {
    passed: boolean;
    score: number;
    criticalIssues: number;
    highIssues: number;
    summary: string;
  } {
    const criticalIssues = checks.filter(
      c => !c.passed && c.severity === "critical"
    ).length;
    const highIssues = checks.filter(
      c => !c.passed && c.severity === "high"
    ).length;
    
    const passed = criticalIssues === 0 && highIssues === 0;
    
    // 计算安全分数（0-100）
    const totalIssues = checks.filter(c => !c.passed).length;
    const score = Math.max(0, 100 - totalIssues * 20);
    
    const summary = passed
      ? "安全检查通过"
      : `发现 ${criticalIssues} 个严重问题，${highIssues} 个高危问题`;
    
    return {
      passed,
      score,
      criticalIssues,
      highIssues,
      summary,
    };
  }
  
  /**
   * 验证操作权限
   */
  async validatePermission(
    operation: string,
    context: SharedContext
  ): Promise<{
    allowed: boolean;
    reason?: string;
    requiredPermission?: string;
  }> {
    // 根据操作类型检查权限
    const highRiskOperations = [
      "删除文件",
      "修改系统配置",
      "安装软件包",
      "执行 Shell 命令",
    ];
    
    if (highRiskOperations.some(op => operation.includes(op))) {
      // 需要额外验证
      return {
        allowed: false,
        reason: "需要用户确认",
        requiredPermission: "user_confirmation",
      };
    }
    
    return {
      allowed: true,
    };
  }
  
  /**
   * 扫描漏洞
   */
  async scanVulnerabilities(code: string): Promise<{
    vulnerabilities: Array<{
      type: string;
      severity: "low" | "medium" | "high" | "critical";
      line?: number;
      description: string;
    }>;
    scanned: boolean;
  }> {
    // 简化的漏洞扫描
    const vulnerabilities: any[] = [];
    
    // SQL 注入
    if (code.includes("sql") && code.includes("+")) {
      vulnerabilities.push({
        type: "SQL_INJECTION",
        severity: "high",
        description: "可能的 SQL 注入漏洞",
      });
    }
    
    // XSS
    if (code.includes("innerHTML") || code.includes("dangerouslySetInnerHTML")) {
      vulnerabilities.push({
        type: "XSS",
        severity: "high",
        description: "可能的 XSS 漏洞",
      });
    }
    
    // 路径遍历
    if (code.includes("..") && code.includes("path")) {
      vulnerabilities.push({
        type: "PATH_TRAVERSAL",
        severity: "medium",
        description: "可能的路径遍历漏洞",
      });
    }
    
    return {
      vulnerabilities,
      scanned: true,
    };
  }
}

// 导出单例
export const bingbuMinistry = new BingbuMinistry();
