# Task 5：统一样式与组件改造清单（平台方案 A）

## 目标
- 平台端教学页完全采用平台管理端 UI/UX 语言（bs-ui + 平台主题变量）。
- 取消客户端教学模块的独立视觉体系（渐变/独立 CSS/字体）。

## 统一设计基准
- 设计基准：平台管理端（智能体构建、智能体广场）。
- 主题变量来源：`src/frontend/platform/src/style/index.css`。
- 字体来源：`--font-sans`（AlibabaPuHuiTi）。

## 组件替换映射（客户端 -> 平台）
- Button：`~/components/ui/Button` -> `@/components/bs-ui/button`
- Card：`~/components/ui/Card` -> `@/components/bs-ui/card`
- Tabs：`~/components/ui/Tabs` -> `@/components/bs-ui/tabs`
- Badge/Tag：`~/components/ui/Tag` -> `@/components/bs-ui/badge`
- Progress：`~/components/ui/Progress` -> `@/components/bs-ui/progress`
- Dialog/Sheet：`~/components/ui/Dialog` -> `@/components/bs-ui/dialog` / `@/components/bs-ui/sheet`
- Tooltip：`~/components/ui/Tooltip` -> `@/components/bs-ui/tooltip`
- Breadcrumb：`~/components/ui/Breadcrumb` -> 平台自有 or 新增 `bs-ui/breadcrumb`
- Skeleton/Empty/Error：使用平台统一空态与提示组件（若无则新增轻量组件）

## 样式迁移策略
- 主体样式：全部使用 Tailwind + 平台主题变量（`hsl(var(--...))`）。
- 移除渐变与独立色板：替换为平台主色/次色/中性色。
- 保留必要的功能性 CSS（如视频播放器、流程画布）：将 `education.css` 中功能样式迁移到平台 `App.css` 或新建 `education.css`，并加统一前缀（`.education-`）。

## 迁移范围（按页面）
- 教学首页：课程卡片、统计指标、学习路径、成就区域。
- 课程详情：信息区、章节列表、学习按钮、进度条。
- 章节学习：视频播放器、内容区、学习进度。
- 学习进度：统计卡片、课程进度列表。
- 实践环境：工作流画布、节点卡片。
- 引导构建：步骤条、内容区、动作按钮。
- 成功页：提示卡片、回到教学入口。

## 统一交互
- 统一按钮层级与尺寸（主按钮/次按钮/描边按钮）。
- 统一卡片 hover/active 阴影规则。
- 统一页面间距与排版节奏（页面 header 与内容区域）。

## 交付物
- 平台端教学页面全部使用 bs-ui 组件与平台主题变量。
- 不再依赖客户端 `style.css` 与 `education.css` 的视觉层。
