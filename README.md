# xyz / a clearing

A personal landscape research and design website for Xinyi Zhang. The homepage invites guided exploration; the Academic view provides a direct research index. Project details, About, and CV open in accessible panels.

## Local development

Use Node 22.13 or newer and pnpm 11.19.0.

```sh
pnpm install
pnpm dev
```

## Publishing from GitHub

The site produces static HTML and assets in `dist/client` using `pnpm build`. Push this project to a GitHub repository with `main` as its default branch. In Settings → Pages, choose GitHub Actions. The included workflow builds and publishes on pushes to `main`, and supports either a user site or a repository subpath. A custom domain can be configured in GitHub Pages settings.

The optional `.openai/hosting.json` identifies the private Sites concept preview. It is not needed by GitHub Pages; the build has no server, database, or Sites runtime dependency.

## Content and assets

- `app/page.tsx`: project content, publication, biographical text, and interactions.
- `app/globals.css`: responsive visual design and reduced-motion behavior.
- `public/images/homeland.jpg`, `landscape-language.jpg`, `living-with-water.jpg`: original portfolio images supplied by Xinyi Zhang, rendered from the source PDF.
- `public/images/defensible-design.jpg`: supplied Autodesk research submission, rendered from the source PDF.
- `public/images/clearing.png`: original botanical concept artwork made with built-in Imagegen. Prompt and source notes are in `ARTWORK.md`.

The research paper is marked published as of 8 July 2026. The defensible-space project is labeled research in progress, and its review limitations are retained. The CV panel is a selected web summary, not a replacement for the full academic résumé. The original source PDFs and personal phone numbers are not included.

Direct links: `?view=academic`, `?project=wildfire`, `?project=defensible`, `?project=landscape`, `?project=about`, and `?project=cv`. The project and view parameters can be combined.
