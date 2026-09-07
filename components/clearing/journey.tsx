'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Minus, Plus, RotateCcw, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClearingExplorer } from '@/components/clearing/explorer';
import { AntLens } from '@/components/clearing/ant-lens';
import { journey, journeyFrame, clearingViews, wrapBearing, sceneImage, boundJourneyCamera, scenePoint, type JourneyScene } from '@/lib/journey';
import type { WorkId } from '@/lib/clearing-map';

type ViewCamera = { zoom: number; x: number; y: number };
const origin: ViewCamera = { zoom: 1, x: 0, y: 0 };
export function SceneJourney({ onOpen, visited }: { onOpen: (id: WorkId) => void; visited: string[] }) {
  const [mode, setMode] = useState('walk');
  const [barHeight, setBarHeight] = useState(46);
  const topbar = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);
  const [bearing, setBearing] = useState(0);
  const [priorBearing, setPriorBearing] = useState(0);
  const [lookDirection, setLookDirection] = useState(1);
  const [antOpen, setAntOpen] = useState(false);
  const [camera, setCamera] = useState<ViewCamera>(origin);
  const [dragging, setDragging] = useState(false);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 1200, height: 620 });
  const scrollRoot = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const positionRef = useRef(0);
  const pointer = useRef<{ x: number; y: number; pan: ViewCamera } | null>(null);
  const frame = journeyFrame(position);
  const displayedIndex = frame.arrived ? clearingViews[bearing] : frame.blend >= .5 ? frame.next : frame.index;
  const current = journey[displayedIndex];
  const last = journey.length - 1;
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => { const media = window.matchMedia('(prefers-reduced-motion: reduce)'); setReducedMotion(media.matches); const change = () => setReducedMotion(media.matches); media.addEventListener('change',change); return () => media.removeEventListener('change',change); }, []);
  const geometry = useCallback(() => {
    const root = scrollRoot.current, stage = sticky.current;
    if(!root || !stage)return null;
    return { top: root.getBoundingClientRect().top + window.scrollY - (topbar.current?.offsetHeight ?? 46), step: Math.max(1,(root.offsetHeight - stage.offsetHeight) / journey.length) };
  }, []);
  useEffect(() => {
    if(mode !== 'walk')return;
    let pending = 0;
    const measure = () => { pending = 0; const geo = geometry(); if(!geo)return; const next = Math.max(0,Math.min(last,(window.scrollY - geo.top) / geo.step)); positionRef.current = next; setPosition(next); };
    const queue = () => { if(!pending)pending = requestAnimationFrame(measure); };
    measure(); window.addEventListener('scroll',queue,{ passive: true }); window.addEventListener('resize',queue);
    return () => { cancelAnimationFrame(pending);window.removeEventListener('scroll',queue);window.removeEventListener('resize',queue); };
  }, [mode, geometry, last]);
  useEffect(() => { if(!topbar.current)return;const observer=new ResizeObserver(([entry])=>setBarHeight(entry.target.getBoundingClientRect().height));observer.observe(topbar.current);return()=>observer.disconnect(); }, []);
  useEffect(() => {
    if(!viewport)return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height })); observer.observe(viewport); return () => observer.disconnect();
  }, [viewport]);
  useEffect(() => {setCamera(old=>boundJourneyCamera(old,size));},[size]);
  useEffect(() => { setCamera(origin); if(!frame.arrived){setBearing(0);setPriorBearing(0);} }, [displayedIndex,frame.arrived]);
  useEffect(() => {
    const candidates = new Set([frame.index, frame.next, Math.min(last,frame.next+1), ...(frame.arrived ? clearingViews : [])]);
    for(const index of candidates) {const img=new Image();img.src=sceneImage(journey[index]);}
  }, [frame.index,frame.next,frame.arrived,last]);

  function seek(index: number, smooth = false) {
    const geo = geometry(); if(!geo)return;
    setCamera(origin); setBearing(0); setPriorBearing(0);
    window.scrollTo({ top: geo.top + Math.max(0,Math.min(last,index))*geo.step, behavior: smooth && !reducedMotion ? 'smooth' : 'instant' });
  }
  function changeMode(value: string) {
    const remembered = positionRef.current;
    setMode(value);
    requestAnimationFrame(() => { if(value === 'walk')seek(remembered);else shell.current?.scrollIntoView({ block:'start',behavior:'instant' }); });
  }
  function turn(direction: number) {setLookDirection(direction);setPriorBearing(bearing);setBearing(wrapBearing(bearing+direction));setCamera(origin);}
  function openWork(id: WorkId) { if(id === 'ant-scape')setAntOpen(true);else onOpen(id); }
  function changeZoom(delta: number) { setCamera(old => { const zoom = Math.max(1,Math.min(3,old.zoom+delta));return boundJourneyCamera({...old,zoom},size); }); }
  function layer(scene: JourneyScene, opacity: number, scale: number, key: string, animate = false, interactive = false) {
    // Object coordinates follow the same cover crop and transform as their scene.
    const {x,y} = scenePoint(scene,size);
    return <div key={key} className={`journey-scene-layer ${animate ? 'look-enter' : ''}`} style={{ opacity, transform: `translate(${camera.x}px,${camera.y}px) scale(${camera.zoom*scale})`, pointerEvents: interactive ? 'auto' : 'none' }}>
      <img src={sceneImage(scene)} className="journey-art" style={{ objectPosition:scene.focal }} alt="" draggable={false} decoding="async" fetchPriority={scene.id === 'fire' ? 'high' : 'auto'}/>
      {interactive && x > 20 && x < size.width - 20 && y > 20 && y < size.height - 20 && <button className="scene-detail" style={{ left:x,top:y }} onClick={() => openWork(scene.work)} aria-label={scene.object.label}><span><Plus size={16}/></span><span className="scene-detail-label">{scene.object.label}</span></button>}
    </div>;
  }
  return <div ref={shell} className="journey-shell" style={{ '--journey-bar-height': `${barHeight}px`, '--look-direction': lookDirection } as React.CSSProperties}><Tabs value={mode} onValueChange={changeMode} className="journey-tabs"><div ref={topbar} className="journey-topbar"><TabsList aria-label="Ways to explore" className="journey-mode-switch"><TabsTrigger value="walk">Along the path</TabsTrigger><TabsTrigger value="connections">Connections</TabsTrigger></TabsList>{mode === 'walk' && <Button variant="ghost" className="jump-clearing" onClick={() => seek(last)}>To the clearing <ArrowUpRight size={15}/></Button>}</div>
    <TabsContent value="walk" className="walk-content"><div ref={scrollRoot} className="journey-scroll" style={{ height:`calc(var(--journey-height) + var(--journey-step) * ${journey.length})` }}><div ref={sticky} className="journey-sticky">
      <div className="journey-location-bar"><span className="journey-chapter" aria-live="polite">{frame.arrived ? 'From the clearing' : current.chapter}</span><Select value={journey[frame.arrived ? last : displayedIndex].id} onValueChange={value => {const index=journey.findIndex(scene=>scene.id===value);if(index>=0)seek(index);}}><SelectTrigger className="journey-location-select" aria-label="Go to a place along the path"><SelectValue>Places along the path</SelectValue></SelectTrigger><SelectContent className="journey-place-options" alignItemWithTrigger={false}>{journey.map(scene => <SelectItem key={scene.id} value={scene.id}>{scene.title}</SelectItem>)}</SelectContent></Select></div>
      <div ref={setViewport} className={`journey-viewport ${frame.arrived ? 'has-arrived' : ''} ${dragging ? 'is-dragging' : ''} ${camera.zoom>1 ? 'is-close' : ''}`} tabIndex={0} role="region" aria-label={frame.arrived ? 'A Clearing. Drag horizontally or use left and right arrows to look around. Select a detail to explore a project.' : 'Walk through the landscapes by scrolling. Use left and right arrow keys to move between scenes. Select a detail to explore a project.'} style={{ touchAction:camera.zoom>1 ? 'none' : 'pan-y' }} onKeyDown={event => {if(event.target!==event.currentTarget)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();const direction=event.key==='ArrowRight'?1:-1;if(frame.arrived)turn(direction);else seek(displayedIndex+direction,true);}if(event.key==='+'||event.key==='='){event.preventDefault();changeZoom(.5);}if(event.key==='-'){event.preventDefault();changeZoom(-.5);}if(event.key==='Home'){event.preventDefault();seek(0);}}} onPointerDown={event => {if((event.target as HTMLElement).closest('button')||event.button>0)return;pointer.current={x:event.clientX,y:event.clientY,pan:camera};if(camera.zoom>1||frame.arrived){event.currentTarget.setPointerCapture(event.pointerId);setDragging(true);}}} onPointerMove={event => {if(!pointer.current||camera.zoom===1)return;const start=pointer.current;setCamera(boundJourneyCamera({...start.pan,x:start.pan.x+event.clientX-start.x,y:start.pan.y+event.clientY-start.y},size));}} onPointerUp={event => {const start=pointer.current;if(start&&frame.arrived&&camera.zoom===1&&Math.abs(event.clientX-start.x)>50&&Math.abs(event.clientX-start.x)>Math.abs(event.clientY-start.y))turn(event.clientX<start.x?1:-1);pointer.current=null;setDragging(false);}} onPointerCancel={()=>{pointer.current=null;setDragging(false);}} onLostPointerCapture={()=>{pointer.current=null;setDragging(false);}}>
        {frame.arrived ? <>{layer(journey[clearingViews[priorBearing]],1,1,`prior-${priorBearing}`)}{layer(current,1,1,`look-${bearing}`,!reducedMotion,true)}</> : reducedMotion ? layer(current,1,1,current.id,false,true) : <>{layer(journey[frame.index],1-frame.blend,1+frame.local*.10,`out-${frame.index}`,false,frame.blend<.35)}{frame.next!==frame.index && layer(journey[frame.next],frame.blend,1.07-frame.blend*.07,`in-${frame.next}`,false,frame.blend>.65)}</>}
        <div className="journey-zoom" aria-label="Look closer"><Button variant="ghost" size="icon" aria-label="Look closer" disabled={camera.zoom>=3} onClick={()=>changeZoom(.5)}><Plus size={16}/></Button><Button variant="ghost" size="icon" aria-label="Step back" disabled={camera.zoom<=1} onClick={()=>changeZoom(-.5)}><Minus size={16}/></Button>{camera.zoom>1&&<Button variant="ghost" size="icon" aria-label="Reset viewing distance" onClick={()=>setCamera(origin)}><RotateCcw size={15}/></Button>}</div>
        {frame.arrived && <div className="clearing-look-controls"><Button variant="ghost" onClick={()=>turn(-1)} aria-label="Look to the left"><ArrowLeft size={16}/> Turn left</Button><span>{bearing===0?'Look around':'Another view'}</span><Button variant="ghost" onClick={()=>turn(1)} aria-label="Look to the right">Turn right <ArrowRight size={16}/></Button></div>}
      </div>
      <div className="journey-caption"><div><p className="eyebrow">{frame.arrived && bearing===0 ? 'A place to pause' : current.work==='wildfire'||current.work==='defensible'?'Research':'Landscape & design'}</p><h2>{current.title}</h2><p className="scene-sentence">{current.sentence}</p></div><Button variant="ghost" className="scene-open" onClick={()=>openWork(current.work)}>{current.action}{current.work==='ant-scape'?<Scan size={17}/>:<ArrowUpRight size={17}/>}</Button></div>
      <div className="journey-navigation"><Button variant="ghost" onClick={()=>seek(Math.max(0,(frame.arrived?last:displayedIndex)-1),true)} disabled={position<=0} aria-label="Previous place"><ArrowLeft size={16}/><span>Back</span></Button><div className="journey-progress" aria-hidden="true"><span style={{width:`${position/last*100}%`}}/></div><span className="journey-scroll-hint">{frame.arrived?'Turn to explore':<>Scroll to walk <ArrowDown size={12}/></>}</span>{frame.arrived?<Button variant="ghost" onClick={()=>{setPriorBearing(bearing);setBearing(0);setCamera(origin);}} aria-label="Face the clearing">Clearing <RotateCcw size={14}/></Button>:<Button variant="ghost" onClick={()=>seek(Math.min(last,displayedIndex+1),true)} aria-label="Walk to the next place"><span>Continue</span><ArrowRight size={16}/></Button>}</div>
    </div></div></TabsContent>
    <TabsContent value="connections" className="journey-connections"><ClearingExplorer networkOnly onOpen={openWork} visited={visited}/></TabsContent>
  </Tabs><AntLens open={antOpen} onClose={()=>setAntOpen(false)} onPortfolio={()=>{setAntOpen(false);onOpen('ant-scape');}}/></div>;
}
