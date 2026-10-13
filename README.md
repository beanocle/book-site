# book-site

书籍网站（三语：日文主版、英文、中文），内嵌「缺口填补 TRIZ 导航」AI 应用。
同时是作者在山口大学 MOT「創造的問題解決特論 2026」的课程作品。
本仓库的规则见 [CLAUDE.md](CLAUDE.md)。

**状态：本地原型。尚未公开，尚未绑定域名。**

## 技术

Astro 7 + Vue 3，运行在 Cloudflare Workers（`@astrojs/cloudflare`）。
AI 组件：Gemini API。日志：D1。检索：Vectorize（待接）。

## 本机运行

```powershell
. .\dev.ps1          # 载入环境（本机设置放 dev.local.ps1，不入库）
npm install
npm run dev          # http://localhost:4321/
npm run build && npx wrangler dev   # 以 Workers 运行时预览，/api/health 可查环境
```

Git Bash 用 `. ./dev.sh`。需要 Node 22 以上。密钥：复制 `.dev.vars.example` 为 `.dev.vars` 填入。

## 目录

```text
src/i18n/            语言定义与界面文案
src/layouts/         基础布局（hreflang、导航、语言切换）
src/components/      页面组件；app/ 下是 Vue 导航
src/pages/{ja,en,zh}/  三语路由；src/pages/api/ 是 Worker 端点
src/triz/            ★ TRIZ 流程、参数表、原理对应表、判断标准、prompt（作者审定）
docs/                事件 schema、TRIZ 设计说明
tools/               凭据扫描
.githooks/           提交前检查（身份、密钥文件、扫描）
```

## 里程碑

| 日期 | 事项 |
| --- | --- |
| 2026-10-31 | 课程第 2 回：通用版 TRIZ-AI ツール |
| 2026-11-21 / 12-12 | 课程第 3、4 回：实课题分组使用 |
| 2027-01-16 | 成果发表会（网站即发表） |
| 出版日期定后 | 换密钥、接邮件服务、绑域名、公开 |
