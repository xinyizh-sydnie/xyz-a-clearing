import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const portfolioUrl = moduleUrl(compile('../lib/portfolio.ts'));
const mapCode = compile('../lib/clearing-map.ts').replace("'./portfolio'", JSON.stringify(portfolioUrl));
const { clearingCamera, focusCamera, fitCamera, zoomAt, movePoint, works, arrangements, connections, WORLD, ZOOM } = await import(moduleUrl(mapCode));
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
