import { paper as paperContent } from '../data/research/wildfire-as-urban-risk';
import { dataAsset } from './assets';
export { landSettings, paperFigures } from '../data/research/wildfire-as-urban-risk';
export const paper = { ...paperContent, pdf: dataAsset(paperContent.pdf) };
export const figureImage = (number: number) => dataAsset(`research/wildfire-as-urban-risk/figures/figure-${String(number).padStart(2, '0')}.webp`);
