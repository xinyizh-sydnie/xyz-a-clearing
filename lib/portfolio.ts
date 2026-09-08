import { portfolio } from '../data/portfolio/projects';
import { dataAsset } from './assets';
export { base } from './assets';
export { portfolio, pageCaptions } from '../data/portfolio/projects';
export type { PortfolioProject, PortfolioId } from '../data/portfolio/projects';
export const folioImage = (page: number, thumb = false) => dataAsset(`portfolio/${thumb ? 'thumbnails' : 'pages'}/page-${String(page).padStart(2, '0')}.${thumb ? 'webp' : 'jpg'}`);
export const projectAtPage = (page: number) => portfolio.find(p => page >= p.start && page <= p.end);
