import { base } from './portfolio';
import type { WorkId } from './clearing-map';
export type JourneyScene = {
  id: string;
  chapter: string;
  title: string;
  sentence: string;
  image: string;
  work: WorkId;
  action: string;
  object: { x: number; y: number; label: string };
  focal: string;
  kind?: 'clearing';
  fit?: 'cover' | 'contain';
};
const clearing: JourneyScene = {
  id: 'clearing',
  chapter: 'Paths from a clearing',
  title: 'A Clearing',
  sentence:
    'Choose a path through the surrounding landscape, or follow the walk and return here.',
  image: 'clearing-hub.webp',
  work: 'homeland-drawings',
  action: 'Open the drawings',
  object: { x: 0.273, y: 0.765, label: 'Open the drawings on the table' },
  focal: '50% 50%',
  kind: 'clearing',
  fit: 'contain',
};
export const journey: JourneyScene[] = [
  clearing,
  {
    id: 'fire',
    chapter: 'Fire at the urban edge',
    title: 'Wildfire as urban risk',
    sentence:
      'A fire is also what moves beyond it: smoke, disrupted systems, and uneven exposure.',
    image: 'fire.webp',
    work: 'wildfire',
    action: 'Read the research',
    object: { x: 0.548, y: 0.435, label: 'Follow the fire into urban systems' },
    focal: '50% 55%',
  },
  {
    id: 'home',
    chapter: 'Around the home',
    title: 'Where the Fire Stopped',
    sentence:
      'Closer to the house, landscape evidence becomes a question of design.',
    image: 'home.webp',
    work: 'defensible',
    action: 'Explore the research',
    object: { x: 0.42, y: 0.53, label: 'Explore the spaces around the home' },
    focal: '50% 55%',
  },
  {
    id: 'seasons',
    chapter: 'Along a seasonal path',
    title: 'Natural as Calendar',
    sentence:
      'A path can be read through the rhythms of plants, seasons, and memory.',
    image: 'seasons.webp',
    work: 'natural-as-calendar',
    action: 'Explore the project',
    object: { x: 0.605, y: 0.555, label: 'Read the seasonal landscape' },
    focal: '50% 56%',
  },
  {
    id: 'city',
    chapter: 'A place for young people',
    title: '#YCD2050',
    sentence:
      'The path enters a district shaped around youth, public space, and urban life.',
    image: 'city.webp',
    work: 'ycd2050',
    action: 'Explore the project',
    object: { x: 0.605, y: 0.645, label: 'Enter the youth district' },
    focal: '50% 52%',
  },
  {
    id: 'water',
    chapter: 'Living with water',
    title: 'Living with Water',
    sentence:
      'Buildings, gardens, and paths negotiate the changing edge of water.',
    image: 'water.webp',
    work: 'living-with-water',
    action: 'Explore the project',
    object: { x: 0.56, y: 0.65, label: 'Step onto the waterside path' },
    focal: '50% 57%',
  },
  {
    id: 'market',
    chapter: 'A place to gather',
    title: 'Bride Market',
    sentence: 'A temporary gathering asks how a community might take root.',
    image: 'market.webp',
    work: 'bride-market',
    action: 'Explore the project',
    object: { x: 0.6, y: 0.625, label: 'Explore the gathering space' },
    focal: '50% 53%',
  },
  {
    id: 'shore',
    chapter: 'At the shifting shore',
    title: 'Sediment Harvester',
    sentence:
      'The ground is still forming here, between moving water and settling sediment.',
    image: 'shore.webp',
    work: 'sediment-harvester',
    action: 'Explore the project',
    object: { x: 0.6, y: 0.665, label: 'Look at the shoreline structures' },
    focal: '50% 57%',
  },
  {
    id: 'ants',
    chapter: 'Closer to the ground',
    title: 'Ant Scape',
    sentence:
      'Another network appears when we change the scale of our attention.',
    image: '../ant-ground.png',
    work: 'ant-scape',
    action: 'Look through the lens',
    object: { x: 0.51, y: 0.63, label: 'Look closer at the ants' },
    focal: '50% 61%',
  },
  {
    id: 'homeland',
    chapter: 'A path of return',
    title: 'Back to Homeland',
    sentence:
      'Reconstruction is also the work of making everyday life and memory possible again.',
    image: 'homeland.webp',
    work: 'back-to-homeland',
    action: 'Explore the project',
    object: { x: 0.49, y: 0.46, label: 'Enter the reconstructed landscape' },
    focal: '50% 55%',
  },
  {
    ...clearing,
    id: 'return',
    chapter: 'Back in the clearing',
    sentence:
      'The paths meet here again. Look around and follow another connection.',
  },
];
export const sceneImage = (scene: JourneyScene) =>
  scene.image.startsWith('../')
    ? `${base}/images/${scene.image.slice(3)}`
    : `${base}/images/journey/${scene.image}`;
export const clearingPaths = [
  { scene: 'fire', x: 0.1, y: 0.194, label: 'Toward the fire and city' },
  { scene: 'home', x: 0.202, y: 0.338, label: 'Along the house garden' },
  { scene: 'seasons', x: 0.291, y: 0.441, label: 'Along the seasonal creek' },
  { scene: 'city', x: 0.499, y: 0.373, label: 'Into the youth district' },
  { scene: 'water', x: 0.827, y: 0.477, label: 'Toward the water settlement' },
  { scene: 'market', x: 0.893, y: 0.333, label: 'Through the market arcade' },
  { scene: 'shore', x: 0.82, y: 0.752, label: 'Along the shifting shore' },
  { scene: 'ants', x: 0.535, y: 0.933, label: 'Down to the ants' },
  { scene: 'homeland', x: 0.148, y: 0.462, label: 'Along the path of return' },
];
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
