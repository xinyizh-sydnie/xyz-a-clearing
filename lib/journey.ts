import { journey } from '../data/exploration/scenes';
import type { JourneyScene } from '../data/exploration/scenes';
import { dataAsset } from './assets';
export { journey, clearingPaths } from '../data/exploration/scenes';
export type { JourneyScene } from '../data/exploration/scenes';
export const sceneImage = (scene: JourneyScene) => dataAsset(scene.image);
export function journeyFrame(position: number) {
  const bounded = Math.max(0, Math.min(journey.length - 1, position));
  const index = Math.min(journey.length - 1, Math.floor(bounded));
  const fraction = bounded - index;
  const blend = Math.max(0, Math.min(1, (fraction - 0.62) / 0.38));
  return {
    index,
    next: Math.min(index + 1, journey.length - 1),
    blend,
    local: fraction,
    arrived: bounded >= journey.length - 1 - 0.001,
  };
}

export type JourneyCamera = { zoom: number; x: number; y: number };
export function boundJourneyCamera(
  camera: JourneyCamera,
  size: { width: number; height: number },
): JourneyCamera {
  const zoom = Math.max(1, Math.min(3, camera.zoom));
  const extraX = size.width * (zoom - 1),
    extraY = size.height * (zoom - 1);
  return {
    zoom,
    x: Math.max(-extraX * 0.5, Math.min(extraX * 0.5, camera.x)),
    y: Math.max(-extraY * 0.4, Math.min(extraY * 0.6, camera.y)),
  };
}
export function scenePoint(
  scene: JourneyScene,
  size: { width: number; height: number },
) {
  const width = (scene.fit === 'contain' ? Math.min : Math.max)(
      size.width,
      size.height * 1.5,
    ),
    height = width / 1.5;
  const [fx, fy] = scene.focal.split(' ').map((n) => parseFloat(n) / 100);
  return {
    x: scene.object.x * width + (size.width - width) * fx,
    y: scene.object.y * height + (size.height - height) * fy,
  };
}
