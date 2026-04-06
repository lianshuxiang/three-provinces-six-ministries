# 2026-04-06 APA 转换器多 Sheet 支持更新

## 问题
- Excel 解析失败:Cannot read properties of undefined (reading 'target'))
- 不支持多 Sheet

## 解决方案
1. 完全重写文件上传处理逻辑
2. 添加 Sheet 选择器
3. 支持"转换所有 Sheet"功能
4. 修复作用域问题 - 在 setTimeout 外保存 e.target.result
5. 添加更健壮的错误处理
6. 添加进度条和加载动画

## 新功能
- 📊 多 Sheet 选择器界面
- 🔄 "转换所有 Sheet 为 APA 格式" 按钮
- 📈 进度条显示文件读取进度
- 🎯 加载动画
- 📄 文件信息显示 (名称 + 大小)

## Git 提交
- `307sE94` feat: 支持多 Sheet Excel 文件转换
