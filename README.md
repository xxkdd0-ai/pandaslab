# PandasLab V0.3

中英双语可视化数据分析网站，纯静态网页，无需后端、Python 或构建步骤。

## 发布到 GitHub Pages

1. 在 GitHub 新建一个公开仓库，例如 `pandaslab`。
2. 解压本压缩包。在仓库页面选择 Add file → Upload files，将解压目录内的全部文件与 vendor 文件夹上传并提交到 main 分支。
3. 确认仓库首页直接显示 index.html、app.js、lab.js、vendor 等文件。不要仅上传 ZIP，也不要把整个外层目录作为唯一文件夹上传。
4. 进入 Settings → Pages。
5. 在 Build and deployment 下，将 Source 设为 Deploy from a branch。
6. Branch 选择 main，文件夹选择 /(root)，然后 Save。
7. 等待 GitHub 完成部署，再从 Pages 页面打开 Visit site。最终网址以该页面显示为准，项目站点通常为 https://你的用户名.github.io/仓库名/ 。

本包带有 .nojekyll 文件；如果文件管理器隐藏点文件，请开启显示隐藏文件，确保一起上传。

官方说明：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 包含功能

CSV、TSV、JSON、Excel 导入；概览、清洗、统计、七类图表、操作记录；V0.3 探索实验室包括多图联动、缺失诊断与群体比较。所有运行必需的脚本、样式和 Excel 组件均已包含。

本包是发布包，未包含开发测试脚本、Git 历史或原托管平台配置。HTML/CSS/JavaScript 为可编辑源码。

## 注意事项

- 数据仅在浏览器本地处理；刷新会丢失操作状态，请先导出。
- 当前限制为 20 MB、50000 行、100 列。Python 代码仅供参考，不在网页内执行。
- 别把真实的个人数据、录音、密钥或其他私密文件上传到公开仓库。
- 页面使用相对路径，支持 GitHub Pages 仓库子路径；不要直接双击 index.html 来测试模块脚本，请使用 HTTP 静态服务或发布后的网址。
- Excel 使用本地 SheetJS CE 0.20.3，保留 vendor 中的文件和许可声明。界面字体不可用时回退系统字体。

## English

PandasLab is a bilingual browser-local data analysis workspace. Upload this archive's extracted contents to the repository root and publish main / (root) using GitHub Pages. No build or backend is required. Export your results before refreshing; Python snippets are reference code only.
