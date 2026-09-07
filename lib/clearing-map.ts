import { portfolio, type PortfolioId } from './portfolio';

export type WorkId = PortfolioId | 'wildfire' | 'defensible';
export type Arrangement = 'clearing' | 'connections';
export type Point = { x: number; y: number };
export type Camera = Point & { zoom: number };
export type Size = { width: number; height: number };
export const WORLD = { width: 1500, height: 1000 };
export const ZOOM = { min: .25, max: 2.2 };
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
    wildfire: { x: 230, y: 225 }, defensible: { x: 550, y: 265 },
    'natural-as-calendar': { x: 1090, y: 145 }, 'ycd2050': { x: 850, y: 555 },
    'living-with-water': { x: 1220, y: 410 }, 'bride-market': { x: 1080, y: 805 },
    'sediment-harvester': { x: 1300, y: 670 }, 'ant-scape': { x: 825, y: 315 },
    'back-to-homeland': { x: 440, y: 730 }, 'homeland-drawings': { x: 170, y: 560 },
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
export function fitCamera(size: Size): Camera {
  const zoom = Math.max(ZOOM.min, Math.min(1, (size.width - 80) / WORLD.width, (size.height - 110) / WORLD.height));
  return { x: (size.width - WORLD.width * zoom) / 2, y: (size.height - WORLD.height * zoom) / 2, zoom };
}
// The landscape starts close enough to enter; the connection diagram retains an overview.
export function clearingCamera(size: Size): Camera {
  const zoom = Math.min(ZOOM.max, Math.max(.68, size.width / 1350, size.height / 830));
  return { x: size.width / 2 - 750 * zoom, y: size.height * .48 - 440 * zoom, zoom };
}
export function focusCamera(size: Size, point: Point, arrangement: Arrangement): Camera {
  const zoom = arrangement === 'clearing' ? Math.min(1.9, clearingCamera(size).zoom * 1.55) : .92;
  return { x: size.width * (size.width < 600 ? .5 : .55) - point.x * zoom, y: size.height * .32 - point.y * zoom, zoom };
}
export function zoomAt(camera: Camera, zoom: number, anchor: Point): Camera {
  const bounded = Math.min(ZOOM.max, Math.max(ZOOM.min, zoom));
  const ratio = bounded / camera.zoom;
  return { x: anchor.x - (anchor.x - camera.x) * ratio, y: anchor.y - (anchor.y - camera.y) * ratio, zoom: bounded };
}
export function movePoint(point: Point, delta: Point, zoom: number): Point {
  return { x: Math.max(80, Math.min(WORLD.width - 80, point.x + delta.x / zoom)), y: Math.max(80, Math.min(WORLD.height - 80, point.y + delta.y / zoom)) };
}
