import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const portfolioUrl = moduleUrl(compile('../lib/portfolio.ts'));
const mapCode = compile('../lib/clearing-map.ts').replace("'./portfolio'", JSON.stringify(portfolioUrl));
const { viewpointCamera, travelCamera, connectionsCamera, clearingCamera, focusCamera, fitCamera, zoomAt, movePoint, works, arrangements, connections, WORLD, ZOOM } = await import(moduleUrl(mapCode));
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
// Zooming keeps the world point under the pointer fixed, even at the bounds.
for (const initial of [{ x: -320, y: 110, zoom: .6 }, { x: 20, y: -45, zoom: 1.3 }]) {
  for (const anchor of [{ x: 0, y: 0 }, { x: 483, y: 217 }]) {
    for (const requested of [.01, .8, 1.7, 10]) {
      const next = zoomAt(initial, requested, anchor);
      near((anchor.x - initial.x) / initial.zoom, (anchor.x - next.x) / next.zoom);
      near((anchor.y - initial.y) / initial.zoom, (anchor.y - next.y) / next.zoom);
      assert.ok(next.zoom >= ZOOM.min && next.zoom <= ZOOM.max);
    }
  }
}
// Reset centers the world in a range of usable viewport sizes.
for (const size of [{ width: 340, height: 510 }, { width: 1100, height: 550 }, { width: 1600, height: 900 }]) {
  const camera = fitCamera(size);
  near(camera.x + WORLD.width * camera.zoom / 2, size.width / 2);
  near(camera.y + WORLD.height * camera.zoom / 2, size.height / 2);
}
// Pointer deltas correspond to equal screen distances at different scales.
for (const zoom of [.3, .5, 1.5]) {
  const next = movePoint({ x: 700, y: 500 }, { x: 30, y: -20 }, zoom);
  near((next.x - 700) * zoom, 30); near((next.y - 500) * zoom, -20);
}
assert.deepEqual(movePoint({ x: 100, y: 100 }, { x: -9999, y: 9999 }, .5), { x: 80, y: WORLD.height - 80 });
const ids = new Set(works.map(work => work.id));
assert.equal(ids.size, 10);
for (const positions of Object.values(arrangements)) {
  assert.deepEqual(new Set(Object.keys(positions)), ids);
  for (const point of Object.values(positions)) assert.ok(point.x > 0 && point.x < WORLD.width && point.y > 0 && point.y < WORLD.height);
}
const connected = new Set();
for (const edge of connections) {
  assert.ok(ids.has(edge.from) && ids.has(edge.to) && edge.from !== edge.to);
  connected.add(edge.from); connected.add(edge.to);
}
assert.deepEqual(connected, ids);
console.log('Camera anchors, pan/drag scaling, bounds, reset centering, and all ten connected works verified.');

// Entry views preserve human scale; a selected work stays above the detail panel.
for (const size of [{ width: 375, height: 535 }, { width: 1440, height: 680 }, { width: 1920, height: 830 }]) {
  const entry = clearingCamera(size);
  assert.ok(entry.zoom > fitCamera(size).zoom);
  assert.ok(entry.zoom >= ZOOM.min && entry.zoom <= ZOOM.max);
  for (const arrangement of ['clearing', 'connections']) {
    for (const point of Object.values(arrangements[arrangement])) {
      const camera = focusCamera(size, point, arrangement);
      const x = point.x * camera.zoom + camera.x;
      const y = point.y * camera.zoom + camera.y;
      assert.ok(x > 0 && x < size.width && y > 0 && y < size.height * .5);
      if (arrangement === 'clearing') assert.ok(camera.zoom > entry.zoom);
    }
  }
}
console.log('Immersive entrance and selected-work visibility verified at mobile and desktop sizes.');

// Camera travel must end exactly at the selected view and interpolate without scale jumps.
for (const size of [{ width: 375, height: 570 }, { width: 1440, height: 740 }]) {
 const shots = ['overlook','walk','close'].map(name => viewpointCamera(size,name));
 assert.ok(shots[0].zoom < shots[1].zoom && shots[1].zoom < shots[2].zoom);
 for(const [from,to] of [[shots[0],shots[2]],[shots[2],shots[0]]]) {
  for(const [t,expected] of [[0,from],[1,to]]) {const actual=travelCamera(from,to,size,t);for(const key of ['x','y','zoom'])near(actual[key],expected[key]);}
  let previous=from.zoom;
  for(let i=1;i<=100;i++) {const camera=travelCamera(from,to,size,i/100);assert.ok(Number.isFinite(camera.x)&&Number.isFinite(camera.y));assert.ok(camera.zoom>=ZOOM.min&&camera.zoom<=ZOOM.max);assert.ok(to.zoom>from.zoom?camera.zoom>=previous:camera.zoom<=previous);previous=camera.zoom;}
 }
 const network=connectionsCamera(size);assert.ok(network.zoom>=.45);
}
const researchUrl=moduleUrl(compile('../lib/research.ts').replace("'./portfolio'",JSON.stringify(portfolioUrl)));
const {landSettings,paperFigures}=await import(researchUrl);
near(landSettings.reduce((n,s)=>n+s.fire,0),100);
near(landSettings.reduce((n,s)=>n+s.research,0),100);
near(landSettings[1].fire,28.7);near(landSettings[1].research,.9);
assert.deepEqual(paperFigures.map(f=>f.number),[1,2,3,4,5,6,7,8,9,10]);
for(const f of paperFigures)assert.ok(f.page>=1&&f.page<=26);
console.log('Near/far travel endpoints, monotonic zoom, readable network scale, and published research shares verified.');

const journeyModule=await import(moduleUrl(compile('../lib/journey.ts').replace("'./portfolio'",JSON.stringify(portfolioUrl))));
const {journey,journeyFrame,clearingViews,wrapBearing,boundJourneyCamera,scenePoint}=journeyModule;
assert.equal(journey[0].work,'wildfire');
assert.equal(journey.at(-1).id,'clearing');
assert.deepEqual(new Set(journey.map(scene=>scene.work)),ids);
assert.equal(new Set(journey.map(scene=>scene.image)).size,10);
// Native scroll can overshoot either end without losing a valid scene.
for(const position of [-100,0,.61,.81,.999,1,4.7,8.999,9,100]) {
 const frame=journeyFrame(position);
 assert.ok(journey[frame.index]&&journey[frame.next]);
 assert.ok(frame.blend>=0&&frame.blend<=1);
 assert.equal(frame.arrived,position>=8.999);
}
for(let index=1;index<journey.length;index++) {
 const before=journeyFrame(index-.000001),after=journeyFrame(index);
 assert.equal(before.next,after.index);assert.ok(before.blend>.999);
}
// Repeated left/right turns remain on the ring and return to the same view.
for(let bearing=-100;bearing<100;bearing++) {
 assert.ok(journey[clearingViews[wrapBearing(bearing)]]);
 assert.equal(wrapBearing(bearing),wrapBearing(bearing+clearingViews.length));
 assert.equal(wrapBearing(wrapBearing(bearing)+1-1),wrapBearing(bearing));
}
// Pan and zoom must never reveal an empty edge, including after zooming out.
for(const size of [{width:375,height:510},{width:1440,height:560},{width:820,height:820}]) {
 for(const zoom of [.5,1,1.5,2,3,9])for(const x of [-9000,0,9000])for(const y of [-9000,0,9000]) {
  const camera=boundJourneyCamera({zoom,x,y},size);
  const left=(1-camera.zoom)*size.width*.5+camera.x;
  const top=(1-camera.zoom)*size.height*.6+camera.y;
  assert.ok(left<=1e-8&&left+size.width*camera.zoom>=size.width-1e-8);
  assert.ok(top<=1e-8&&top+size.height*camera.zoom>=size.height-1e-8);
  const reset=boundJourneyCamera({...camera,zoom:1},size);
  near(reset.x,0);near(reset.y,0);
 }
 for(const scene of journey){const point=scenePoint(scene,size);assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));}
}
console.log('All ten journey destinations, continuous scene boundaries, circular views, and gap-free pan/zoom verified.');

for(const scene of journey) {
 const file = new URL('../public/images/journey/'+scene.image,import.meta.url);
 assert.ok(existsSync(file),`Missing scene: ${scene.id}`);
}
console.log('Every scene asset is present.');
