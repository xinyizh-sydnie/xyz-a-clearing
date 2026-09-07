# xyz / A Clearing

A personal landscape research and design website for Xinyi Zhang. The homepage is a pannable, zoomable clearing with ten works, draggable project markers, a Connections arrangement, random discovery, and a temporary gathered collection; the Academic view provides a direct research index. Research details, About, and CV open in accessible panels. The complete landscape portfolio opens in a page reader with chapter navigation, keyboard paging, zoom, and pan.

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

- `app/page.tsx`: project content, publication, biographical text, and view switching.
- `components/clearing/explorer.tsx`: mouse, touch, and keyboard exploration; work selection, arrangements, and gathering.
- `lib/clearing-map.ts`: editorial connections, initial arrangements, and camera geometry. The positions form a diagram, not a geographic map.
- `scripts/check-clearing.mjs`: camera geometry and work/connection integrity checks.
- `lib/portfolio.ts`: eight chapters (seven design projects and personal drawings), page ranges, and captions.
- `components/clearing/portfolio.tsx`: the complete portfolio index and accessible page reader.
- `public/images/portfolio/`: all 45 original PDF pages at 2400 pixels; `portfolio-thumbs/` contains lightweight WebP previews.
- Typography uses the system Helvetica Neue / Helvetica / Arial stack. The earlier Manrope font and license remain in the source but are no longer loaded.
- `app/globals.css`: responsive visual design and reduced-motion behavior.
- `public/images/homeland.jpg`, `landscape-language.jpg`, `living-with-water.jpg`: original portfolio images supplied by Xinyi Zhang, rendered from the source PDF.
- `public/images/defensible-design.jpg`: supplied Autodesk research submission, rendered from the source PDF.
- `public/images/clearing.png`: original botanical concept artwork made with built-in Imagegen. Prompt and source notes are in `ARTWORK.md`.

The research paper is marked published as of 8 July 2026. The defensible-space project is labeled research in progress, and its review limitations are retained. The CV panel is a selected web summary, not a replacement for the full academic résumé. The original source PDFs are not bundled. All 45 portfolio pages are displayed as supplied, including original captions and credits; the website biography uses the current academic contact address.

Direct links: `?view=academic`, `?project=wildfire`, `?project=defensible`, `?project=landscape`, `?project=about`, and `?project=cv`. The project and view parameters can be combined. Portfolio chapters also accept `?project=living-with-water&page=21`, for example; `?project=landscape&page=1` opens all 45 pages. Page turns update the URL without adding a separate browser-history entry for every page.

## Design references

The current typography direction follows [Columbia GSAPP](https://www.arch.columbia.edu/), whose live CSS uses `union-regular`. [Union](https://radimpesko.com/fonts/union) blends Arial and Helvetica; this site uses the system Helvetica Neue / Helvetica / Arial stack as an approximation, with regular weight, open spacing, and uppercase navigation. No proprietary Union font files are bundled. Earlier layout references were [Stockholm Design Lab](https://www.stockholmdesignlab.se/) and [Form Us With Love](https://www.formuswithlove.se/). Botanical exploration is informed by the user’s [Pollinator Pathmaker](https://pollinator.art/us) reference. All project drawings remain the supplied portfolio artwork.

## Exploring the clearing

Drag empty space to pan; drag a work to rearrange it. Use the zoom buttons or slider; Ctrl/Command + wheel zooms in the embedded view, and wheel zooms in the expanded view. Touch supports pan and pinch on empty space. Tab to a work and press Enter to inspect it; Alt + arrow keys move a focused work. Focus the map itself to pan with arrow keys, zoom with +/−, and reset with Home. The reset button restores the current arrangement.

Connections are editorial associations between the supplied projects, not measured geographic or statistical relationships. “Gather” keeps work IDs in memory for this mounted exploration session only; it uses no storage or external service. Switching to Academic or reloading clears that collection.
