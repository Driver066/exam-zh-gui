# Credits

exam-zh GUI 是一款面向中文试卷的结构化桌面编辑器。它从 `.examzh.json` 生成兼容 `exam-zh` 的 `.tex` 和 PDF；本项目不会替代下面列出的上游项目。

## exam-zh

- 项目仓库：[`xkwxdyy/exam-zh`](https://github.com/xkwxdyy/exam-zh)
- CTAN 页面：[`exam-zh`](https://ctan.org/pkg/exam-zh)
- 项目用途：面向中文试卷的 LaTeX 模板和模块

`exam-zh` 提供本应用导出的核心 LaTeX 类、环境和命令，包括题目、解答题、选择项、选择括号、填空、答案、评分、中文试卷格式、字体和相关设置。

本仓库在 `resources/latex/exam-zh/` 中保留一份未修改的运行文件副本，用于 bundled Tectonic 编译。该副本来自 TeX Live 2026 中的 `exam-zh` v0.2.6，许可证为 LaTeX Project Public License v1.3c；目录内包含对应 `LICENSE` 和来源说明。

## Tectonic

应用支持把 Tectonic 作为没有本机 TeX 环境时的 bundled fallback。Tectonic 主体采用 MIT license，其 engine 和 TeX 资源还包含其他开源许可证。公开二进制预览前必须保留 binary provenance、checksum 和第三方许可证审计记录。

## MathJax 与 PDF.js

- MathJax 用于应用内即时数学预览，不决定最终 PDF 排版。
- PDF.js 用于应用内加载、阅读和选择已经生成的 PDF，不参与生成 PDF。

两者均通过本地依赖随应用构建，不依赖 CDN。

## 维护者与贡献者

本项目由朱孝诚（GitHub: `Driver066`）发起并维护。

项目在路线规划、文档撰写、实现辅助、测试设计和审查辅助等环节中使用 AI 工具。AI 是开发工作流的一部分；产品方向、代码审查、发行决策和维护责任由人类维护者承担。

## 用户生成内容

用户使用本软件创建的试卷、题库、图片、答案、解析、评分标准、导出的 `.tex`、PDF 和其他用户文件归用户所有。用户自行加入的第三方材料仍受其原有权利限制。

项目源码许可证只适用于软件源码本身，不主张拥有用户生成的试卷材料。
