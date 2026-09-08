import { portfolio } from '../portfolio/projects';
import type { Arrangement, Point, WorkId } from '../../lib/clearing-map';
export const works = [
  { id: 'wildfire', number: 'R1', title: 'Wildfire as urban risk', category: 'Published research', question: 'How does wildfire risk travel through urban systems?', image: 'research', cover: 0 },
  { id: 'defensible', number: 'R2', title: 'Where the Fire Stopped', category: 'Research in progress', question: 'What can post-fire evidence tell us about landscape design?', image: 'defensible', cover: 0 },
  ...portfolio.map(p => ({ id: p.id, number: p.number, title: p.title, category: p.theme, question: p.question, image: 'portfolio', cover: p.cover })),
] satisfies Array<{ id: WorkId; number: string; title: string; category: string; question: string; image: string; cover: number }>;
export const arrangements: Record<Arrangement, Record<WorkId, Point>> = {
  clearing: {
    wildfire: { x: 280, y: 290 }, defensible: { x: 500, y: 175 },
    'natural-as-calendar': { x: 1090, y: 160 }, 'ycd2050': { x: 1270, y: 525 },
    'living-with-water': { x: 1300, y: 300 }, 'bride-market': { x: 1200, y: 800 },
    'sediment-harvester': { x: 890, y: 580 }, 'ant-scape': { x: 510, y: 625 },
    'back-to-homeland': { x: 760, y: 870 }, 'homeland-drawings': { x: 260, y: 800 },
  },
  connections: {
    wildfire: { x: 495, y: 290 }, defensible: { x: 890, y: 455 },
    'natural-as-calendar': { x: 865, y: 120 }, 'ycd2050': { x: 1170, y: 230 },
    'living-with-water': { x: 1270, y: 465 }, 'bride-market': { x: 265, y: 485 },
    'sediment-harvester': { x: 1270, y: 770 }, 'ant-scape': { x: 920, y: 785 },
    'back-to-homeland': { x: 570, y: 735 }, 'homeland-drawings': { x: 230, y: 800 },
  },
};
export const connections: Array<{ from: WorkId; to: WorkId; label: string }> = [
  { from: 'wildfire', to: 'defensible', label: 'Wildfire' },
  { from: 'wildfire', to: 'back-to-homeland', label: 'Recovery' },
  { from: 'defensible', to: 'ant-scape', label: 'Computational design' },
  { from: 'defensible', to: 'back-to-homeland', label: 'Post-disaster landscapes' },
  { from: 'ant-scape', to: 'ycd2050', label: 'Urban form' },
  { from: 'ycd2050', to: 'bride-market', label: 'Community' },
  { from: 'bride-market', to: 'back-to-homeland', label: 'Memory & place' },
  { from: 'back-to-homeland', to: 'homeland-drawings', label: 'Homeland' },
  { from: 'living-with-water', to: 'sediment-harvester', label: 'Water systems' },
  { from: 'living-with-water', to: 'natural-as-calendar', label: 'Seasonal rhythms' },
  { from: 'natural-as-calendar', to: 'homeland-drawings', label: 'Landscape & memory' },
];
