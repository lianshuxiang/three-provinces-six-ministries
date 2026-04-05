/**
 * 鼚用户体验系统统一导出
 */

// 进度显示
export { ProgressDisplay, progressDisplay } from './progress';
export { ErrorHandler, errorHandler } from './error-handler';
export type { FriendlyError } from './error-handler';

// 预览确认模式
export { PreviewMode, previewMode } from './preview-mode';
export type { PreviewResult, RiskLevel } from './preview-mode';

// 回滚机制
export { RollbackManager, rollbackManager } from './rollback';
export type { Checkpoint, RollbackResult } from './rollback';

export type { RiskLevel } from './preview-mode';
