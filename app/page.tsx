'use client';
import { useEffect, useState, useRef } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Map, Plus, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PortfolioIndex, PortfolioReader } from '@/components/clearing/portfolio';
import { portfolio, folioImage, type PortfolioId } from '@/lib/portfolio';

type View = 'explore' | 'academic';
type Entry = 'wildfire' | 'defensible' | 'landscape' | 'about' | 'cv' | PortfolioId;
const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
const asset = (name: string) => `${base}/images/${name}`;
const projects = [
  { id:'wildfire' as const, number:'01', category:'Published research', title:'Wildfire as urban risk', subtitle:'Global synthesis of compound hazards, cascade pathways, and research-exposure-vulnerability mismatch', question:'What happens when wildfire risk reaches beyond the burn perimeter?', description:'Investigating how wildfire-linked risks travel through urban systems, and where research attention, exposure, and vulnerability diverge.', image:'', link:'https://doi.org/10.1088/1748-9326/ae8039', linkLabel:'Read the paper', tags:['Wildfire','Urban risk','Global synthesis'] },
  { id:'defensible' as const, number:'02', category:'Research in progress', title:'Where the Fire Stopped', subtitle:'AI-driven defensible space design from post-fire evidence', question:'How can landscape evidence inform the spaces around our homes?', description:'Connecting pre-fire landscape conditions and post-fire building outcomes in the 2025 Eaton Fire with a workflow for generating and reviewing site-specific landscape alternatives.', image:'defensible-design.jpg', link:'https://xinyizh-sydnie.github.io/eaton-evidence-hub/', linkLabel:'Explore the evidence hub', tags:['Defensible space','GeoAI','Design research'] },
  { id:'landscape' as const, number:'03', category:'Complete design portfolio', title:'In Seek of Homeland', subtitle:'Landscapes of memory, change, and belonging', question:'What makes a landscape feel like home?', description:'A collection of landscape architecture projects exploring water, ecology, cultural memory, and the ways people make a place their own.', image:'homeland.jpg', link:'', linkLabel:'', tags:['Landscape architecture','Urban design','Illustration'] },
];
const validEntry = (value:string | null):value is Entry => ['wildfire','defensible','landscape','about','cv',...portfolio.map(p=>p.id)].includes(value || '');

const paths = [
  { name: 'Fire & change', stops: ['wildfire', 'defensible', 'back-to-homeland'] },
  { name: 'Water & time', stops: ['living-with-water', 'sediment-harvester', 'natural-as-calendar'] },
  { name: 'Home & belonging', stops: ['bride-market', 'ycd2050', 'back-to-homeland', 'homeland-drawings'] },
] as const;

export default function Home() {
  const [view,setView] = useState<View>('explore');
  const [selected,setSelected] = useState<Entry | null>(null);
  const [hovered,setHovered] = useState<string | null>(null);
  const [walk,setWalk] = useState<number | null>(null);
  const [stop,setStop] = useState(0);
  const [folioPage,setFolioPage] = useState(1);
  const [visited,setVisited] = useState<string[]>([]);
  const sheetScroll = useRef<HTMLDivElement>(null);
  const project = projects.find(p=>p.id===selected);
  const folioProject = portfolio.find(p=>p.id===selected);
  const isFolio = selected === 'landscape' || !!folioProject;
  useEffect(()=>{
    const sync=()=>{
      const params=new URLSearchParams(window.location.search);
      setView(params.get('view')==='academic'?'academic':'explore');
      const entry=params.get('project');
      setSelected(validEntry(entry)?entry:null);
      const chapter=portfolio.find(p=>p.id===entry);
      const parsed=Number(params.get('page') || chapter?.start || 1);
      setFolioPage(Number.isInteger(parsed)?Math.max(chapter?.start??1,Math.min(chapter?.end??45,parsed)):(chapter?.start??1));
    };
    sync(); window.addEventListener('popstate',sync); return ()=>window.removeEventListener('popstate',sync);
  },[]);
  useEffect(()=>{ if(selected) {setVisited(old=>old.includes(selected)?old:[...old,selected]);sheetScroll.current?.scrollTo(0,0);} },[selected]);
  function url(nextView:View,entry:Entry|null,page?:number,replace=false){
    const u=new URL(window.location.href);
    if(nextView!==view)u.hash='';
    nextView==='academic'?u.searchParams.set('view','academic'):u.searchParams.delete('view');
    entry?u.searchParams.set('project',entry):u.searchParams.delete('project');
    page?u.searchParams.set('page',String(page)):u.searchParams.delete('page');
    window.history[replace?'replaceState':'pushState']({},'',u);
  }
  function changeView(value:string){const next=value as View;setView(next);setWalk(null);setHovered(null);url(next,selected,isFolio?folioPage:undefined);}
  function open(entry:Entry,page?:number){
    const chapter=portfolio.find(p=>p.id===entry);
    const nextPage=page??chapter?.start??1;
    setSelected(entry);setFolioPage(nextPage);url(view,entry,chapter||entry==='landscape'?nextPage:undefined);
  }
  function close(){setSelected(null);url(view,null);}
  function turnPage(page:number){setFolioPage(page);url(view,selected,page,true);}
  function startPath(index:number){setWalk(index);setStop(0);}
  const stops=paths[walk??0].stops;
  const stopId=stops[stop];
  const stopWork=projects.find(p=>p.id===stopId)??portfolio.find(p=>p.id===stopId)!;
  const stopFolio=portfolio.find(p=>p.id===stopId);
  const active=walk===null?hovered:(stopFolio?'landscape':stopId);
  return <Tabs value={view} onValueChange={changeView} className="site-shell">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className="site-header">
      <a className="wordmark" href={base+'/'} aria-label="xyz / a clearing home"><span className="xyz">xyz<span>·</span></span><span className="divider">/</span><span className="clearing-word">a clearing</span></a>
      <nav className="main-nav" aria-label="Main navigation"><a className="portfolio-nav" href="#portfolio" onClick={event=>{if(view!=='explore'){event.preventDefault();changeView('explore');requestAnimationFrame(()=>document.getElementById('portfolio')?.scrollIntoView({behavior:'smooth'}));}}}>Portfolio</a><Button variant="ghost" className="nav-button" onClick={()=>open('about')}>About</Button><Button variant="ghost" className="nav-button" onClick={()=>open('cv')}>CV</Button><a className="hello-link" href="mailto:xinyi_zh@berkeley.edu">Say hello <ArrowUpRight size={15}/></a></nav>
      <TabsList className="view-switch" aria-label="Website view"><TabsTrigger className="view-button" value="explore"><Map size={14}/> Explore</TabsTrigger><TabsTrigger className="view-button" value="academic"><BookOpen size={14}/> Academic</TabsTrigger></TabsList>
    </header>
    <main id="main-content">
      <TabsContent value="explore" className="explore-view">
        <section className="clearing-scene" aria-label="Explore Xinyi Zhang's work">
          <div className="intro"><p className="eyebrow">Xinyi Zhang · UC Berkeley</p><h1>How do we live <br/>with changing <br/><em>landscapes?</em></h1><p className="intro-copy">I study wildfire and design landscapes. <br/>This is a small clearing for my <br/>research, drawings, and questions.</p><Button variant="ghost" className="walk-button" onClick={()=>startPath(walk===null?0:(walk+1)%paths.length)}>Take a little walk <ArrowRight size={18}/></Button><div className="path-choices" aria-label="Choose an exploration path">{paths.map((path,index)=><button key={path.name} onClick={()=>startPath(index)} aria-pressed={walk===index}><span className={`path-dot path-dot-${index}`} aria-hidden="true"/>{path.name}</button>)}</div></div>
          <div className={`garden ${active?'garden-focused':''}`}><img className="garden-art" src={asset('clearing.png')} width="1536" height="1024" fetchPriority="high" alt="An illustrated clearing with a small house, meadow, birch trees, and an open field notebook."/>
            <div className="garden-points">{projects.map(p=><button key={p.id} type="button" className={`garden-point point-${p.id} ${active===p.id?'is-focused':''}`} onClick={()=>open(p.id)} onMouseEnter={()=>setHovered(p.id)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setHovered(p.id)} onBlur={()=>setHovered(null)} aria-label={`Explore ${p.title}`}><span className="point-anchor"><Plus size={14} strokeWidth={1.6}/></span><span className="point-caption"><span className="point-meta">{p.number} / {p.category}</span><span className="point-name">{p.title}<ArrowUpRight size={14}/></span></span></button>)}</div>
            <span className="garden-note" aria-hidden="true">a place to look<br/>a little closer</span>
          </div>
          <div className="scene-bottom"><span className="coordinates"><span className="coord-cross" aria-hidden="true">+</span> 37.87° N &nbsp; 122.26° W <span className="coordinate-location">Berkeley, California</span></span><span className="scene-hint">Choose a little place to begin <ArrowUpRight size={15}/></span><a href="#portfolio" className="scroll-link" aria-label="Scroll to the complete portfolio"><ArrowDown size={18}/></a></div>
          {walk!==null&&<div className="walk-guide" role="region" aria-live="polite" aria-label="Guided exploration">
            {stopFolio&&<img className="walk-preview" src={folioImage(stopFolio.cover,true)} alt=""/>}
            <div className="walk-guide-copy"><span className="eyebrow">{paths[walk].name} · Stop {stop+1} / {stops.length}</span><p>{stopWork.question}</p><span className="walk-work-title">{stopWork.title}</span><div className="walk-progress">{stops.map((id,index)=><button key={id} className={stop===index?'current-stop':''} aria-label={`Go to stop ${index+1}`} aria-current={stop===index?'step':undefined} onClick={()=>setStop(index)} />)}</div></div>
            <Button className="small-action" onClick={()=>open(stopId)}>Look closer <ArrowUpRight size={15}/></Button><Button variant="ghost" className="guide-next" onClick={()=>{if(stop+1===stops.length)startPath((walk+1)%paths.length);else setStop(stop+1);}}>{stop+1===stops.length?'Another path':'Next stop'} <ArrowRight size={15}/></Button><Button variant="ghost" size="icon" className="walk-close" aria-label="End guided walk" onClick={()=>setWalk(null)}><X size={16}/></Button>
          </div>}

        </section>
        <section id="research-work" className="selected-work"><div className="section-heading"><div><p className="eyebrow">Research, unfolding</p><h2>Reading a changing landscape.</h2></div><Button variant="ghost" className="text-action" onClick={()=>changeView('academic')}>View research index <ArrowUpRight size={16}/></Button></div>
          <div className="research-feature"><button className="research-feature-image" onClick={()=>open('defensible')}><img src={asset('defensible-design.jpg')} alt="Evidence-informed design workflow and generated parcel alternatives from the research report." loading="lazy"/><span>Explore the project <ArrowUpRight size={17}/></span></button><div className="research-feature-copy"><p className="eyebrow">Research in progress / 2026</p><h3>Where the Fire Stopped</h3><p>From post-fire landscape evidence to the design of the spaces around our homes.</p><Button variant="ghost" className="text-action" onClick={()=>open('defensible')}>Evidence, design, and questions <ArrowRight size={16}/></Button></div></div>
          <button className="publication-strip" onClick={()=>open('wildfire')}><BookOpen className="pub-symbol" size={23}/><span><span className="eyebrow">Recently published · Environmental Research Letters</span><strong>Wildfire as urban risk</strong></span><span className="publication-year">2026</span><ArrowUpRight size={20}/></button>
        </section>
        <PortfolioIndex onOpen={open} onReadAll={()=>open('landscape')} visited={visited}/>

      </TabsContent>
      <TabsContent value="academic" className="academic-view">
        <div className="academic-intro"><div><p className="eyebrow">Research & practice</p><h1>Xinyi Zhang</h1><p className="academic-affiliation">PhD student in Landscape Architecture<br/>and Environmental Planning · UC Berkeley</p></div><p className="academic-statement">I work at the intersection of wildfire risk, landscape architecture, and computational design—connecting environmental evidence with the places people inhabit.</p></div>
        <div className="academic-layout"><aside className="academic-sidebar"><a href="#publications">Publications</a><a href="#current-research">Current research</a><a href="#background">Background</a><Button variant="ghost" className="text-action" onClick={()=>open('cv')}>View CV <ArrowUpRight size={14}/></Button><a href="mailto:xinyi_zh@berkeley.edu">xinyi_zh@berkeley.edu</a><div className="research-keywords"><span className="eyebrow">Research interests</span><p>Wildfire-resilient design<br/>Defensible space<br/>Wildland–urban interface<br/>Remote sensing & GeoAI<br/>Generative environmental design</p></div></aside>
          <div className="academic-body"><section id="publications"><p className="eyebrow">01 / Publications</p><article className="academic-entry"><span className="entry-year">2026</span><div><a className="paper-title" href={projects[0].link} target="_blank" rel="noreferrer">Wildfire as urban risk: global synthesis of compound hazards, cascade pathways, and research-exposure-vulnerability mismatch <ArrowUpRight size={18}/></a><p><strong>Xinyi Zhang</strong> and Lu Liang</p><p><em>Environmental Research Letters</em> · Published 8 July 2026</p><div className="entry-actions"><a href={projects[0].link} target="_blank" rel="noreferrer">Paper ↗</a><Button variant="ghost" className="inline-button" onClick={()=>open('wildfire')}>Project overview ↗</Button></div></div></article><article className="academic-entry"><span className="entry-year">Practice</span><div><h3>Playbook for the Pyrocene: Design Strategies for Fire-Prone Communities</h3><p>Contributing researcher, SWA Group · XL Lab</p><p>Literature review, strategy cataloging, and data visualization for a practitioner-facing publication.</p></div></article></section>
            <section id="current-research"><p className="eyebrow">02 / Current research</p><article className="academic-entry"><span className="entry-year">Ongoing</span><div><button className="paper-title" onClick={()=>open('defensible')}>Where the Fire Stopped <ArrowUpRight size={18}/></button><p>AI-driven defensible space design from post-fire evidence.</p><p>Pre-fire landscape conditions, structure outcomes, and evidence-informed generative design in the 2025 Eaton Fire.</p><a className="entry-link" href={projects[1].link} target="_blank" rel="noreferrer">Evidence & design hub ↗</a></div></article></section>
            <section id="background"><p className="eyebrow">03 / Background</p><div className="background-grid"><div><h3>Education</h3><p><strong>UC Berkeley</strong><br/>PhD, Landscape Architecture and Environmental Planning · 2025–present</p><p><strong>University of Pennsylvania</strong><br/>Master of Landscape Architecture and Regional Planning · 2023<br/>Certificate of Urban Design</p><p><strong>Beijing Forestry University</strong><br/>BEng, Landscape Architecture · 2021</p></div><div><h3>Selected practice</h3><p><strong>OJB Landscape Architecture</strong><br/>Sustainable Design Specialist<br/>2023–2025</p><p><strong>SWA Group · XL Lab</strong><br/>Design Researcher · 2023<br/>Intern Researcher · 2022</p><Button variant="ghost" className="text-action" onClick={()=>open('landscape')}>Explore the full design portfolio <ArrowUpRight size={14}/></Button></div></div></section>
          </div>
        </div>
      </TabsContent>
    </main>
    <footer className="site-footer"><span>xyz / a clearing</span><span>Research, landscapes, and things in between.</span><a href="mailto:xinyi_zh@berkeley.edu">Let’s be in touch <ArrowUpRight size={14}/></a></footer>
    <PortfolioReader entry={isFolio ? selected as PortfolioId | 'landscape' : null} page={folioPage} onPageChange={turnPage} onProjectChange={open} onClose={close}/><Sheet open={selected!==null&&!isFolio} onOpenChange={isOpen=>{if(!isOpen)close();}}><SheetContent className="project-sheet" ref={sheetScroll}>
      {project?<><div className="sheet-copy"><p className="eyebrow">{project.number} / {project.category}</p><SheetTitle className="sheet-heading">{project.title}</SheetTitle><SheetDescription className="sheet-subtitle">{project.subtitle}</SheetDescription><p className="project-question">{project.question}</p><p>{project.description}</p><div className="project-tags">{project.tags.map(t=><span key={t}>{t}</span>)}</div></div>
        {project.id==='wildfire'?<div className="research-note"><p className="eyebrow">Environmental Research Letters · 2026</p><p className="research-note-title">Hazards.<br/>Pathways.<br/>Uneven exposure.</p><p>Xinyi Zhang & Lu Liang</p><a href={project.link} target="_blank" rel="noreferrer">Read the published paper <ArrowUpRight size={16}/></a></div>:<figure className="project-figure"><img src={asset(project.image)} alt={project.id==='landscape'?'Back to Homeland: original illustration by Xinyi Zhang.':'Evidence-informed design workflow and alternative parcel plans.'}/><figcaption>{project.id==='landscape'?'Back to Homeland · From the design portfolio':'Evidence-informed generative design · From the Autodesk submission'}</figcaption></figure>}
        <div className="sheet-copy">{project.id==='defensible'&&<><h3>From observation to alternatives</h3><p>The prototype connects landscape measurements, generated alternatives, independent review, and environmental comparisons. Its study includes 7,122 single-family homes within the Eaton Fire perimeter.</p><p className="project-caveat">Research prototype. Candidate designs retain their review status; they are not certified fire-safety recommendations.</p></>}
          {project.id==='wildfire'&&<><h3>Publication</h3><p>Zhang, X., & Liang, L. (2026). Wildfire as urban risk: global synthesis of compound hazards, cascade pathways, and research-exposure-vulnerability mismatch. <em>Environmental Research Letters.</em></p><p className="doi">DOI: 10.1088/1748-9326/ae8039</p></>}

          {project.link&&<a className="external-button" href={project.link} target="_blank" rel="noreferrer">{project.linkLabel}<ArrowUpRight size={17}/></a>}<div className="next-project"><span className="eyebrow">Continue exploring</span><button onClick={()=>open(projects[(projects.indexOf(project)+1)%projects.length].id)}>{projects[(projects.indexOf(project)+1)%projects.length].title}<ArrowRight size={17}/></button></div></div>
      </>:<div className="sheet-copy about-copy"><p className="eyebrow">{selected==='cv'?'Curriculum vitae · Selected background':'A little about me'}</p><SheetTitle className="sheet-heading">Xinyi Zhang</SheetTitle><SheetDescription className="sheet-subtitle">Landscape researcher & designer<br/>PhD student · UC Berkeley</SheetDescription><p>I study how landscapes shape wildfire risk and how environmental evidence can inform design. My work brings together landscape architecture, remote sensing, GeoAI, and generative methods.</p><p>Before beginning my PhD, I worked in landscape practice and design research with OJB and SWA Group’s XL Lab.</p><h3>Education</h3><p>UC Berkeley · PhD in Landscape Architecture and Environmental Planning, 2025–present</p><p>University of Pennsylvania · Master of Landscape Architecture and Regional Planning, 2023; Certificate of Urban Design</p><p>Beijing Forestry University · BEng in Landscape Architecture, 2021</p><h3>Research & practice</h3><p>UC Berkeley · Graduate Researcher, 2025–present<br/>OJB Landscape Architecture · Sustainable Design Specialist, 2023–2025<br/>SWA Group, XL Lab · Design Researcher, 2023; Intern Researcher, 2022</p><h3>Advisors</h3><p>Danielle Rivera and Lu Liang</p><a className="external-button" href="mailto:xinyi_zh@berkeley.edu">xinyi_zh@berkeley.edu <ArrowUpRight size={17}/></a><button className="text-action about-index" onClick={()=>{setSelected(null);setView('academic');url('academic',null);}}>View publications & research <ArrowRight size={16}/></button></div>}
    </SheetContent></Sheet>
  </Tabs>;
}
