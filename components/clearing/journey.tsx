'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClearingExplorer } from '@/components/clearing/explorer';
import { AntLens } from '@/components/clearing/ant-lens';
import { ImmersiveScene } from '@/components/clearing/immersive-scene';
import { journey, journeyFrame, sceneImage } from '@/lib/journey';
import type { WorkId } from '@/lib/clearing-map';

export function SceneJourney({ onOpen, visited }: { onOpen: (id: WorkId) => void; visited: string[] }) {
  const [mode, setMode] = useState('walk'), [position, setPosition] = useState(0);
  const [barHeight, setBarHeight] = useState(46), [antOpen, setAntOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const topbar = useRef<HTMLDivElement>(null), scrollRoot = useRef<HTMLDivElement>(null);
  const sticky = useRef<HTMLDivElement>(null), shell = useRef<HTMLDivElement>(null);
  const positionRef = useRef(0);
  const frame = journeyFrame(position), last = journey.length - 1;
  const displayedIndex = frame.blend >= .5 ? frame.next : frame.index;
  const current = journey[displayedIndex];
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReducedMotion(media.matches); change();
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  const geometry = useCallback(() => {
    const root = scrollRoot.current, stage = sticky.current;
    if (!root || !stage) return null;
    return { top: root.getBoundingClientRect().top + window.scrollY - (topbar.current?.offsetHeight ?? 46), step: Math.max(1, (root.offsetHeight - stage.offsetHeight) / journey.length) };
  }, []);
  useEffect(() => {
    if (mode !== 'walk') return;
    let pending = 0;
    const measure = () => {
      pending = 0; const geo = geometry(); if (!geo) return;
      const next = Math.max(0, Math.min(last, (window.scrollY - geo.top) / geo.step));
      positionRef.current = next; setPosition(next);
    };
    const queue = () => { if (!pending) pending = requestAnimationFrame(measure); };
    measure(); window.addEventListener('scroll', queue, { passive: true }); window.addEventListener('resize', queue);
    return () => { cancelAnimationFrame(pending); window.removeEventListener('scroll', queue); window.removeEventListener('resize', queue); };
  }, [mode, geometry, last]);
  useEffect(() => {
    if (!topbar.current) return;
    const observer = new ResizeObserver(([entry]) => setBarHeight(entry.target.getBoundingClientRect().height));
    observer.observe(topbar.current); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    for (const index of new Set([frame.index, frame.next, Math.min(last, frame.next + 1)])) {
      const img = new Image(); img.src = sceneImage(journey[index]);
    }
  }, [frame.index, frame.next, last]);
  function seek(index: number, smooth = false) {
    const next = Math.max(0, Math.min(last, index));
    // Update immediately as well as through scroll so immersive view works while body scroll is locked.
    positionRef.current = next; setPosition(next);
    const geo = geometry(); if (!geo) return;
    window.scrollTo({ top: geo.top + next * geo.step, behavior: smooth && !reducedMotion ? 'smooth' : 'instant' });
  }
  function changeMode(value: string) {
    const remembered = positionRef.current; setMode(value);
    requestAnimationFrame(() => {
      if (value === 'walk') seek(remembered);
      else shell.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
  function openWork(id: WorkId) { if (id === 'ant-scape') setAntOpen(true); else onOpen(id); }
  return (
    <div ref={shell} className="journey-shell immersive-journey" style={{ '--journey-bar-height': `${barHeight}px` } as React.CSSProperties}>
      <Tabs value={mode} onValueChange={changeMode} className="journey-tabs">
        <div ref={topbar} className="journey-topbar">
          <TabsList aria-label="Ways to explore" className="journey-mode-switch">
            <TabsTrigger value="walk">Along the path</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
          </TabsList>
          {mode === 'walk' && <Select value={current.kind === 'clearing' ? 'clearing' : current.id} onValueChange={value => { const index = journey.findIndex(scene => scene.id === value); if (index >= 0) seek(index); }}>
            <SelectTrigger className="journey-location-select" aria-label="Go to a place along the path"><SelectValue>Places along the path</SelectValue></SelectTrigger>
            <SelectContent className="journey-place-options" alignItemWithTrigger={false}>
              {journey.filter(scene => scene.id !== 'return').map(scene => <SelectItem key={scene.id} value={scene.id}>{scene.title}</SelectItem>)}
            </SelectContent>
          </Select>}
        </div>
        <TabsContent value="walk" className="walk-content">
          <div ref={scrollRoot} className="journey-scroll" style={{ height: `calc(var(--journey-height) + var(--journey-step) * ${journey.length})` }}>
            <div ref={sticky} className="journey-sticky">
              <ImmersiveScene scene={current} progress={displayedIndex === frame.index ? frame.local : 0} reducedMotion={reducedMotion}
                onEnter={index => seek(index)} onOpen={openWork} onNext={() => seek(displayedIndex + 1)} onPrevious={() => seek(displayedIndex - 1)} atStart={position <= 0} atEnd={frame.arrived}/>
              <div className="scene-route-progress" aria-hidden="true"><span style={{ width: `${position / last * 100}%` }}/></div>
              <span className="sr-only" aria-live="polite">{current.title}</span>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="connections" className="journey-connections"><ClearingExplorer networkOnly onOpen={openWork} visited={visited}/></TabsContent>
      </Tabs>
      <AntLens open={antOpen} onClose={() => setAntOpen(false)} onPortfolio={() => { setAntOpen(false); onOpen('ant-scape'); }}/>
    </div>
  );
}
