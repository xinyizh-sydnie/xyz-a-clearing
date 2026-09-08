'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Maximize2, Minimize2, Minus, Plus, Scan, Eye, Map as MapIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearingPaths, journey, sceneImage, type JourneyScene } from '@/lib/journey';
import type { WorkId } from '@/lib/clearing-map';
import { SCENE, constrainSceneCamera, coverScale, placeCamera, overviewCamera, projectScenePoint, unprojectScenePoint, zoomSceneAt, maximumSceneScale, containScale, type SceneCamera, type ScenePoint } from '@/lib/scene-camera';

type Props = { scene: JourneyScene; onEnter: (index: number) => void; onOpen: (id: WorkId) => void; onNext: () => void; onPrevious: () => void; atStart: boolean; atEnd: boolean };
type Contact = { x: number; y: number; lastX: number; lastY: number; moved: boolean };

export function ImmersiveScene({ scene, onEnter, onOpen, onNext, onPrevious, atStart, atEnd }: Props) {
  const root = useRef<HTMLDivElement>(null), world = useRef<HTMLDivElement>(null);
  const markers = useRef(new Map<string, HTMLButtonElement>());
  const size = useRef({ width: 1200, height: 740 });
  const camera = useRef(placeCamera(size.current));
  const contacts = useRef(new Map<number, Contact>()), pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const cursor = useRef<ScenePoint | null>(null), pendingPaint = useRef(0);
  const overviewRef = useRef(false);
  const [overview, setOverview] = useState(false), [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false), [close, setClose] = useState(false), [help, setHelp] = useState(false);
  const [limits, setLimits] = useState({ minimum: false, maximum: false });
  overviewRef.current = overview;
  const clearing = scene.kind === 'clearing';
  const points = [...(clearing ? clearingPaths.map(path => ({ ...path, id: path.scene, destination: path.scene })) : []), { ...scene.object, id: 'project', destination: '' }];
  const pointsRef = useRef(points); pointsRef.current = points;

  const paint = useCallback(() => {
    pendingPaint.current = 0;
    if (!world.current) return;
    const view = camera.current;
    world.current.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.zoom})`;
    world.current.style.visibility = 'visible';
    world.current.style.setProperty('--marker-scale', String(1 / view.zoom));
    for (const point of pointsRef.current) {
      const element = markers.current.get(point.id); if (!element) continue;
      const projected = projectScenePoint(point, view);
      const distance = cursor.current ? Math.hypot(projected.x - cursor.current.x, projected.y - cursor.current.y) : Infinity;
      const proximity = Math.max(0, 1 - distance / 200);
      element.style.setProperty('--presence', String(overviewRef.current ? .8 : .28 + proximity * .72));
      element.dataset.near = String(distance < 105);
    }
  }, []);
  // Paint only in response to an input or resize. No idle camera animation or interpolation.
  const queuePaint = useCallback(() => {
    if (!pendingPaint.current) pendingPaint.current = requestAnimationFrame(paint);
  }, [paint]);
  const setView = useCallback((view: SceneCamera) => {
    camera.current = constrainSceneCamera(view, size.current);
    setClose(camera.current.zoom > coverScale(size.current) * 1.08);
    setLimits({ minimum: camera.current.zoom <= containScale(size.current) + .00001, maximum: camera.current.zoom >= maximumSceneScale(size.current) - .00001 });
    queuePaint();
  }, [queuePaint]);
  useEffect(() => () => cancelAnimationFrame(pendingPaint.current), []);
  useEffect(() => {
    if (!root.current) return;
    const measure = new ResizeObserver(([entry]) => {
      const oldSize = size.current;
      const center = unprojectScenePoint({ x: oldSize.width / 2, y: oldSize.height / 2 }, camera.current);
      const distance = camera.current.zoom / coverScale(oldSize);
      size.current = { width: Math.max(1, entry.contentRect.width), height: Math.max(1, entry.contentRect.height) };
      setView(overviewRef.current ? overviewCamera(size.current) : placeCamera(size.current, center, distance));
    });
    measure.observe(root.current);
    return () => measure.disconnect();
  }, [setView]);
  useEffect(() => {
    setOverview(false); setHelp(false); setDragging(false);
    contacts.current.clear(); pinch.current = null; cursor.current = null;
    setView(placeCamera(size.current));
  }, [scene.id, setView]);
  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false); };
    document.addEventListener('keydown', escape);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', escape); };
  }, [expanded]);

  function normalView() { setOverview(false); setView(placeCamera(size.current)); }
  function showOverview() { setOverview(true); setView(overviewCamera(size.current)); }
  function zoom(factor: number, anchor = { x: size.current.width / 2, y: size.current.height / 2 }) {
    setOverview(false);
    setView(zoomSceneAt(camera.current, camera.current.zoom * factor, anchor, size.current));
  }
  function enter(destination: string) {
    const index = journey.findIndex(place => place.id === destination);
    if (index >= 0) onEnter(index);
  }
  function pan(x: number, y: number) {
    setOverview(false);
    setView({ ...camera.current, x: camera.current.x + x, y: camera.current.y + y });
  }
  function leavePointer(id: number) {
    contacts.current.delete(id); pinch.current = null; setDragging(contacts.current.size > 0);
  }
  const buttonTarget = (element: EventTarget) => (element as HTMLElement).closest('button, a, summary, .scene-hud');
  return (
    <div ref={root} className={`immersive-scene ${expanded ? 'is-expanded' : ''} ${overview ? 'is-overview' : ''} ${dragging ? 'is-dragging' : ''} ${close ? 'is-close' : ''}`}
      tabIndex={0} role="region" aria-label={`${scene.title}. Drag to explore. Hover over a path to reveal its destination. Scroll to walk, or use the next and previous controls. Plus and minus change viewing distance. Home shows the whole landscape.`}
      style={{ touchAction: close || expanded ? 'none' : 'pan-y' }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key)) event.preventDefault();
        if (event.key === 'ArrowLeft') pan(size.current.width * .22, 0);
        if (event.key === 'ArrowRight') pan(-size.current.width * .22, 0);
        if (event.key === 'ArrowUp') pan(0, size.current.height * .2);
        if (event.key === 'ArrowDown') pan(0, -size.current.height * .2);
        if (event.key === '+' || event.key === '=') zoom(1.35);
        if (event.key === '-') zoom(1 / 1.35);
        if (event.key === 'Home') showOverview();
      }}
      onPointerDown={event => {
        if (event.button > 0 || buttonTarget(event.target)) return;
        contacts.current.set(event.pointerId, { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false });
        event.currentTarget.setPointerCapture(event.pointerId);
        if (contacts.current.size === 2) {
          const [a,b] = [...contacts.current.values()];
          a.moved = true; b.moved = true;
          pinch.current = { distance: Math.hypot(a.lastX-b.lastX, a.lastY-b.lastY), zoom: camera.current.zoom };
        }
      }}
      onPointerMove={event => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
        cursor.current = point;
        const contact = contacts.current.get(event.pointerId);
        if (!contact) { queuePaint(); return; }
        const dx = event.clientX - contact.lastX, dy = event.clientY - contact.lastY;
        contact.lastX = event.clientX; contact.lastY = event.clientY;
        if (Math.hypot(event.clientX-contact.x, event.clientY-contact.y) > 5) contact.moved = true;
        if (contacts.current.size === 2 && pinch.current) {
          const [a,b] = [...contacts.current.values()];
          const distance = Math.hypot(a.lastX-b.lastX, a.lastY-b.lastY);
          const anchor = { x: (a.lastX+b.lastX)/2-bounds.left, y: (a.lastY+b.lastY)/2-bounds.top };
          setView(zoomSceneAt(camera.current, pinch.current.zoom * distance / Math.max(1, pinch.current.distance), anchor, size.current));
          setOverview(false); setDragging(true); return;
        }
        if (!contact.moved) return;
        setDragging(true); setOverview(false);
        setView({ ...camera.current, x: camera.current.x + dx, y: camera.current.y + dy });
      }}
      onPointerUp={event => leavePointer(event.pointerId)}
      onPointerCancel={event => leavePointer(event.pointerId)}
      onLostPointerCapture={event => leavePointer(event.pointerId)}
      onPointerLeave={() => { cursor.current = null; queuePaint(); }}>
      <div ref={world} className="scene-world" style={{ width: SCENE.width, height: SCENE.height }}>
        <img className="scene-painting scene-base" src={sceneImage(scene)} alt="" draggable={false} decoding="async" fetchPriority={clearing ? 'high' : 'auto'} />
        {points.map(point => <button key={`${scene.id}-${point.id}`} ref={element => { if (element) markers.current.set(point.id,element); else markers.current.delete(point.id); }}
          className={`scene-entry ${point.id === 'project' ? 'is-project' : ''}`} style={{ left: point.x * SCENE.width, top: point.y * SCENE.height }} aria-label={point.label}
          onClick={() => point.destination ? enter(point.destination) : onOpen(scene.work)}
          onFocus={event => { if (!event.currentTarget.matches(':focus-visible')) return; const location = projectScenePoint(point, camera.current); if (location.x < 30 || location.x > size.current.width - 30 || location.y < 30 || location.y > size.current.height - 30) setView(placeCamera(size.current, point, camera.current.zoom / coverScale(size.current))); }}>
          <span className="scene-entry-ring">{point.destination ? <ArrowUpRight size={15} /> : scene.work === 'ant-scape' ? <Scan size={16} /> : <Plus size={15} />}</span>
          <span className="scene-entry-label">{point.label}</span>
        </button>)}
      </div>
      <div className="scene-hud scene-heading">
        {!clearing && <Button variant="ghost" className="scene-home" onClick={() => onEnter(0)}><ArrowLeft size={15} /> A Clearing</Button>}
        <span className="scene-place">{clearing ? 'A Clearing' : scene.chapter}</span>
      </div>
      <div className="scene-hud scene-tools" aria-label="Viewing controls">
        <Button variant="ghost" size="icon" aria-label="Look closer" disabled={limits.maximum} onClick={() => zoom(1.35)}><Plus size={18}/></Button>
        <Button variant="ghost" size="icon" aria-label="Step back" disabled={limits.minimum} onClick={() => zoom(1/1.35)}><Minus size={18}/></Button>
        <Button variant="ghost" size="icon" aria-label={overview ? 'Return to eye level' : 'See the whole landscape'} onClick={overview ? normalView : showOverview}>{overview ? <Eye size={17}/> : <MapIcon size={17}/>}</Button>
        <Button variant="ghost" size="icon" aria-label={expanded ? 'Leave immersive view' : 'Enter immersive view'} aria-pressed={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? <Minimize2 size={17}/> : <Maximize2 size={17}/>}</Button>
      </div>
      <div className="scene-hud scene-story">
        {!clearing && <><h2>{scene.title}</h2><p>{scene.sentence}</p><Button variant="ghost" className="scene-read" onClick={() => onOpen(scene.work)}>{scene.action}<ArrowUpRight size={16}/></Button></>}
        {clearing && <p className="clearing-whisper">A place to pause.<br/>A path into each landscape.</p>}
      </div>
      <div className="scene-hud scene-foot">
        <Button variant="ghost" className="scene-help-toggle" aria-expanded={help} onClick={() => setHelp(!help)}>{help ? 'Close guide' : overview ? 'Choose a path' : 'Explore'}{help ? <X size={14}/> : <Eye size={15}/>}</Button>
        <span className="scene-walk-hint">{expanded ? 'Follow a path' : 'Scroll to walk'}</span>
        <div className="scene-walk-controls">
          <Button variant="ghost" size="icon" disabled={atStart} aria-label="Previous place" onClick={onPrevious}><ArrowLeft size={18}/></Button>
          <Button variant="ghost" onClick={atEnd ? () => onEnter(0) : onNext}>{atEnd ? 'Return' : 'Walk on'}<ArrowRight size={18}/></Button>
        </div>
      </div>
      {help && <div className="scene-hud scene-guide" role="status"><p>Drag to look around. Hover over a path to reveal its destination, then click to enter.</p><p>Follow a small arrow into a project. Use + / − to change distance, or the map to see the whole landscape.</p><p className="scene-touch-guide">On a touch screen, swipe sideways to look around. Zoom in to explore in every direction.</p></div>}
    </div>
  );
}
