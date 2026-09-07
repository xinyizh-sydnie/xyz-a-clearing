'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Minus,
  Plus,
  RotateCcw,
  Scan,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClearingExplorer } from '@/components/clearing/explorer';
import { AntLens } from '@/components/clearing/ant-lens';
import {
  journey,
  journeyFrame,
  clearingPaths,
  sceneImage,
  boundJourneyCamera,
  scenePoint,
  type JourneyScene,
} from '@/lib/journey';
import type { WorkId } from '@/lib/clearing-map';

type ViewCamera = { zoom: number; x: number; y: number };
const origin: ViewCamera = { zoom: 1, x: 0, y: 0 };
export function SceneJourney({
  onOpen,
  visited,
}: {
  onOpen: (id: WorkId) => void;
  visited: string[];
}) {
  const [mode, setMode] = useState('walk');
  const [barHeight, setBarHeight] = useState(46);
  const topbar = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);
  const [traveling, setTraveling] = useState(false);
  const travelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [antOpen, setAntOpen] = useState(false);
  const [camera, setCamera] = useState<ViewCamera>(origin);
  const [dragging, setDragging] = useState(false);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 1200, height: 620 });
  const scrollRoot = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const positionRef = useRef(0);
  const pointer = useRef<{ x: number; y: number; pan: ViewCamera } | null>(
    null,
  );
  const frame = journeyFrame(position);
  const displayedIndex = frame.blend >= 0.5 ? frame.next : frame.index;
  const current = journey[displayedIndex];
  const inClearing = current.kind === 'clearing';
  const last = journey.length - 1;
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const change = () => setReducedMotion(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  const geometry = useCallback(() => {
    const root = scrollRoot.current,
      stage = sticky.current;
    if (!root || !stage) return null;
    return {
      top:
        root.getBoundingClientRect().top +
        window.scrollY -
        (topbar.current?.offsetHeight ?? 46),
      step: Math.max(
        1,
        (root.offsetHeight - stage.offsetHeight) / journey.length,
      ),
    };
  }, []);
  useEffect(() => {
    if (mode !== 'walk') return;
    let pending = 0;
    const measure = () => {
      pending = 0;
      const geo = geometry();
      if (!geo) return;
      const next = Math.max(
        0,
        Math.min(last, (window.scrollY - geo.top) / geo.step),
      );
      positionRef.current = next;
      setPosition(next);
    };
    const queue = () => {
      if (!pending) pending = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    return () => {
      cancelAnimationFrame(pending);
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
    };
  }, [mode, geometry, last]);
  useEffect(() => {
    if (!topbar.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setBarHeight(entry.target.getBoundingClientRect().height),
    );
    observer.observe(topbar.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [viewport]);
  useEffect(() => {
    setCamera((old) => boundJourneyCamera(old, size));
  }, [size]);
  useEffect(() => {
    setCamera(origin);
  }, [displayedIndex]);
  useEffect(
    () => () => {
      if (travelTimer.current) clearTimeout(travelTimer.current);
    },
    [],
  );
  useEffect(() => {
    const candidates = new Set([
      frame.index,
      frame.next,
      Math.min(last, frame.next + 1),
    ]);
    for (const index of candidates) {
      const img = new Image();
      img.src = sceneImage(journey[index]);
    }
  }, [frame.index, frame.next, frame.arrived, last]);

  function seek(index: number, smooth = false) {
    if (travelTimer.current) clearTimeout(travelTimer.current);
    setTraveling(false);
    setCamera(origin);
    const geo = geometry();
    if (!geo) return;
    window.scrollTo({
      top: geo.top + Math.max(0, Math.min(last, index)) * geo.step,
      behavior: smooth && !reducedMotion ? 'smooth' : 'instant',
    });
  }
  function changeMode(value: string) {
    if (travelTimer.current) clearTimeout(travelTimer.current);
    setTraveling(false);
    const remembered = positionRef.current;
    setMode(value);
    requestAnimationFrame(() => {
      if (value === 'walk') seek(remembered);
      else
        shell.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
  function turn(direction: number) {
    setCamera((old) =>
      boundJourneyCamera(
        {
          ...old,
          zoom: Math.max(1.7, old.zoom),
          x: old.x - direction * size.width * 0.25,
        },
        size,
      ),
    );
  }
  function enterScene(path: (typeof clearingPaths)[number]) {
    const index = journey.findIndex((scene) => scene.id === path.scene);
    if (index < 0 || traveling) return;
    if (reducedMotion) {
      seek(index);
      return;
    }
    const image = new Image();
    image.src = sceneImage(journey[index]);
    const point = scenePoint({ ...current, object: path }, size);
    const zoom = 2;
    setTraveling(true);
    setCamera(
      boundJourneyCamera(
        {
          zoom,
          x: (size.width * 0.5 - point.x) * zoom,
          y:
            size.height * 0.55 -
            (size.height * 0.6 + (point.y - size.height * 0.6) * zoom),
        },
        size,
      ),
    );
    travelTimer.current = setTimeout(() => seek(index), 600);
  }
  function openWork(id: WorkId) {
    if (id === 'ant-scape') setAntOpen(true);
    else onOpen(id);
  }
  function changeZoom(delta: number) {
    setCamera((old) => {
      const zoom = Math.max(1, Math.min(3, old.zoom + delta));
      return boundJourneyCamera({ ...old, zoom }, size);
    });
  }
  function layer(
    scene: JourneyScene,
    opacity: number,
    scale: number,
    key: string,
    interactive = false,
  ) {
    const detail = (
      point: JourneyScene['object'],
      action: () => void,
      id: string,
      pathScene?: string,
    ) => {
      const { x, y } = scenePoint({ ...scene, object: point }, size);
      if (x < 20 || x > size.width - 20 || y < 20 || y > size.height - 20)
        return null;
      return (
        <button
          key={id}
          className={`scene-detail ${pathScene ? 'is-path-detail' : ''}`}
          style={{ left: x, top: y }}
          onClick={action}
          disabled={traveling}
          aria-label={point.label}
          onPointerEnter={() => {
            if (pathScene) {
              const next = journey.find((place) => place.id === pathScene);
              if (next) {
                const img = new Image();
                img.src = sceneImage(next);
              }
            }
          }}
        >
          <span>
            <Plus size={16} />
          </span>
          <span className="scene-detail-label">{point.label}</span>
        </button>
      );
    };
    return (
      <div
        key={key}
        className="journey-scene-layer"
        style={{
          opacity,
          transform: `translate(${camera.x}px,${camera.y}px) scale(${camera.zoom * scale})`,
          pointerEvents: interactive ? 'auto' : 'none',
        }}
      >
        <img
          src={sceneImage(scene)}
          className="journey-art"
          style={{
            objectPosition: scene.focal,
            objectFit: scene.fit || 'cover',
          }}
          alt=""
          draggable={false}
          decoding="async"
          fetchPriority={scene.kind === 'clearing' ? 'high' : 'auto'}
        />
        {interactive && (
          <>
            {scene.kind === 'clearing' &&
              clearingPaths.map((path) =>
                detail(path, () => enterScene(path), path.scene, path.scene),
              )}
            {detail(scene.object, () => openWork(scene.work), 'project')}
          </>
        )}
      </div>
    );
  }
  return (
    <div
      ref={shell}
      className="journey-shell"
      style={
        { '--journey-bar-height': `${barHeight}px` } as React.CSSProperties
      }
    >
      <Tabs value={mode} onValueChange={changeMode} className="journey-tabs">
        <div ref={topbar} className="journey-topbar">
          <TabsList
            aria-label="Ways to explore"
            className="journey-mode-switch"
          >
            <TabsTrigger value="walk">Along the path</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
          </TabsList>
          {mode === 'walk' && (
            <Button
              variant="ghost"
              className="jump-clearing"
              onClick={() => seek(inClearing ? 1 : 0)}
            >
              {inClearing ? (
                <>
                  Walk the path <ArrowRight size={15} />
                </>
              ) : (
                <>
                  <ArrowLeft size={15} /> Back to the clearing
                </>
              )}
            </Button>
          )}
        </div>
        <TabsContent value="walk" className="walk-content">
          <div
            ref={scrollRoot}
            className="journey-scroll"
            style={{
              height: `calc(var(--journey-height) + var(--journey-step) * ${journey.length})`,
            }}
          >
            <div ref={sticky} className="journey-sticky">
              <div className="journey-location-bar">
                <span className="journey-chapter" aria-live="polite">
                  {current.chapter}
                </span>
                <Select
                  value={inClearing ? 'clearing' : current.id}
                  onValueChange={(value) => {
                    const index = journey.findIndex(
                      (scene) => scene.id === value,
                    );
                    if (index >= 0) seek(index);
                  }}
                >
                  <SelectTrigger
                    className="journey-location-select"
                    aria-label="Go to a place along the path"
                  >
                    <SelectValue>Places along the path</SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    className="journey-place-options"
                    alignItemWithTrigger={false}
                  >
                    {journey
                      .filter((scene) => scene.id !== 'return')
                      .map((scene) => (
                        <SelectItem key={scene.id} value={scene.id}>
                          {scene.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div
                ref={setViewport}
                className={`journey-viewport ${inClearing ? 'has-arrived' : ''} ${traveling ? 'is-departing' : ''} ${dragging ? 'is-dragging' : ''} ${camera.zoom > 1 ? 'is-close' : ''}`}
                tabIndex={0}
                role="region"
                aria-label={
                  inClearing
                    ? 'A Clearing connects the surrounding landscapes. Select a path to enter a scene. Drag horizontally or use left and right arrows to look around.'
                    : 'Walk through the landscapes by scrolling. Use left and right arrow keys to move between scenes. Select a detail to explore a project.'
                }
                style={{ touchAction: camera.zoom > 1 ? 'none' : 'pan-y' }}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                    event.preventDefault();
                    const direction = event.key === 'ArrowRight' ? 1 : -1;
                    if (inClearing) turn(direction);
                    else seek(displayedIndex + direction, true);
                  }
                  if (event.key === '+' || event.key === '=') {
                    event.preventDefault();
                    changeZoom(0.5);
                  }
                  if (event.key === '-') {
                    event.preventDefault();
                    changeZoom(-0.5);
                  }
                  if (event.key === 'Home') {
                    event.preventDefault();
                    seek(0);
                  }
                }}
                onPointerDown={(event) => {
                  if (
                    traveling ||
                    (event.target as HTMLElement).closest('button') ||
                    event.button > 0
                  )
                    return;
                  pointer.current = {
                    x: event.clientX,
                    y: event.clientY,
                    pan: camera,
                  };
                  if (camera.zoom > 1 || inClearing) {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setDragging(true);
                  }
                }}
                onPointerMove={(event) => {
                  if (!pointer.current || camera.zoom === 1) return;
                  const start = pointer.current;
                  setCamera(
                    boundJourneyCamera(
                      {
                        ...start.pan,
                        x: start.pan.x + event.clientX - start.x,
                        y: start.pan.y + event.clientY - start.y,
                      },
                      size,
                    ),
                  );
                }}
                onPointerUp={(event) => {
                  const start = pointer.current;
                  if (
                    start &&
                    inClearing &&
                    camera.zoom === 1 &&
                    Math.abs(event.clientX - start.x) > 50 &&
                    Math.abs(event.clientX - start.x) >
                      Math.abs(event.clientY - start.y)
                  )
                    turn(event.clientX < start.x ? 1 : -1);
                  pointer.current = null;
                  setDragging(false);
                }}
                onPointerCancel={() => {
                  pointer.current = null;
                  setDragging(false);
                }}
                onLostPointerCapture={() => {
                  pointer.current = null;
                  setDragging(false);
                }}
              >
                {reducedMotion || frame.arrived ? (
                  layer(current, 1, 1, current.id, true)
                ) : (
                  <>
                    {layer(
                      journey[frame.index],
                      1 - frame.blend,
                      1 + frame.local * 0.1,
                      `out-${frame.index}`,
                      frame.blend < 0.35,
                    )}
                    {frame.next !== frame.index &&
                      layer(
                        journey[frame.next],
                        frame.blend,
                        1.07 - frame.blend * 0.07,
                        `in-${frame.next}`,
                        frame.blend > 0.65,
                      )}
                  </>
                )}
                <div className="journey-zoom" aria-label="Look closer">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Look closer"
                    disabled={camera.zoom >= 3}
                    onClick={() => changeZoom(0.5)}
                  >
                    <Plus size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Step back"
                    disabled={camera.zoom <= 1}
                    onClick={() => changeZoom(-0.5)}
                  >
                    <Minus size={16} />
                  </Button>
                  {camera.zoom > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Reset viewing distance"
                      onClick={() => setCamera(origin)}
                    >
                      <RotateCcw size={15} />
                    </Button>
                  )}
                </div>
                {inClearing && (
                  <div className="clearing-look-controls">
                    <Button
                      variant="ghost"
                      onClick={() => turn(-1)}
                      aria-label="Look across the left side of the clearing"
                    >
                      <ArrowLeft size={16} /> Look left
                    </Button>
                    <Button
                      variant="ghost"
                      className="whole-clearing"
                      onClick={() => setCamera(origin)}
                    >
                      Whole clearing
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => turn(1)}
                      aria-label="Look across the right side of the clearing"
                    >
                      Look right <ArrowRight size={16} />
                    </Button>
                  </div>
                )}
              </div>
              <div className="journey-caption">
                <div>
                  <p className="eyebrow">
                    {inClearing
                      ? 'A shared landscape'
                      : current.work === 'wildfire' ||
                          current.work === 'defensible'
                        ? 'Research'
                        : 'Landscape & design'}
                  </p>
                  <h2>{current.title}</h2>
                  <p className="scene-sentence">{current.sentence}</p>
                </div>
                <Button
                  variant="ghost"
                  className="scene-open"
                  onClick={() => openWork(current.work)}
                >
                  {current.action}
                  {current.work === 'ant-scape' ? (
                    <Scan size={17} />
                  ) : (
                    <ArrowUpRight size={17} />
                  )}
                </Button>
              </div>
              <div className="journey-navigation">
                <Button
                  variant="ghost"
                  onClick={() =>
                    seek(
                      Math.max(0, (frame.arrived ? last : displayedIndex) - 1),
                      true,
                    )
                  }
                  disabled={position <= 0}
                  aria-label="Previous place"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </Button>
                <div className="journey-progress" aria-hidden="true">
                  <span style={{ width: `${(position / last) * 100}%` }} />
                </div>
                <span className="journey-scroll-hint">
                  {inClearing ? (
                    'Choose a path'
                  ) : (
                    <>
                      Scroll to walk <ArrowDown size={12} />
                    </>
                  )}
                </span>
                {frame.arrived ? (
                  <Button
                    variant="ghost"
                    onClick={() => seek(0)}
                    aria-label="Return to the beginning"
                  >
                    Beginning <RotateCcw size={14} />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      seek(Math.min(last, displayedIndex + 1), true)
                    }
                    aria-label="Walk to the next place"
                  >
                    <span>Continue</span>
                    <ArrowRight size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="connections" className="journey-connections">
          <ClearingExplorer networkOnly onOpen={openWork} visited={visited} />
        </TabsContent>
      </Tabs>
      <AntLens
        open={antOpen}
        onClose={() => setAntOpen(false)}
        onPortfolio={() => {
          setAntOpen(false);
          onOpen('ant-scape');
        }}
      />
    </div>
  );
}
