# xyz / A Clearing

Sydnie Zhang 的个人网站：以一处共同的 Clearing 连接研究、景观设计与绘画，提供场景探索、Connections、完整作品集阅读器和 Academic 模式。

## 内容和资料目录

```text
data/                              # 网站实际读取的可编辑内容
├── site.ts                        # 姓名、联系方式、首页理念
├── projects.ts                    # 研究与作品集的项目介绍
├── portfolio/projects.ts          # 8 个章节、45 页标题和页码范围
├── research/wildfire-as-urban-risk.ts  # 论文、摘要、图表说明及比较数据
├── exploration/scenes.ts          # 场景、路线、Clearing 中的入口坐标
├── exploration/connections.ts     # 项目关联和布局坐标
└── assets.json                    # 素材清单、文件大小与 SHA-256

public/data/                       # 随网站发布的图片与 PDF
├── exploration/
│   ├── scenes/                    # Clearing 与各项目的插画场景
│   └── ant-scape/                 # 蚂蚁、算法和城市三种尺度
├── portfolio/
│   ├── pages/                     # 完整作品集的 45 页 JPG
│   ├── thumbnails/                # 对应的 45 页 WebP 缩略图
│   └── covers/                    # 作品集概览图片
└── research/
    ├── wildfire-as-urban-risk/
    │   ├── paper.pdf              # 完整的 26 页正式论文
    │   └── figures/               # 原论文的全部 10 张图
    └── defensible-space/
        └── design-workflow.jpg    # 原始设计工作流图
```

`data/README.md` 说明各项内容如何更新。`lib/` 保留路径、相机和阅读器等功能代码；`components/clearing/` 是交互界面；`app/page.tsx` 包含页面结构、Academic 和 About/CV 的完整履历。

字体位于 `public/fonts/`：Clearing Display 是根据艺术字参考创作的字体，Jost 用于正文与导航。素材来源和署名见 `ARTWORK.md`。

## 本地运行

需要 Node.js 22.13 或以上，以及 pnpm 11.19.0。

```sh
npm install -g pnpm@11.19.0
pnpm install --frozen-lockfile
pnpm dev
```

在终端显示的地址打开网站。检查内容和文件链接：

```sh
pnpm check
```

新增、替换或移动 `public/data/` 内的文件后，更新素材清单：

```sh
pnpm data:index
```

## 从 GitHub 更新网站

仓库：[xinyizh-sydnie/xyz-a-clearing](https://github.com/xinyizh-sydnie/xyz-a-clearing)

GitHub Pages 使用 `.github/workflows/pages.yml`：每次推送到 `main`，会检查网站、生成静态页面并发布。构建输出是 `dist/client/`，无需数据库或服务器。流程从 GitHub Pages 设置读取网站子路径，使用 `pnpm build:github` 生成并验证发布目录，因此图片、论文和脚本可在仓库路径下正常加载。普通 `pnpm build` 用于根路径部署。

```sh
git add .
git commit -m "Update website content"
git push origin main
```

发布进度可在仓库的 **Actions** 中查看。`dist/`、`node_modules/`、本地环境变量和开发缓存不提交到 GitHub。

`.openai/hosting.json` 保留现有 Sites 私人预览的项目标识；它不包含凭据，也不是 GitHub Pages 的运行依赖。

## 直接链接

- `?view=academic`：学术页面
- `?project=wildfire`：论文与图表阅读器
- `?project=defensible`：当前研究
- `?project=landscape&page=1`：完整作品集
- `?project=living-with-water&page=21`：指定项目和页面
- `?project=about` / `?project=cv`：个人介绍和 CV

作品集原页及署名完整保留。论文来自作者提供的 CC BY 4.0 正式文章；仅去掉下载平台生成的封面。场景插画是将不同项目联系起来的概念景观，具体设计和研究内容以原始作品集及论文为准。

### 沉浸探索

场景使用单张清晰插画。拖动可直接环顾，松手即停止；悬停显示项目入口，点击直接进入对应场景。右上角支持有限倍数的手动缩放、全景和沉浸视图；键盘方向键平移，Home 回到全景。触屏支持横向拖动，放大后可自由拖动和双指缩放。浏览不再包含鼠标视差、惯性漂移、滚动自动放大或飞行转场。
