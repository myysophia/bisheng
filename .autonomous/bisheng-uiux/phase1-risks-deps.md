# Task 6：技术风险与依赖评估（平台方案 A）

## 关键依赖
- 平台路由：`src/frontend/platform/src/routes.tsx`
- 平台布局：`src/frontend/platform/src/layout/MainLayout.tsx`
- 教学 API：`src/frontend/platform/src/controllers/API/education.ts`
- 认证与权限：`src/frontend/platform/src/contexts/userContext` + `routes.tsx` 权限过滤

## 风险清单与应对
1) 路由迁移风险
- 风险：移除客户端 `/education` 后，旧链接失效。
- 应对：在平台端提供完整教学路由；必要时在客户端保留最小重定向（仅内部使用，后续下线）。

2) API 版本差异
- 风险：平台与客户端 API 路径不一致（`/api/education` vs `/api/v1/education`）。
- 应对：优先以平台 API 为准；若后端仍使用 v1，则统一适配到平台端。

3) 权限与菜单可见性
- 风险：`user.web_menu` 可能限制教育入口，但业务上需要可见。
- 应对：确认 `education` 权限项策略；必要时设为默认可见。

4) 组件与样式复用冲突
- 风险：客户端 UI 组件与平台 bs-ui 重复且风格冲突。
- 应对：平台端统一使用 bs-ui；客户端组件仅作为迁移参考，不直接引入。

5) 数据模型不一致
- 风险：客户端教育模块已有 mock 数据结构与平台接口返回不一致。
- 应对：在平台端统一接口类型定义；迁移时逐一对齐字段。

6) 认证流程差异
- 风险：平台内不跳转后，依赖本地 token 透传的逻辑需调整。
- 应对：复用平台现有 auth 逻辑，取消 `auth_token` URL 透传。

7) 测试覆盖缺口
- 风险：客户端教学测试用例无法直接复用。
- 应对：迁移关键测试到平台端，覆盖基础路由与关键交互。

## 建议优先顺序
- 先完成平台端路由与基础页面结构（保证内嵌可访问）。
- 再做 UI 统一与组件替换。
- 最后移除客户端跳转与路由残留。
