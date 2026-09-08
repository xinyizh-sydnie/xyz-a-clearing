# 网站数据维护

这里存放网站直接读取的文字、项目和场景配置，图片及 PDF 存放在 `public/data/`。所有目录均含实际使用的资料。

| 要修改的内容 | 文件 |
| --- | --- |
| 首页理念、首页姓名 | `site.ts` |
| 研究项目简介、外部链接 | `projects.ts` |
| 作品集章节、封面页、逐页说明 | `portfolio/projects.ts` |
| 已发表论文信息、摘要、比较数据及图注 | `research/wildfire-as-urban-risk.ts` |
| 场景标题、叙述、图片、进入项目的位置 | `exploration/scenes.ts` |
| Connections 中的项目关系 | `exploration/connections.ts` |
| 所有媒体文件的位置和校验信息 | `assets.json` |

## 路径约定

数据文件内的媒体路径相对于 `public/data/`，例如：

```ts
image: 'exploration/scenes/clearing-hub.webp'
```

页面使用 `lib/assets.ts` 的 `dataAsset()` 自动加入 GitHub Pages 子路径。不要在内容文件里写电脑上的绝对路径，或手工加上 GitHub 仓库前缀。

## 更新作品集

原图位于 `public/data/portfolio/pages/`，缩略图位于 `public/data/portfolio/thumbnails/`，文件以相同的两位页码对应。添加页面时同时更新 `portfolio/projects.ts` 的页码范围和 `pageCaptions`。当前为 45 页，检查脚本也会验证完整性；扩充页数时同步调整检查中的总页数。

## 更新论文与研究

正式论文在 `public/data/research/wildfire-as-urban-risk/paper.pdf`，图件在同目录的 `figures/`。摘要、数值和图注保留来源信息，修改后运行 `pnpm check`。当前防御空间项目的设计图在 `public/data/research/defensible-space/`，文字简介在 `projects.ts`，证据网站链接指向原研究项目。

这里归档的是已用于个人网站的内容和素材。研究原始遥感影像、GIS 图层、模型训练数据及未提供的源文件不在本仓库内。

## 更新场景

`exploration/scenes.ts` 中每个场景的 `work` 对应项目 ID。入口位置 `x`、`y` 从图片左上角开始，范围是 0–1。Clearing 的路径与项目场景一一对应，起点和终点使用同一张大场景。

更新媒体文件后运行：

```sh
pnpm data:index
pnpm check
```

`assets.json` 由脚本生成，请通过上述命令更新，不必手工编辑。
