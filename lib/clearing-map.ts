import type { PortfolioId } from './portfolio';
export { works, arrangements, connections } from '../data/exploration/connections';

export type WorkId = PortfolioId | 'wildfire' | 'defensible';
export type Arrangement = 'clearing' | 'connections';
export type Point = { x: number; y: number };
export type Camera = Point & { zoom: number };
export type Size = { width: number; height: number };
export const WORLD = { width: 1500, height: 1000 };
export const ZOOM = { min: .18, max: 6 };
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
  const zoom = arrangement === 'clearing' ? Math.min(3.6, clearingCamera(size).zoom * 2.2) : .88;
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

export function viewpointCamera(size: Size, viewpoint: 'overlook' | 'walk' | 'close'): Camera {
  if (viewpoint === 'overlook') return fitCamera(size);
  const zoom = Math.min(ZOOM.max, clearingCamera(size).zoom * (viewpoint === 'walk' ? 1.35 : 2.8));
  const point = viewpoint === 'walk' ? { x: 650, y: 410 } : { x: 510, y: 625 };
  return { x: size.width / 2 - point.x * zoom, y: size.height * .48 - point.y * zoom, zoom };
}
// Interpolate world-space focus and logarithmic scale for continuous camera travel.
export function travelCamera(from: Camera, to: Camera, size: Size, progress: number): Camera {
  const t = Math.max(0, Math.min(1, progress));
  const ease = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const center = { x: size.width / 2, y: size.height / 2 };
  const start = { x: (center.x - from.x) / from.zoom, y: (center.y - from.y) / from.zoom };
  const end = { x: (center.x - to.x) / to.zoom, y: (center.y - to.y) / to.zoom };
  const zoom = Math.exp(Math.log(from.zoom) + (Math.log(to.zoom) - Math.log(from.zoom)) * ease);
  return { x: center.x - (start.x + (end.x - start.x) * ease) * zoom, y: center.y - (start.y + (end.y - start.y) * ease) * zoom, zoom };
}
export function connectionCurve(from: Point, to: Point, bend = 1): string {
  const dx = to.x - from.x, dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const bow = Math.min(100, length * .16) * bend;
  const ox = -dy / length * bow, oy = dx / length * bow;
  return `M ${from.x} ${from.y} C ${from.x + dx * .3 + ox} ${from.y + dy * .3 + oy}, ${from.x + dx * .7 + ox} ${from.y + dy * .7 + oy}, ${to.x} ${to.y}`;
}
export function connectionsCamera(size: Size): Camera {
  const fit = fitCamera(size);
  if (fit.zoom >= .45) return fit;
  return { x: size.width / 2 - 700 * .45, y: size.height / 2 - 450 * .45, zoom: .45 };
}
