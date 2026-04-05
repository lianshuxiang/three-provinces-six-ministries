/**
 * 三省六部 Agent 系统 - 类型定义
 * 
 * 模型: 仅支持 GLM-4.7 / GLM-5
 */

// ==================== 基础类型 ====================

export type Model = "glm-4.7" | "glm-5";

export type Priority = "P0" | "P1" | "P2" | "P3";

export type TaskComplexity = "simple" | "medium" | "complex";

export type Ministry = "吏部" | "户部" | "礼部" | "兵部" | "刑部" | "工部";

// ==================== 路由层 ====================

export interface RoutingDecision {
  taskId: string;
  timestamp: string;
  
  // 任务分类
  complexity: TaskComplexity;
  
  // 执行路径
  route: "direct" | "single_ministry" | "three_provinces";
  
  // 紧急模式
  emergency: boolean;
  
  // 理由
  reason: string;
  
  // 预估
  estimate: {
    time: number;        // 秒
    cost: number;        // USD
  };
}

export interface TaskClassifier {
  // 分类规则
  patterns: {
    simple: string[];
    medium: string[];
    complex: string[];
    emergency: string[];
  };
  
  // 分类方法
  classify(intent: string): RoutingDecision;
}

// ==================== 共享上下文 ====================

export interface SharedContext {
  // 会话ID
  sessionId: string;
  
  // 用户原始意图
  userIntent: {
    raw: string;              // 原始输入
    parsed: string;           // 解析后的意图
    timestamp: string;
  };
  
  // 任务状态
  taskState: {
    edictId?: string;
    currentPhase: Phase;
    progress: number;        // 0-100
  };
  
  // 关键决策点
  decisions: Decision[];
  
  // 压缩后的历史（< 5KB）
  compressedHistory: string;
  
  // 当前活跃的 Agent
  activeAgent: string;
  
  // 成本追踪
  costTracking: {
    current: number;         // 当前成本
    estimated: number;       // 预估总成本
    breakdown: CostBreakdown[];
  };
  
  // 时间戳
  timestamps: {
    created: string;
    lastUpdated: string;
  };
}

export type Phase = 
  | "routing" 
  | "planning" 
  | "reviewing" 
  | "executing" 
  | "accepting" 
  | "completed"
  | "failed";

export interface Decision {
  phase: string;
  agent: string;
  decision: string;
  reason: string;
  timestamp: string;
}

export interface CostBreakdown {
  phase: string;
  agent: string;
  model: Model;
  tokens: number;
  cost: number;
}

// ==================== 诏书（任务计划） ====================

export interface ImperialEdict {
  id: string;
  timestamp: string;
  
  // 用户意图
  userIntent: string;
  
  // 路由决策
  routing: RoutingDecision;
  
  // 任务列表
  tasks: EdictTask[];
  
  // 依赖关系
  dependencies: Dependency[];
  
  // 状态
  status: EdictStatus;
  
  // 迭代追踪
  iteration: {
    version: number;
    rejections: number;
    appeals: number;
    lastModified: string;
  };
  
  // 成本
  cost: {
    estimated: number;
    actual: number;
  };
}

export interface EdictTask {
  id: string;
  description: string;
  assignedTo: Ministry;
  priority: "high" | "medium" | "low";
  
  // Todo 列表（Claude Code 风格）
  todos: Todo[];
  
  // 依赖
  dependsOn?: string[];
  
  // 状态
  status: "pending" | "in_progress" | "completed" | "failed";
}

export interface Todo {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
  priority: "high" | "medium" | "low";
}

export type EdictStatus = 
  | "drafting"
  | "pending_review"
  | "approved"
  | "rejected"
  | "appealing"
  | "executing"
  | "completed"
  | "failed";

export interface Dependency {
  taskId: string;
  dependsOn: string[];
}

// ==================== 审议 ====================

export interface Approval {
  id: string;
  edictId: string;
  timestamp: string;
  
  // 审议者
  reviewer: "门下省";
  
  // 决策
  decision: "approved" | "rejected";
  
  // 驳回理由
  rejectionReason?: {
    riskLevel: "high" | "medium" | "low";
    issues: string[];
    suggestions: string[];
  };
  
  // 申诉信息
  appeal?: Appeal;
  
  // 审批意见
  comments?: string;
  
  // 协作的部
  consultedMinistries: Ministry[];
}

export interface Appeal {
  id: string;
  edictId: string;
  rejectionId: string;
  
  // 申诉理由
  appealReason: string;
  
  // 证据
  evidence: {
    type: "context" | "technical" | "efficiency";
    content: string;
  }[];
  
  // 二次审议结果
  secondReview?: {
    decision: "approved" | "rejected";
    reviewer: "门下省";
    reason: string;
  };
  
  // 用户裁决
  userDecision?: {
    decision: "force_execute" | "modify" | "cancel";
    timestamp: string;
  };
}

// ==================== 执行 ====================

export interface ExecutionRecord {
  edictId: string;
  taskId: string;
  
  // 执行状态
  status: "pending" | "running" | "completed" | "failed";
  
  // Sub Agent 迭代记录
  iterations: ExecutionIteration[];
  
  // 最终结果
  finalResult?: {
    success: boolean;
    output: any;
  };
  
  // 时间
  startedAt?: string;
  completedAt?: string;
  duration?: number;
}

export interface ExecutionIteration {
  round: number;
  agent: "coder" | "tester" | "fixer";
  model: Model;
  
  action: string;
  result: "success" | "failure";
  
  verification?: {
    command: string;
    output: string;
    passed: boolean;
  };
  
  timestamp: string;
}

// ==================== 验收 ====================

export interface AcceptanceReport {
  edictId: string;
  taskId: string;
  timestamp: string;
  
  passed: boolean;
  
  checks: {
    quality: boolean;      // lint/typecheck
    security: boolean;     // 安全扫描
    tests: boolean;        // 测试通过
    performance: boolean;  // 性能检查
  };
  
  issues: string[];
  
  // 驳回记录
  rejection?: {
    reason: string;
    suggestedFix: string;
    retryCount: number;
  };
}

// ==================== 检查点 ====================

export interface Checkpoint {
  taskId: string;
  stepId: string;
  
  phase: string;
  agent: string;
  
  status: "completed" | "in_progress" | "failed";
  
  input: any;
  output?: any;
  
  startedAt: string;
  completedAt?: string;
  
  parentCheckpoint?: string;
}

// ==================== 事务 ====================

export interface Transaction {
  id: string;
  taskId: string;
  
  status: "active" | "committed" | "rolled_back";
  
  operations: TransactionOperation[];
  
  rollbackStrategy: "immediate" | "manual" | "checkpoint";
  
  timestamps: {
    created: string;
    committed?: string;
    rolledBack?: string;
  };
}

export interface TransactionOperation {
  id: string;
  type: "file_read" | "file_write" | "file_delete" | "bash_command";
  target: string;
  
  backup?: {
    type: "file" | "git_stash";
    location: string;
  };
  
  status: "pending" | "completed" | "rolled_back";
}

// ==================== 规则 ====================

export interface Rule {
  id: string;
  name: string;
  priority: Priority;
  enabled: boolean;
  created: string;
  description: string;
}

// ==================== 成本预算 ====================

export interface Budget {
  perTask: BudgetLimit;
  perDay: BudgetLimit;
  perMonth: BudgetLimit;
}

export interface BudgetLimit {
  limit: number;        // USD
  alertAt: number;      // USD
  hardStop: boolean;
}

export interface CostEstimate {
  taskId: string;
  
  breakdown: {
    phase: string;
    agent: string;
    model: Model;
    estimatedTokens: number;
    estimatedCost: number;
  }[];
  
  total: number;
  
  budgetStatus: {
    remaining: number;
    percentUsed: number;
    willExceed: boolean;
  };
}

// ==================== 资源锁 ====================

export interface ResourceLock {
  resourceId: string;
  type: "file" | "api" | "quota";
  
  lockHolder: string;
  lockTime: string;
  
  queue: {
    requester: string;
    requestTime: string;
    priority: number;
    reason: string;
  }[];
  
  timeout: number;
}

// ==================== 事件 ====================

export interface Event {
  id: string;
  type: EventType;
  timestamp: string;
  
  source: string;
  target?: string | string[];
  
  data: any;
}

export type EventType =
  // 任务相关
  | "task.started"
  | "task.completed"
  | "task.failed"
  | "task.paused"
  
  // 阶段相关
  | "phase.started"
  | "phase.completed"
  
  // 安全相关
  | "security.issue_found"
  | "security.scan_completed"
  
  // 质量相关
  | "quality.test_failed"
  | "quality.lint_error"
  | "quality.check_completed"
  
  // 资源相关
  | "resource.quota_warning"
  | "resource.lock_acquired"
  | "resource.lock_released"
  
  // 成本相关
  | "cost.budget_alert"
  | "cost.budget_exceeded"
  
  // 规则相关
  | "rule.triggered"
  
  // 申诉相关
  | "appeal.submitted"
  | "appeal.rejected"
  
  // 紧急相关
  | "emergency.activated";
