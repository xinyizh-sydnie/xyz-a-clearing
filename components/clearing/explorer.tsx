'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Bookmark, Check, Expand, Grip, Minus, Move, Plus, RotateCcw, Scan, Shuffle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';
import { AntLens } from '@/components/clearing/ant-lens';
import { figureImage } from '@/lib/research';
import { folioImage } from '@/lib/portfolio';
import { dataAsset } from '@/lib/assets';
import { arrangements, connections, connectionsCamera, connectionCurve, travelCamera, viewpointCamera, clearingCamera, focusCamera, fitCamera, movePoint, works, WORLD, zoomAt, type Arrangement, type Camera, type Point, type Size, type WorkId } from '@/lib/clearing-map';

const workImage = (work: typeof works[number]) => work.id === 'wildfire' ? figureImage(7) : work.image === 'portfolio' ? folioImage(work.cover, true) : dataAsset(work.image === 'defensible' ? 'research/defensible-space/design-workflow.jpg' : 'exploration/scenes/clearing.png');
type PointerGesture = { origin: Point; camera: Camera; distance?: number };
type NodeGesture = { id: WorkId; origin: Point; point: Point; moved: boolean };

export function ClearingExplorer({ onOpen, visited, networkOnly = false }: { onOpen: (id: WorkId) => void; visited: string[]; networkOnly?: boolean }) {
  const [antOpen, setAntOpen] = useState(false);
  const [flying, setFlying] = useState(false);
  const flight = useRef<number | null>(null);
  const [arrangement, setArrangement] = useState<Arrangement>(networkOnly ? 'connections' : 'clearing');
  const [positions, setPositions] = useState(networkOnly ? arrangements.connections : arrangements.clearing);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: .6 });
  const [size, setSize] = useState<Size>({ width: 1000, height: 560 });
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const [active, setActive] = useState<WorkId | null>(null);
  const [hovered, setHovered] = useState<WorkId | null>(null);
  const [gathered, setGathered] = useState<WorkId[]>([]);
  const [encountered, setEncountered] = useState<WorkId[]>([]);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [moving, setMoving] = useState(false);
  const [movedNode, setMovedNode] = useState<WorkId | null>(null);
  const [hasRearranged, setHasRearranged] = useState(false);
  const cameraRef = useRef(camera);
  const arrangementRef = useRef(arrangement);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<PointerGesture | null>(null);
  const nodeGesture = useRef<NodeGesture | null>(null);
  const suppressClick = useRef(false);
  const current = works.find(work => work.id === active);
  const highlight = hovered ?? active;
  const related = new Set(connections.filter(edge => edge.from === highlight || edge.to === highlight).flatMap(edge => [edge.from, edge.to]));
  const paintCamera = useCallback((value: Camera | ((old: Camera) => Camera)) => {
    const next = typeof value === 'function' ? value(cameraRef.current) : value;
    cameraRef.current = next; setCamera(next);
  }, []);
  const applyCamera = useCallback((value: Camera | ((old: Camera) => Camera)) => {
    if (flight.current !== null) cancelAnimationFrame(flight.current);
    flight.current = null; setFlying(false); paintCamera(value);
  }, [paintCamera]);
  function flyTo(target: Camera, onArrival?: () => void) {
    if (flight.current !== null) cancelAnimationFrame(flight.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { applyCamera(target); onArrival?.(); return; }
    const from = cameraRef.current; const started = performance.now(); setFlying(true);
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / 1350);
      paintCamera(travelCamera(from, target, size, t));
      if (t < 1) flight.current = requestAnimationFrame(step);
      else { flight.current = null; setFlying(false); onArrival?.(); }
    };
    flight.current = requestAnimationFrame(step);
  }
  useEffect(() => () => { if(flight.current !== null)cancelAnimationFrame(flight.current); }, []);
  useEffect(() => {
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = { width: entry.contentRect.width, height: entry.contentRect.height };
      if (next.width === 0 || next.height === 0) return;
      setSize(next); applyCamera(arrangementRef.current === 'clearing' ? clearingCamera(next) : connectionsCamera(next));
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [viewport, applyCamera]);
  useEffect(() => {
    if (!viewport) return;
    const wheel = (event: WheelEvent) => {
      if (!expanded && !viewport.contains(document.activeElement) && !event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      applyCamera(old => zoomAt(old, old.zoom * Math.exp(-event.deltaY * .006), { x: event.clientX - rect.left, y: event.clientY - rect.top }));
    };
    viewport.addEventListener('wheel', wheel, { passive: false });
    return () => viewport.removeEventListener('wheel', wheel);
  }, [viewport, expanded, applyCamera]);
  function reset() { setActive(null); setHovered(null); setPositions(arrangements[arrangement]); setHasRearranged(false); applyCamera(arrangement === 'clearing' ? clearingCamera(size) : connectionsCamera(size)); }
  function changeArrangement(value: string) { const next = value as Arrangement; arrangementRef.current = next; setArrangement(next); setPositions(arrangements[next]); setHasRearranged(false); setActive(null); setHovered(null); applyCamera(next === 'clearing' ? clearingCamera(size) : connectionsCamera(size)); }
  function focusWork(id: WorkId) {
    const point = positions[id];
    setActive(id); setEncountered(old => old.includes(id) ? old : [...old, id]);
    flyTo(focusCamera(size, point, arrangement));
  }
  function wander() {
    const unseen = works.filter(work => !encountered.includes(work.id) && work.id !== active);
    const candidates = unseen.length ? unseen : works.filter(work => work.id !== active);
    focusWork(candidates[Math.floor(Math.random() * candidates.length)].id);
  }
  function gather(id: WorkId) { setGathered(old => old.includes(id) ? old.filter(value => value !== id) : [...old, id]); }
  function openWork(id: WorkId) { if(networkOnly) {setExpanded(false);onOpen(id);return;} if(id === 'ant-scape') { setActive(id); flyTo(viewpointCamera(size, 'close'), () => {setExpanded(false);setAntOpen(true);}); } else {setExpanded(false);onOpen(id);} }
  function localPoint(event: React.PointerEvent) { const rect = event.currentTarget.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
  function beginPan(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button, a, [role="slider"], .work-inspector, .map-zoom') || event.button > 0) return;
    event.currentTarget.focus({ preventScroll: true });
    applyCamera(cameraRef.current);
    const point = localPoint(event);
    pointers.current.set(event.pointerId, point);
    event.currentTarget.setPointerCapture(event.pointerId);
    const values = [...pointers.current.values()];
    if (values.length === 2) {
      gesture.current = { camera: cameraRef.current, origin: { x: (values[0].x + values[1].x) / 2, y: (values[0].y + values[1].y) / 2 }, distance: Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y) };
    } else gesture.current = { camera: cameraRef.current, origin: point };
    setMoving(true);
  }
  function pan(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    const point = localPoint(event); pointers.current.set(event.pointerId, point);
    const values = [...pointers.current.values()]; const start = gesture.current;
    if (values.length === 2 && start.distance) {
      const distance = Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
      const center = { x: (values[0].x + values[1].x) / 2, y: (values[0].y + values[1].y) / 2 };
      const scaled = zoomAt(start.camera, start.camera.zoom * distance / start.distance, start.origin);
      applyCamera({ ...scaled, x: scaled.x + center.x - start.origin.x, y: scaled.y + center.y - start.origin.y });
    } else applyCamera({ ...start.camera, x: start.camera.x + point.x - start.origin.x, y: start.camera.y + point.y - start.origin.y });
  }
  function endPan(event: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    const remaining = [...pointers.current.values()];
    gesture.current = remaining.length ? { camera: cameraRef.current, origin: remaining[0] } : null;
    if (!remaining.length) setMoving(false);
  }
  function beginNode(event: React.PointerEvent<HTMLButtonElement>, id: WorkId) {
    if (event.button > 0) return;
    event.stopPropagation(); suppressClick.current = false;
    nodeGesture.current = { id, origin: { x: event.clientX, y: event.clientY }, point: positions[id], moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveNode(event: React.PointerEvent<HTMLButtonElement>) {
    const start = nodeGesture.current; if (!start) return;
    event.stopPropagation();
    const delta = { x: event.clientX - start.origin.x, y: event.clientY - start.origin.y };
    if (Math.hypot(delta.x, delta.y) < 6 && !start.moved) return;
    start.moved = true; suppressClick.current = true; setMovedNode(start.id); setHasRearranged(true);
    const point = movePoint(start.point, delta, cameraRef.current.zoom);
    setPositions(old => ({ ...old, [start.id]: point }));
  }
  function endNode(event: React.PointerEvent<HTMLButtonElement>) { event.stopPropagation(); nodeGesture.current = null; setMovedNode(null); }
  const surface = <div className={`clearing-explorer ${expanded ? 'is-expanded' : ''}`}>
    <div className="explorer-toolbar">{networkOnly ? <span className="network-heading">Follow a connection</span> : <ToggleGroup value={[arrangement]} multiple={false} onValueChange={values=>{if(values[0])changeArrangement(values[0]);}} className="arrangement-switch" aria-label="Arrange works"><ToggleGroupItem value="clearing">The Clearing</ToggleGroupItem><ToggleGroupItem value="connections">Connections</ToggleGroupItem></ToggleGroup>}<div className="explorer-actions"><Button variant="ghost" className="wander-action" onClick={wander}><Shuffle size={15} /> Wander</Button><Button variant="ghost" className="gather-action" onClick={() => setCollectionOpen(!collectionOpen)} aria-expanded={collectionOpen}><Bookmark size={15} /><span>Gathered</span><span className="gather-count">{gathered.length}</span></Button><Button variant="ghost" size="icon" className="expand-action" aria-label={expanded ? 'Close expanded clearing' : 'Expand the clearing'} onClick={() => setExpanded(!expanded)}>{expanded ? <X size={18} /> : <Expand size={17} />}</Button></div></div>
    <div ref={setViewport} className={`explorer-viewport ${moving ? 'is-moving' : ''} arrangement-${arrangement} ${flying ? 'is-flying' : ''} ${camera.zoom < .33 ? 'is-distant' : ''}`} tabIndex={0} role="region" aria-label="Interactive map of ten works. Drag the empty space to move, drag a numbered work to rearrange it, or tab to a work and press Enter. Click the scene then scroll to zoom; use plus and minus, arrow keys to pan, Home to reset, and Escape to release scroll focus." onDoubleClick={event => { if((event.target as HTMLElement).closest('button, a, .work-inspector'))return; const rect=event.currentTarget.getBoundingClientRect(); flyTo(zoomAt(cameraRef.current,cameraRef.current.zoom*1.8,{x:event.clientX-rect.left,y:event.clientY-rect.top})); }} onPointerDown={beginPan} onPointerMove={pan} onPointerUp={endPan} onPointerCancel={endPan} onLostPointerCapture={event => { if (pointers.current.has(event.pointerId)) endPan(event); }} onKeyDown={event => {
      if (event.key === 'Escape') { event.currentTarget.blur(); return; }
      if (event.target !== event.currentTarget) return;
      const center = { x: size.width / 2, y: size.height / 2 };
      if (event.key === '+' || event.key === '=') { event.preventDefault(); applyCamera(old => zoomAt(old, old.zoom * 1.6, center)); }
      if (event.key === '-') { event.preventDefault(); applyCamera(old => zoomAt(old, old.zoom / 1.6, center)); }
      if (event.key === 'Home') { event.preventDefault(); reset(); }
      const movement: Record<string, Point> = { ArrowLeft: { x: 65, y: 0 }, ArrowRight: { x: -65, y: 0 }, ArrowUp: { x: 0, y: 65 }, ArrowDown: { x: 0, y: -65 } };
      if (movement[event.key]) { event.preventDefault(); applyCamera(old => ({ ...old, x: old.x + movement[event.key].x, y: old.y + movement[event.key].y })); }
    }}>
      <div className="explorer-world" style={{ width: WORLD.width, height: WORLD.height, transform: `translate(${camera.x}px,${camera.y}px) scale(${camera.zoom})`, transition: moving || flying ? 'none' : undefined }}>
        <img className="explorer-landscape" src={dataAsset('exploration/scenes/clearing.png')} alt="" draggable={false} width="1500" height="1000" />
        <svg className="connection-drawing" width={WORLD.width} height={WORLD.height} viewBox={`0 0 ${WORLD.width} ${WORLD.height}`} aria-hidden="true">{connections.map((edge, index) => {
          const from = positions[edge.from], to = positions[edge.to];
          const lit = highlight === edge.from || highlight === edge.to;
          return <g key={`${edge.from}-${edge.to}`} className={lit ? 'lit-connection' : ''}><path d={connectionCurve(from, to, index % 2 ? 1 : -1)} vectorEffect="non-scaling-stroke" />{lit && <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 12} textAnchor="middle" fontSize={14 / camera.zoom}>{edge.label}</text>}</g>;
        })}</svg>
        {works.map(work => <div key={work.id} className={`map-location ${active === work.id ? 'active-location' : ''} ${highlight && !related.has(work.id) ? 'unrelated-location' : ''} ${movedNode === work.id ? 'moving-location' : ''}`} style={{ left: positions[work.id].x, top: positions[work.id].y }}>
          <button className={`map-work ${work.id === 'wildfire' || work.id === 'defensible' ? 'research-map-work' : ''} ${visited.includes(work.id) ? 'visited-work' : ''}`} style={{ transform: `scale(${1 / camera.zoom}) translate(-50%,-50%)` }} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } focusWork(work.id); }} onMouseEnter={() => setHovered(work.id)} onMouseLeave={() => setHovered(null)} onFocus={event => { setHovered(work.id); if(event.currentTarget.matches(':focus-visible'))focusWork(work.id); }} onBlur={() => setHovered(null)} onKeyDown={event => {
            if(!event.altKey)return;
            const steps: Record<string, Point> = { ArrowLeft: {x:-20,y:0}, ArrowRight: {x:20,y:0}, ArrowUp: {x:0,y:-20}, ArrowDown: {x:0,y:20} };
            if(steps[event.key]){event.preventDefault();setHasRearranged(true);setPositions(old=>({...old,[work.id]:movePoint(old[work.id],steps[event.key],camera.zoom)}));}
          }} onPointerDown={event => beginNode(event, work.id)} onPointerMove={moveNode} onPointerUp={endNode} onPointerCancel={endNode} onLostPointerCapture={endNode} aria-label={`${work.title}. Select to explore; drag or use Alt and arrow keys to rearrange.`} aria-pressed={active === work.id}>
            <span className="map-work-picture"><img src={workImage(work)} alt="" draggable={false} loading="lazy" /></span><span className="map-work-label">{work.title}</span>{(work.id === 'wildfire' || work.id === 'defensible') && <span className="map-work-status">{work.id === 'wildfire' ? 'Published research' : 'Research in progress'}</span>}
          </button>
        </div>)}
      </div>

      {arrangement === 'clearing' && <div className="scene-viewpoints" aria-label="Choose viewing distance"><Button variant="ghost" onClick={() => { setActive(null); flyTo(viewpointCamera(size, 'overlook')); }}>Overlook</Button><Button variant="ghost" onClick={() => { setActive(null); flyTo(viewpointCamera(size, 'walk')); }}>Walk in</Button><Button variant="ghost" onClick={() => openWork('ant-scape')}>Ground level <Scan size={14}/></Button></div>}
      {current && <aside className="work-inspector" aria-label="Selected work" aria-live="polite"><Button variant="ghost" size="icon" className="inspector-close" aria-label="Close selected work" onClick={() => setActive(null)}><X size={16} /></Button><img className="inspector-image" src={workImage(current)} alt="" /><div className="inspector-copy"><span className="eyebrow">{current.category}</span><h3>{current.title}</h3><p>{current.question}</p><div className="inspector-actions"><Button className="inspector-open" onClick={() => openWork(current.id)}>{current.id === 'ant-scape' ? 'Look through the lens' : current.id === 'wildfire' ? 'Read the research' : 'Open project'} {current.id === 'ant-scape' ? <Scan size={15}/> : <ArrowUpRight size={15} />}</Button><Button variant="ghost" className="collect-work" onClick={() => gather(current.id)} aria-pressed={gathered.includes(current.id)}>{gathered.includes(current.id) ? <Check size={15} /> : <Plus size={15} />}{gathered.includes(current.id) ? 'Gathered' : 'Gather'}</Button></div>{arrangement === 'connections' && <div className="related-works"><span>Follow a connection</span>{connections.filter(edge => edge.from === current.id || edge.to === current.id).slice(0,3).map(edge => { const other = edge.from === current.id ? edge.to : edge.from; return <button key={other} onClick={() => focusWork(other)}>{edge.label}<ArrowRight size={12} /></button>; })}</div>}</div></aside>}
      <div className="map-orientation"><Button variant="ghost" className="overview-action" onClick={() => { setActive(null); setHovered(null); flyTo(fitCamera(size)); }}>Overview</Button><button className="map-navigator" aria-label="Move within the clearing. Click a location on the overview map." onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); const point = { x: (event.clientX - rect.left) / rect.width * WORLD.width, y: (event.clientY - rect.top) / rect.height * WORLD.height }; if(event.detail === 0) { applyCamera(fitCamera(size)); return; } setActive(null); applyCamera(old => ({ ...old, x: size.width / 2 - point.x * old.zoom, y: size.height / 2 - point.y * old.zoom })); }}><svg viewBox={`0 0 ${WORLD.width} ${WORLD.height}`} aria-hidden="true"><rect className="navigator-extent" x={-camera.x / camera.zoom} y={-camera.y / camera.zoom} width={size.width / camera.zoom} height={size.height / camera.zoom} />{works.map(work => <circle key={work.id} cx={positions[work.id].x} cy={positions[work.id].y} r={active === work.id ? 32 : 20} className={active === work.id ? 'navigator-active' : ''} />)}</svg></button></div><div className="map-zoom"><Button variant="ghost" size="icon" aria-label="Zoom in on the clearing" onClick={() => applyCamera(old => zoomAt(old, old.zoom * 1.6, { x: size.width / 2, y: size.height / 2 }))}><Plus size={17} /></Button><Button variant="ghost" size="icon" aria-label="Zoom out of the clearing" onClick={() => applyCamera(old => zoomAt(old, old.zoom / 1.6, { x: size.width / 2, y: size.height / 2 }))}><Minus size={17} /></Button><Button variant="ghost" size="icon" aria-label="Reset view and arrangement" onClick={reset}><RotateCcw size={15} /></Button></div>
    </div>
    {collectionOpen && <div className="gathered-tray" aria-label="Works gathered during this visit"><div className="gathered-heading"><span>My gathered works <span>({gathered.length})</span></span><Button variant="ghost" size="icon" aria-label="Close gathered works" onClick={() => setCollectionOpen(false)}><X size={16} /></Button></div>{gathered.length ? <div className="gathered-items">{gathered.map(id => { const work = works.find(item => item.id === id)!; return <div className="gathered-item" key={id}><button onClick={() => { setCollectionOpen(false); focusWork(id); }}><img src={workImage(work)} alt=""/><span>{work.title}</span></button><button className="remove-gathered" aria-label={`Remove ${work.title} from gathered works`} onClick={() => gather(id)}><X size={13} /></button></div>; })}</div> : <p>Open a work and choose “Gather” to keep a few favorites here while you explore.</p>}</div>}
    <div className="explorer-bottom"><span><Move size={13} /> <span className="mouse-instruction">Click the scene, then scroll to zoom · drag to move</span><span className="touch-instruction">Drag to move · pinch to zoom</span></span><span className="map-arrangement-status">{hasRearranged ? <><Grip size={13} /> Your arrangement</> : 'Sydnie Zhang'}</span><div className="explorer-scale"><span>{Math.round(camera.zoom * 100)}%</span><Slider value={[camera.zoom * 100]} min={18} max={600} step={5} aria-label="Clearing zoom" onValueChange={value => {setMoving(true);applyCamera(old => zoomAt(old, (Array.isArray(value) ? value[0] : value) / 100, { x: size.width / 2, y: size.height / 2 }));}} onValueCommitted={()=>setMoving(false)} /></div></div>
  </div>;
  return <><AntLens open={antOpen} onClose={() => setAntOpen(false)} onPortfolio={() => {setAntOpen(false);onOpen('ant-scape');}}/><div className="explorer-mount">{!expanded ? surface : <div className="expanded-placeholder"><p>The clearing is open.</p><Button variant="outline" onClick={() => setExpanded(false)}>Return to the page</Button></div>}</div><Dialog open={expanded} onOpenChange={setExpanded}><DialogContent className="expanded-explorer" showCloseButton={false}><DialogTitle className="sr-only">Explore A Clearing</DialogTitle><DialogDescription className="sr-only">An interactive field of Sydnie Zhang’s research and landscape projects.</DialogDescription>{expanded && surface}</DialogContent></Dialog></>;
}
