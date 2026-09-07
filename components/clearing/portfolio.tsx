'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Maximize2, Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { portfolio, folioImage, pageCaptions, projectAtPage, type PortfolioProject, type PortfolioId } from '@/lib/portfolio';

function ProjectCard({ project, onOpen, visited }: { project: PortfolioProject; onOpen: (id: PortfolioId, page?: number) => void; visited: boolean }) {
  const [preview, setPreview] = useState(project.cover as number);
  const pages = Array.from({ length: project.end - project.start + 1 }, (_, n) => n + project.start);
  return <button className="portfolio-card" onClick={() => onOpen(project.id, project.start)} onPointerEnter={() => {
    for (const page of pages) { const image = new Image(); image.src = folioImage(page, true); }
  }} onPointerMove={event => {
    if (event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPreview(pages[Math.min(pages.length - 1, Math.max(0, Math.floor((event.clientX - rect.left) / rect.width * pages.length)))]);
  }} onPointerLeave={() => setPreview(project.cover)}>
    <div className="portfolio-cover">
      <img src={folioImage(preview, true)} alt={`${project.title} · ${pageCaptions[preview - 1]}`} loading="lazy" width="800" height="566" />
      <span className="card-open"><ArrowUpRight size={20} /></span>
      <span className="card-page-number">{String(preview).padStart(2, '0')} / 45</span>
      <div className="card-page-ticks" aria-hidden="true">{pages.map(n => <span key={n} className={preview === n ? 'active' : ''} />)}</div>
    </div>
    <div className="portfolio-card-meta"><span>{project.number} / {project.theme}</span><span>{visited ? <span aria-label="Previously opened">↗</span> : null}</span></div>
    <h3>{project.title}</h3><p>{project.subtitle}</p>
  </button>;
}
export function PortfolioIndex({ onOpen, onReadAll, visited }: { onOpen: (id: PortfolioId, page?: number) => void; onReadAll: () => void; visited: string[] }) {
  return <section className="portfolio-section" id="portfolio">
    <div className="section-heading"><div><p className="eyebrow">In Seek of Homeland · 2023</p><h2 className="display-heading">Landscape</h2></div><Button variant="outline" className="read-portfolio" onClick={onReadAll}><BookOpen size={16} /> View portfolio <ArrowUpRight size={16} /></Button></div>
    <div className="portfolio-preface"><p>Landscape architecture, urban design, and drawings.<br className="desktop-break" /> Explorations of water, ecology, and cultural memory.</p><span className="scrub-hint">Move across a drawing to leaf through <ArrowRight size={15} /></span></div>
    <div className="portfolio-grid">{portfolio.map(project => <ProjectCard key={project.id} project={project} onOpen={onOpen} visited={visited.includes(project.id)} />)}</div>

  </section>;
}

export function PortfolioReader({ entry, page, onPageChange, onProjectChange, onClose }: {
  entry: PortfolioId | 'landscape' | null; page: number;
  onPageChange: (page: number) => void; onProjectChange: (id: PortfolioId | 'landscape', page?: number) => void; onClose: () => void;
}) {
  const current = portfolio.find(p => p.id === entry);
  const first = current?.start ?? 1;
  const last = current?.end ?? 45;
  const pages = Array.from({ length: last - first + 1 }, (_, n) => first + n);
  const chapter = projectAtPage(page);
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const activeThumb = useRef<HTMLButtonElement>(null);
  const dragging = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  useEffect(() => { setZoom(1); setFailed(false); if (viewport.current) viewport.current.scrollTo(0, 0); activeThumb.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [page, entry]);
  useEffect(() => {
    if (!entry) return;
    for (const adjacent of [page - 1, page + 1]) {
      if (adjacent >= first && adjacent <= last) { const image = new Image(); image.src = folioImage(adjacent); }
    }
  }, [page, entry, first, last]);
  useEffect(() => { const el = viewport.current; if (el) { el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2; el.scrollTop = (el.scrollHeight - el.clientHeight) / 2; } }, [zoom]);
  const go = (delta: number) => onPageChange(Math.max(first, Math.min(last, page + delta)));
  const changeZoom = (value: number) => setZoom(Math.max(1, Math.min(3, value)));
  const next = current ? portfolio[(portfolio.indexOf(current) + 1) % portfolio.length] : null;
  return <Dialog open={entry !== null} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="folio-dialog" showCloseButton={false} onKeyDown={event => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-slot="select-trigger"], [data-slot="select-content"]')) return;
      if (event.key === 'ArrowRight' && zoom === 1) { event.preventDefault(); go(1); }
      if (event.key === 'ArrowLeft' && zoom === 1) { event.preventDefault(); go(-1); }
      if (event.key === '+' || event.key === '=') { event.preventDefault(); changeZoom(zoom + .5); }
      if (event.key === '-') { event.preventDefault(); changeZoom(zoom - .5); }
    }}>
      <header className="folio-header"><div><p className="eyebrow">Xinyi (Sydnie) Zhang / Portfolio</p><DialogTitle className="folio-title">{current?.title ?? 'In Seek of Homeland'}</DialogTitle><DialogDescription className="folio-description">{current?.subtitle ?? 'Landscape architecture & urban design · 2023'}</DialogDescription></div>
        <div className="folio-header-actions"><Select value={entry ?? 'landscape'} onValueChange={value => { if (value) onProjectChange(value as PortfolioId | 'landscape'); }}><SelectTrigger className="chapter-picker" aria-label="Choose portfolio chapter"><SelectValue>{current ? `${current.number} / ${current.title}` : 'Portfolio'}</SelectValue></SelectTrigger><SelectContent className="chapter-options" alignItemWithTrigger={false}><SelectItem value="landscape">Portfolio</SelectItem>{portfolio.map(p => <SelectItem value={p.id} key={p.id}>{p.number} / {p.title}</SelectItem>)}</SelectContent></Select><Button variant="ghost" size="icon" className="reader-close" aria-label="Close portfolio" onClick={onClose}><X size={21} /></Button></div>
      </header>
      <div className="folio-toolbar"><span className="folio-caption" aria-live="polite">{pageCaptions[page - 1]}</span><div className="zoom-tools"><Button variant="ghost" size="icon" aria-label="Zoom out" disabled={zoom === 1} onClick={() => changeZoom(zoom - .5)}><Minus size={15} /></Button><span aria-live="polite">{Math.round(zoom * 100)}%</span><Button variant="ghost" size="icon" aria-label="Zoom in" disabled={zoom === 3} onClick={() => changeZoom(zoom + .5)}><Plus size={15} /></Button><Button variant="ghost" size="icon" aria-label="Fit page" onClick={() => setZoom(1)}><Maximize2 size={15} /></Button></div></div>
      <div ref={viewport} className={`folio-viewport ${zoom > 1 ? 'zoomed' : ''} ${isDragging ? 'dragging' : ''}`} role="region" aria-label="Portfolio drawing. Use plus or minus to zoom; drag or scroll to explore a zoomed page." tabIndex={0} onDoubleClick={() => setZoom(zoom === 1 ? 2 : 1)} onPointerDown={event => {
        if (zoom <= 1 || event.pointerType !== 'mouse' || event.button !== 0) return;
        const el = event.currentTarget;
        dragging.current = { x: event.clientX, y: event.clientY, left: el.scrollLeft, top: el.scrollTop };
        el.setPointerCapture(event.pointerId); setIsDragging(true); event.preventDefault();
      }} onPointerMove={event => {
        if (!dragging.current) return;
        event.currentTarget.scrollLeft = dragging.current.left + dragging.current.x - event.clientX;
        event.currentTarget.scrollTop = dragging.current.top + dragging.current.y - event.clientY;
      }} onPointerUp={() => { dragging.current = null; setIsDragging(false); }} onPointerCancel={() => { dragging.current = null; setIsDragging(false); }} onLostPointerCapture={() => { dragging.current = null; setIsDragging(false); }}>
        <div className="folio-page-stage" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
          {failed ? <div className="folio-error"><p>This drawing couldn’t load.</p><a href={folioImage(page)} target="_blank" rel="noreferrer">Open the original page <ArrowUpRight size={16} /></a></div> : <img key={page} className="folio-page" src={folioImage(page)} alt={pageCaptions[page - 1]} onError={() => setFailed(true)} draggable={false} />}
        </div>
      </div>
      <div className="folio-navigation"><Button variant="ghost" className="page-arrow" onClick={() => go(-1)} disabled={page === first}><ArrowLeft size={18} /><span>Previous</span></Button><div className="folio-position"><strong>{String(page).padStart(2, '0')} <span>/ 45</span></strong><span className="folio-help">{zoom > 1 ? 'Drag to look closer' : '← → to turn pages · double-click to zoom'}</span></div>{page === last && next ? <Button variant="ghost" className="page-arrow next-chapter" onClick={() => onProjectChange(next.id)}><span>Next project</span><ArrowRight size={18} /></Button> : <Button variant="ghost" className="page-arrow" onClick={() => go(1)} disabled={page === last}><span>Next</span><ArrowRight size={18} /></Button>}</div>
      <nav className="folio-thumbnails" aria-label="Portfolio pages">{pages.map(n => <button ref={n === page ? activeThumb : undefined} key={n} className={n === page ? 'current-page' : ''} aria-current={n === page ? 'page' : undefined} aria-label={`Page ${n}: ${pageCaptions[n - 1]}`} onClick={() => onPageChange(n)}><img src={folioImage(n, true)} alt="" loading="lazy" width="80" height="57" /><span>{String(n).padStart(2, '0')}</span></button>)}</nav>
      <div className="folio-credit"><span>{chapter?.title ?? 'In Seek of Homeland'}</span>{current && <button onClick={() => onProjectChange('landscape', page)}>View portfolio <ArrowUpRight size={13} /></button>}</div>
    </DialogContent>
  </Dialog>;
}
