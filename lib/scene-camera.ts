// Camera coordinates are in screen pixels; artwork coordinates stay in its native plane.
export const SCENE = { width: 1536, height: 1024 };
export type SceneSize = { width: number; height: number };
export type SceneCamera = { x: number; y: number; zoom: number };
export type ScenePoint = { x: number; y: number };
export const coverScale = (size: SceneSize) => Math.max(size.width / SCENE.width, size.height / SCENE.height);
export const containScale = (size: SceneSize) => Math.min(size.width / SCENE.width, size.height / SCENE.height);

// Limit magnification of the source painting; large screens may still need cover scale.
export const maximumSceneScale = (size: SceneSize) => Math.max(coverScale(size), Math.min(coverScale(size) * 1.65, 1.25));

export function constrainSceneCamera(camera: SceneCamera, size: SceneSize): SceneCamera {
  const zoom = Math.max(containScale(size), Math.min(maximumSceneScale(size), camera.zoom));
  const width = SCENE.width * zoom, height = SCENE.height * zoom;
  return {
    zoom,
    x: width < size.width ? (size.width - width) / 2 : Math.max(size.width - width, Math.min(0, camera.x)),
    y: height < size.height ? (size.height - height) / 2 : Math.max(size.height - height, Math.min(0, camera.y)),
  };
}
export function placeCamera(size: SceneSize, point: ScenePoint = { x: .5, y: .55 }, distance = 1): SceneCamera {
  const zoom = Math.max(containScale(size), Math.min(maximumSceneScale(size), coverScale(size) * distance));
  return constrainSceneCamera({ zoom, x: size.width / 2 - point.x * SCENE.width * zoom, y: size.height / 2 - point.y * SCENE.height * zoom }, size);
}
export function overviewCamera(size: SceneSize): SceneCamera {
  const zoom = containScale(size);
  return constrainSceneCamera({ zoom, x: (size.width - SCENE.width * zoom) / 2, y: (size.height - SCENE.height * zoom) / 2 }, size);
}
export function projectScenePoint(point: ScenePoint, camera: SceneCamera): ScenePoint {
  return { x: camera.x + point.x * SCENE.width * camera.zoom, y: camera.y + point.y * SCENE.height * camera.zoom };
}
export function unprojectScenePoint(point: ScenePoint, camera: SceneCamera): ScenePoint {
  return { x: (point.x - camera.x) / (SCENE.width * camera.zoom), y: (point.y - camera.y) / (SCENE.height * camera.zoom) };
}
export function zoomSceneAt(camera: SceneCamera, requested: number, anchor: ScenePoint, size: SceneSize): SceneCamera {
  const zoom = Math.max(containScale(size), Math.min(maximumSceneScale(size), requested));
  const ratio = zoom / camera.zoom;
  return constrainSceneCamera({ zoom, x: anchor.x - (anchor.x - camera.x) * ratio, y: anchor.y - (anchor.y - camera.y) * ratio }, size);
}
