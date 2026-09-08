'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Maximize2, Minimize2, Minus, Plus, Scan, Eye, Map as MapIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearingPaths, journey, sceneImage, type JourneyScene } from '@/lib/journey';
import type { WorkId } from '@/lib/clearing-map';
import { SCENE, constrainSceneCamera, coverScale, placeCamera, overviewCamera, projectScenePoint, unprojectScenePoint, zoomSceneAt, easeSceneCamera, type SceneCamera, type ScenePoint } from '@/lib/scene-camera';

type Props = { scene: JourneyScene; progress: number; reducedMotion: boolean; onEnter: (index: number) => void; onOpen: (id: WorkId) => void; onNext: () => void; onPrevious: () => void; atStart: boolean; atEnd: boolean };
type Contact = { x: number; y: number; lastX: number; lastY: number; start: SceneCamera; moved: boolean; type: string };

export function ImmersiveScene({ scene, progress, reducedMotion, onEnter, onOpen, onNext, onPrevious, atStart, atEnd }: Props) {
  const root = useRef<HTMLDivElement>(null), world = useRef<HTMLDivElement>(null);
  const nearPlane = useRef<HTMLImageElement>(null), farPlane = useRef<HTMLImageElement>(null);
  const markers = useRef(new Map<string, HTMLButtonElement>());
  const size = useRef({ width: 1200, height: 740 });
  const camera = useRef(placeCamera(size.current)), target = useRef(camera.current);
  const look = useRef({ x: 0, y: 0 }), lookTarget = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const contacts = useRef(new Map<number, Contact>()), pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const cursor = useRef<ScenePoint | null>(null), manual = useRef(false);
  const visible = useRef(true), overviewRef = useRef(false), reducedRef = useRef(reducedMotion);
  const sceneRef = useRef(scene), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const oldScene = useRef(scene);
  const [previous, setPrevious] = useState<{ scene: JourneyScene; view: SceneCamera } | null>(null);
  const [overview, setOverview] = useState(false), [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false), [leaving, setLeaving] = useState(false);
  const [close, setClose] = useState(false), [help, setHelp] = useState(false);
  sceneRef.current = scene; reducedRef.current = reducedMotion; overviewRef.current = overview;
  const clearing = scene.kind === 'clearing';
  const points = [...(clearing ? clearingPaths.map(path => ({ ...path, id: path.scene, destination: path.scene })) : []), { ...scene.object, id: 'project', destination: '' }];
  const pointsRef = useRef(points); pointsRef.current = points;

  useEffect(() => {
    if (!root.current) return;
    const measure = new ResizeObserver(([entry]) => {
      const oldSize = size.current;
      const center = unprojectScenePoint({ x: oldSize.width / 2, y: oldSize.height / 2 }, target.current);
      const distance = target.current.zoom / coverScale(oldSize);
      size.current = { width: Math.max(1, entry.contentRect.width), height: Math.max(1, entry.contentRect.height) };
      target.current = overviewRef.current ? overviewCamera(size.current) : placeCamera(size.current, center, distance);
      camera.current = target.current;
    });
    measure.observe(root.current);
    const intersection = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting; }, { rootMargin: '80px' });
    intersection.observe(root.current);
    return () => { measure.disconnect(); intersection.disconnect(); };
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    setLeaving(false); setOverview(false); setClose(false); setHelp(false);
    manual.current = false; contacts.current.clear(); velocity.current = { x: 0, y: 0 };
    look.current = { x: 0, y: 0 }; lookTarget.current = { x: 0, y: 0 };
    if (oldScene.current.id !== scene.id && !reducedMotion) setPrevious({ scene: oldScene.current, view: { ...camera.current } });
    target.current = placeCamera(size.current);
    camera.current = reducedMotion ? target.current : placeCamera(size.current, { x: .5, y: .55 }, 1.31);
    oldScene.current = scene;
    const fade = setTimeout(() => setPrevious(null), 800);
    return () => clearTimeout(fade);
  }, [scene.id, reducedMotion]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (manual.current || reducedMotion) return;
    // Native page scrolling advances the viewpoint toward the subject before the next place.
    const amount = Math.min(.58, progress) / .58;
    target.current = placeCamera(size.current, { x: .5 + (scene.object.x - .5) * amount * .3, y: .55 + (scene.object.y - .55) * amount * .3 }, 1.14 + amount * .22);
  }, [progress, scene, reducedMotion]);
  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false); };
    document.addEventListener('keydown', escape);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', escape); };
  }, [expanded]);

  useEffect(() => {
    let animation = 0, last = 0;
    const draw = (time: number) => {
      const dt = Math.min(40, time - (last || time)); last = time;
      if (visible.current && world.current) {
        const reduced = reducedRef.current;
        if (reduced) velocity.current = { x: 0, y: 0 };
        if (contacts.current.size === 0 && (Math.abs(velocity.current.x) > .05 || Math.abs(velocity.current.y) > .05)) {
          target.current = constrainSceneCamera({ ...target.current, x: target.current.x + velocity.current.x * dt / 16.67, y: target.current.y + velocity.current.y * dt / 16.67 }, size.current);
          const decay = Math.exp(-dt / 125); velocity.current.x *= decay; velocity.current.y *= decay;
        }
        const follow = reduced ? 1 : 1 - Math.exp(-dt / 150);
        look.current.x += (lookTarget.current.x - look.current.x) * follow;
        look.current.y += (lookTarget.current.y - look.current.y) * follow;
        const drift = reduced || overviewRef.current ? { x: 0, y: 0 } : look.current;
        const desired = constrainSceneCamera({ ...target.current, x: target.current.x + drift.x, y: target.current.y + drift.y }, size.current);
        camera.current = easeSceneCamera(camera.current, desired, dt, reduced);
        const view = camera.current;
        world.current.style.transform = `translate3d(${view.x}px,${view.y}px,0) scale(${view.zoom})`;
        world.current.style.setProperty('--marker-scale', String(1 / view.zoom));
        // Composite the supplied painting at three viewing depths. Soft masks preserve its edges.
        // These are runtime image layers; the original artwork remains intact.
        if (nearPlane.current) nearPlane.current.style.transform = `translate3d(${drift.x * .7 / view.zoom}px,${drift.y * .65 / view.zoom}px,0) scale(1.025)`;
        if (farPlane.current) farPlane.current.style.transform = `translate3d(${-drift.x * .24 / view.zoom}px,${-drift.y * .2 / view.zoom}px,0) scale(1.008)`;
        for (const point of pointsRef.current) {
          const element = markers.current.get(point.id); if (!element) continue;
          const projected = projectScenePoint(point, view);
          const distance = cursor.current ? Math.hypot(projected.x - cursor.current.x, projected.y - cursor.current.y) : Infinity;
          const proximity = Math.max(0, 1 - distance / 200);
          element.style.setProperty('--presence', String(overviewRef.current ? .8 : .18 + proximity * .82));
          element.dataset.near = String(distance < 105);
        }
      }
      animation = requestAnimationFrame(draw);
    };
    animation = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animation);
  }, []);

  function stopDrift() { manual.current = true; velocity.current = { x: 0, y: 0 }; }
  function normalView() { stopDrift(); setOverview(false); setClose(false); target.current = placeCamera(size.current); }
  function showOverview() { stopDrift(); setOverview(true); setClose(false); target.current = overviewCamera(size.current); lookTarget.current = { x: 0, y: 0 }; }
  function zoom(factor: number, anchor = { x: size.current.width / 2, y: size.current.height / 2 }) {
    stopDrift(); setOverview(false);
    target.current = zoomSceneAt(target.current, target.current.zoom * factor, anchor, size.current);
    setClose(target.current.zoom > coverScale(size.current) * 1.5);
  }
  function enter(destination: string) {
    if (leaving) return;
    const index = journey.findIndex(place => place.id === destination);
    const path = clearingPaths.find(place => place.scene === destination);
    if (index < 0 || !path) return;
    stopDrift(); setOverview(false); setLeaving(true);
    const image = new Image(); image.src = sceneImage(journey[index]);
    target.current = placeCamera(size.current, path, 2.7);
    lookTarget.current = { x: 0, y: 0 };
    timer.current = setTimeout(() => { onEnter(index); setLeaving(false); }, reducedMotion ? 0 : 720);
  }
  function pan(x: number, y: number) {
    stopDrift(); setOverview(false);
    target.current = constrainSceneCamera({ ...target.current, x: target.current.x + x, y: target.current.y + y }, size.current);
  }
  function leavePointer(id: number) {
    contacts.current.delete(id); pinch.current = null; setDragging(contacts.current.size > 0);
  }
  const buttonTarget = (element: EventTarget) => (element as HTMLElement).closest('button, a, summary, .scene-hud');
  return (
    <div ref={root} className={`immersive-scene ${expanded ? 'is-expanded' : ''} ${overview ? 'is-overview' : ''} ${dragging ? 'is-dragging' : ''} ${leaving ? 'is-leaving' : ''} ${close ? 'is-close' : ''}`}
      tabIndex={0} role="region" aria-label={`${scene.title}. Move the pointer to look around; drag to explore. Scroll to walk, or use the next and previous controls. Plus and minus change viewing distance. Home shows the whole landscape.`}
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
        if (leaving || event.button > 0 || buttonTarget(event.target)) return;
        stopDrift();
        contacts.current.set(event.pointerId, { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, start: target.current, moved: false, type: event.pointerType });
        event.currentTarget.setPointerCapture(event.pointerId);
        if (contacts.current.size === 2) {
          const [a,b] = [...contacts.current.values()];
          a.moved = true; b.moved = true;
          pinch.current = { distance: Math.hypot(a.lastX-b.lastX, a.lastY-b.lastY), zoom: target.current.zoom };
        }
      }}
      onPointerMove={event => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
        cursor.current = point;
        const contact = contacts.current.get(event.pointerId);
        if (!contact && event.pointerType === 'mouse' && !buttonTarget(event.target)) {
          lookTarget.current = { x: (.5 - point.x / size.current.width) * Math.min(100, size.current.width * .085), y: (.5 - point.y / size.current.height) * 58 };
          return;
        }
        if (!contact) return;
        const dx = event.clientX - contact.lastX, dy = event.clientY - contact.lastY;
        contact.lastX = event.clientX; contact.lastY = event.clientY;
        if (Math.hypot(event.clientX-contact.x, event.clientY-contact.y) > 5) contact.moved = true;
        if (contacts.current.size === 2 && pinch.current) {
          const [a,b] = [...contacts.current.values()];
          const distance = Math.hypot(a.lastX-b.lastX, a.lastY-b.lastY);
          const anchor = { x: (a.lastX+b.lastX)/2-bounds.left, y: (a.lastY+b.lastY)/2-bounds.top };
          target.current = zoomSceneAt(target.current, pinch.current.zoom * distance / Math.max(1, pinch.current.distance), anchor, size.current);
          setClose(true); setOverview(false); setDragging(true); return;
        }
        if (!contact.moved) return;
        setDragging(true); setOverview(false);
        lookTarget.current = { x: 0, y: 0 };
        target.current = constrainSceneCamera({ ...target.current, x: target.current.x + dx, y: target.current.y + dy }, size.current);
        velocity.current = { x: Math.max(-35, Math.min(35, dx)), y: Math.max(-35, Math.min(35, dy)) };
      }}
      onPointerUp={event => {
        const contact = contacts.current.get(event.pointerId);
        if (contact && !contact.moved && contacts.current.size === 1) {
          const bounds = event.currentTarget.getBoundingClientRect();
          zoom(1.38, { x: event.clientX-bounds.left, y: event.clientY-bounds.top });
        }
        leavePointer(event.pointerId);
      }}
      onPointerCancel={event => { velocity.current = { x: 0, y: 0 }; leavePointer(event.pointerId); }}
      onLostPointerCapture={event => leavePointer(event.pointerId)}
      onPointerLeave={() => { cursor.current = null; if (!contacts.current.size) lookTarget.current = { x: 0, y: 0 }; }}>
      {previous && <div className="scene-previous" aria-hidden="true"><img src={sceneImage(previous.scene)} alt="" draggable={false} style={{ width: SCENE.width, height: SCENE.height, transform: `translate3d(${previous.view.x}px,${previous.view.y}px,0) scale(${previous.view.zoom})` }}/></div>}
      <div ref={world} className="scene-world" style={{ width: SCENE.width, height: SCENE.height }}>
        <img key={scene.id} className="scene-painting scene-base" src={sceneImage(scene)} alt="" draggable={false} decoding="async" fetchPriority={clearing ? 'high' : 'auto'} />
        {!reducedMotion && <>
          <img ref={farPlane} className="scene-painting scene-far-plane" src={sceneImage(scene)} alt="" draggable={false} />
          <img ref={nearPlane} className="scene-painting scene-near-plane" src={sceneImage(scene)} alt="" draggable={false} />
        </>}
        {points.map(point => <button key={`${scene.id}-${point.id}`} ref={element => { if (element) markers.current.set(point.id,element); else markers.current.delete(point.id); }}
          className={`scene-entry ${point.id === 'project' ? 'is-project' : ''}`} style={{ left: point.x * SCENE.width, top: point.y * SCENE.height }} aria-label={point.label} disabled={leaving}
          onClick={() => point.destination ? enter(point.destination) : onOpen(scene.work)}
          onFocus={event => { if (!event.currentTarget.matches(':focus-visible')) return; stopDrift(); setOverview(false); target.current = placeCamera(size.current, point, 1.2); }}>
          <span className="scene-entry-ring">{point.destination ? <ArrowUpRight size={15} /> : scene.work === 'ant-scape' ? <Scan size={16} /> : <Plus size={15} />}</span>
          <span className="scene-entry-label">{point.label}</span>
        </button>)}
      </div>
      <div className="scene-hud scene-heading">
        {!clearing && <Button variant="ghost" className="scene-home" onClick={() => onEnter(0)}><ArrowLeft size={15} /> A Clearing</Button>}
        <span className="scene-place">{clearing ? 'A Clearing' : scene.chapter}</span>
      </div>
      <div className="scene-hud scene-tools" aria-label="Viewing controls">
        <Button variant="ghost" size="icon" aria-label="Look closer" onClick={() => zoom(1.35)}><Plus size={18}/></Button>
        <Button variant="ghost" size="icon" aria-label="Step back" onClick={() => zoom(1/1.35)}><Minus size={18}/></Button>
        <Button variant="ghost" size="icon" aria-label={overview ? 'Return to eye level' : 'See the whole landscape'} onClick={overview ? normalView : showOverview}>{overview ? <Eye size={17}/> : <MapIcon size={17}/>}</Button>
        <Button variant="ghost" size="icon" aria-label={expanded ? 'Leave immersive view' : 'Enter immersive view'} aria-pressed={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? <Minimize2 size={17}/> : <Maximize2 size={17}/>}</Button>
      </div>
      <div className="scene-hud scene-story">
        {!clearing && <><h2>{scene.title}</h2><p>{scene.sentence}</p><Button variant="ghost" className="scene-read" onClick={() => onOpen(scene.work)}>{scene.action}<ArrowUpRight size={16}/></Button></>}
        {clearing && <p className="clearing-whisper">A place to pause.<br/>A path into each landscape.</p>}
      </div>
      <div className="scene-hud scene-foot">
        <Button variant="ghost" className="scene-help-toggle" aria-expanded={help} onClick={() => setHelp(!help)}>{help ? 'Close guide' : overview ? 'Choose a path' : 'Look around'}{help ? <X size={14}/> : <Eye size={15}/>}</Button>
        <span className="scene-walk-hint">{expanded ? 'Follow a path' : 'Scroll to walk'}</span>
        <div className="scene-walk-controls">
          <Button variant="ghost" size="icon" disabled={atStart} aria-label="Previous place" onClick={onPrevious}><ArrowLeft size={18}/></Button>
          <Button variant="ghost" onClick={atEnd ? () => onEnter(0) : onNext}>{atEnd ? 'Return' : 'Walk on'}<ArrowRight size={18}/></Button>
        </div>
      </div>
      {help && <div className="scene-hud scene-guide" role="status"><p>Move your pointer to look around. Drag to turn, and click the ground to step closer.</p><p>Follow a small arrow into a project. Use + / − to change distance, or the map to see the whole landscape.</p><p className="scene-touch-guide">On a touch screen, swipe sideways to look around. Zoom in to explore in every direction.</p></div>}
    </div>
  );
}
