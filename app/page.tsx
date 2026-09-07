'use client';
import { useEffect, useState, useRef } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Map } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PortfolioIndex, PortfolioReader } from '@/components/clearing/portfolio';
import { ResearchSection, ResearchReader } from '@/components/clearing/research';
import { SceneJourney } from '@/components/clearing/journey';
import { portfolio, type PortfolioId } from '@/lib/portfolio';

type View = 'explore' | 'academic';
type Entry = 'wildfire' | 'defensible' | 'landscape' | 'about' | 'cv' | PortfolioId;
const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
const asset = (name: string) => `${base}/images/${name}`;
const projects = [
  { id:'wildfire' as const, number:'01', category:'Published research', title:'Wildfire as urban risk', subtitle:'Global synthesis of compound hazards, cascade pathways, and research-exposure-vulnerability mismatch', question:'What happens when wildfire risk reaches beyond the burn perimeter?', description:'Investigating how wildfire-linked risks travel through urban systems, and where research attention, exposure, and vulnerability diverge.', image:'', link:'https://doi.org/10.1088/1748-9326/ae8039', linkLabel:'Read the paper', tags:['Wildfire','Urban risk','Global synthesis'] },
  { id:'defensible' as const, number:'02', category:'Research in progress', title:'Where the Fire Stopped', subtitle:'AI-driven defensible space design from post-fire evidence', question:'How can landscape evidence inform the spaces around our homes?', description:'Connecting pre-fire landscape conditions and post-fire building outcomes in the 2025 Eaton Fire with a workflow for generating and reviewing site-specific landscape alternatives.', image:'defensible-design.jpg', link:'https://xinyizh-sydnie.github.io/eaton-evidence-hub/', linkLabel:'Explore the evidence hub', tags:['Defensible space','GeoAI','Design research'] },
  { id:'landscape' as const, number:'03', category:'Landscape architecture', title:'In Seek of Homeland', subtitle:'Landscapes of memory, change, and belonging', question:'What makes a landscape feel like home?', description:'A collection of landscape architecture projects exploring water, ecology, cultural memory, and the ways people make a place their own.', image:'homeland.jpg', link:'', linkLabel:'', tags:['Landscape architecture','Urban design','Illustration'] },
];
const validEntry = (value:string | null):value is Entry => ['wildfire','defensible','landscape','about','cv',...portfolio.map(p=>p.id)].includes(value || '');

export default function Home() {
  const [view,setView] = useState<View>('explore');
  const [selected,setSelected] = useState<Entry | null>(null);
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
  function changeView(value:string){const next=value as View;setView(next);url(next,selected,isFolio?folioPage:undefined);}
  function open(entry:Entry,page?:number){
    const chapter=portfolio.find(p=>p.id===entry);
    const nextPage=page??chapter?.start??1;
    setSelected(entry);setFolioPage(nextPage);url(view,entry,chapter||entry==='landscape'?nextPage:undefined);
  }
  function close(){setSelected(null);url(view,null);}
  function turnPage(page:number){setFolioPage(page);url(view,selected,page,true);}
  return <Tabs value={view} onValueChange={changeView} className="site-shell">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className="site-header">
      <a className="wordmark" href={base+'/'} aria-label="xyz / A Clearing home"><span className="xyz">xyz<span>·</span></span><span className="divider">/</span><span className="clearing-word">A Clearing</span></a>
      <nav className="main-nav" aria-label="Main navigation"><a className="portfolio-nav" href="#portfolio" onClick={event=>{if(view!=='explore'){event.preventDefault();changeView('explore');requestAnimationFrame(()=>document.getElementById('portfolio')?.scrollIntoView({behavior:'smooth'}));}}}>Portfolio</a><Button variant="ghost" className="nav-button" onClick={()=>open('about')}>About</Button><Button variant="ghost" className="nav-button" onClick={()=>open('cv')}>CV</Button><a className="contact-link" href="mailto:xinyi_zh@berkeley.edu">Contact <ArrowUpRight size={15}/></a></nav>
      <TabsList className="view-switch" aria-label="Website view"><TabsTrigger className="view-button" value="explore"><Map size={14}/> Explore</TabsTrigger><TabsTrigger className="view-button" value="academic"><BookOpen size={14}/> Academic</TabsTrigger></TabsList>
    </header>
    <main id="main-content">
      <TabsContent value="explore" className="explore-view">
        <section className="clearing-section" aria-label="Explore Sydnie Zhang's work">
          <div className="clearing-introduction"><h1 className="display-heading">Sydnie Zhang</h1><p className="clearing-concept">A Clearing brings research, landscape design, and drawing into a shared landscape. It is a place to pause, move between scales, and notice connections: between fire and the city, water and settlement, small ecologies and everyday life. Each path offers a different way of looking at the places we inhabit.</p></div>
          <SceneJourney onOpen={open} visited={visited}/>
          <div className="clearing-after"><span>37.87° N / 122.26° W — Berkeley, California</span><a href="#portfolio">Portfolio <ArrowRight size={15}/></a></div>
        </section>
        <ResearchSection onOpen={open} onAcademic={()=>changeView('academic')}/>
        <PortfolioIndex onOpen={open} onReadAll={()=>open('landscape')} visited={visited}/>

      </TabsContent>
      <TabsContent value="academic" className="academic-view">
        <div className="academic-intro"><div><p className="eyebrow">Research & practice</p><h1>Xinyi <span className="preferred-name">(Sydnie)</span> Zhang</h1><p className="academic-affiliation">PhD student in Landscape Architecture<br/>and Environmental Planning · UC Berkeley</p></div><p className="academic-statement">Landscape architect and climate hazard researcher. My current projects examine wildfire as urban risk and evidence-informed defensible space design.</p></div>
        <div className="academic-layout"><aside className="academic-sidebar"><a href="#publications">Publications</a><a href="#current-research">Current research</a><a href="#background">Background</a><Button variant="ghost" className="text-action" onClick={()=>open('cv')}>View CV <ArrowUpRight size={14}/></Button><a href="mailto:xinyi_zh@berkeley.edu">xinyi_zh@berkeley.edu</a><div className="research-keywords"><span className="eyebrow">Research interests</span><p>Wildfire-resilient design<br/>Defensible space<br/>Wildland–urban interface<br/>Remote sensing & GeoAI<br/>Generative environmental design</p></div></aside>
          <div className="academic-body"><section id="publications"><p className="eyebrow">01 / Publications</p><article className="academic-entry"><span className="entry-year">2026</span><div><a className="paper-title" href={projects[0].link} target="_blank" rel="noreferrer">Wildfire as urban risk: global synthesis of compound hazards, cascade pathways, and research-exposure-vulnerability mismatch <ArrowUpRight size={18}/></a><p><strong>Xinyi Zhang</strong> and Lu Liang</p><p><em>Environmental Research Letters</em> · Published 8 July 2026</p><div className="entry-actions"><a href={projects[0].link} target="_blank" rel="noreferrer">Paper ↗</a><Button variant="ghost" className="inline-button" onClick={()=>open('wildfire')}>Project overview ↗</Button></div></div></article><article className="academic-entry"><span className="entry-year">Practice</span><div><h3>Playbook for the Pyrocene: Design Strategies for Fire-Prone Communities</h3><p>Contributing researcher, SWA Group · XL Lab</p><p>Literature review, strategy cataloging, and data visualization for a practitioner-facing publication.</p></div></article></section>
            <section id="current-research"><p className="eyebrow">02 / Current research</p><article className="academic-entry"><span className="entry-year">Ongoing</span><div><button className="paper-title" onClick={()=>open('defensible')}>Where the Fire Stopped <ArrowUpRight size={18}/></button><p>AI-driven defensible space design from post-fire evidence.</p><p>Pre-fire landscape conditions, structure outcomes, and evidence-informed generative design in the 2025 Eaton Fire.</p><a className="entry-link" href={projects[1].link} target="_blank" rel="noreferrer">Evidence & design hub ↗</a></div></article></section>
            <section id="background"><p className="eyebrow">03 / Background</p><div className="background-grid"><div><h3>Education</h3><p><strong>UC Berkeley</strong><br/>PhD, Landscape Architecture and Environmental Planning · 2025–present</p><p><strong>University of Pennsylvania</strong><br/>Master of Landscape Architecture and Regional Planning · 2023<br/>Certificate of Urban Design</p><p><strong>Beijing Forestry University</strong><br/>BEng, Landscape Architecture · 2021</p></div><div><h3>Selected practice</h3><p><strong>OJB Landscape Architecture</strong><br/>Sustainable Design Specialist<br/>2023–2025</p><p><strong>SWA Group · XL Lab</strong><br/>Design Researcher · 2023<br/>Intern Researcher · 2022</p><Button variant="ghost" className="text-action" onClick={()=>open('landscape')}>View design portfolio <ArrowUpRight size={14}/></Button></div></div></section>
          </div>
        </div>
      </TabsContent>
    </main>
    <footer className="site-footer"><span>xyz / A Clearing</span><span>Xinyi (Sydnie) Zhang</span><a href="mailto:xinyi_zh@berkeley.edu">Contact <ArrowUpRight size={14}/></a></footer>
    <PortfolioReader entry={isFolio ? selected as PortfolioId | 'landscape' : null} page={folioPage} onPageChange={turnPage} onProjectChange={open} onClose={close}/><ResearchReader open={selected==='wildfire'} onClose={close}/><Sheet open={selected!==null&&!isFolio&&selected!=='wildfire'} onOpenChange={isOpen=>{if(!isOpen)close();}}><SheetContent className="project-sheet" ref={sheetScroll}>
      {project?<><div className="sheet-copy"><p className="eyebrow">{project.number} / {project.category}</p><SheetTitle className="sheet-heading">{project.title}</SheetTitle><SheetDescription className="sheet-subtitle">{project.subtitle}</SheetDescription><p className="project-question">{project.question}</p><p>{project.description}</p><div className="project-tags">{project.tags.map(t=><span key={t}>{t}</span>)}</div></div>
        {project.id==='wildfire'?<div className="research-note"><p className="eyebrow">Environmental Research Letters · 2026</p><p className="research-note-title">Hazards.<br/>Pathways.<br/>Uneven exposure.</p><p>Xinyi Zhang & Lu Liang</p><a href={project.link} target="_blank" rel="noreferrer">Read the published paper <ArrowUpRight size={16}/></a></div>:<figure className="project-figure"><img src={asset(project.image)} alt={project.id==='landscape'?'Back to Homeland: original illustration by Xinyi Zhang.':'Evidence-informed design workflow and alternative parcel plans.'}/><figcaption>{project.id==='landscape'?'Back to Homeland · From the design portfolio':'Evidence-informed landscape alternatives'}</figcaption></figure>}
        <div className="sheet-copy">{project.id==='defensible'&&<><h3>From observation to alternatives</h3><p>The prototype connects landscape measurements, generated alternatives, independent review, and environmental comparisons. Its study includes 7,122 single-family homes within the Eaton Fire perimeter.</p><p className="project-caveat">Research prototype. Candidate designs retain their review status; they are not certified fire-safety recommendations.</p></>}
          {project.id==='wildfire'&&<><h3>Publication</h3><p>Zhang, X., & Liang, L. (2026). Wildfire as urban risk: global synthesis of compound hazards, cascade pathways, and research-exposure-vulnerability mismatch. <em>Environmental Research Letters.</em></p><p className="doi">DOI: 10.1088/1748-9326/ae8039</p></>}

          {project.link&&<a className="external-button" href={project.link} target="_blank" rel="noreferrer">{project.linkLabel}<ArrowUpRight size={17}/></a>}<div className="next-project"><span className="eyebrow">Continue exploring</span><button onClick={()=>open(projects[(projects.indexOf(project)+1)%projects.length].id)}>{projects[(projects.indexOf(project)+1)%projects.length].title}<ArrowRight size={17}/></button></div></div>
      </>:<div className="sheet-copy about-copy"><p className="eyebrow">{selected==='cv'?'Curriculum vitae':'About'}</p><SheetTitle className="sheet-heading">Xinyi (Sydnie) Zhang</SheetTitle><SheetDescription className="sheet-subtitle">Landscape architect and climate hazard researcher<br/>PhD student · UC Berkeley</SheetDescription><p>I’m Xinyi Zhang, and I go by Sydnie. I’m a PhD student in Landscape Architecture and Environmental Planning at UC Berkeley. My current research includes wildfire as urban risk and defensible space design informed by post-fire evidence.</p><p>Before beginning my PhD, I worked in landscape practice and design research with OJB and SWA Group’s XL Lab.</p><h3>Education</h3><p>UC Berkeley · PhD in Landscape Architecture and Environmental Planning, 2025–present</p><p>University of Pennsylvania · Master of Landscape Architecture and Regional Planning, 2023; Certificate of Urban Design</p><p>Beijing Forestry University · BEng in Landscape Architecture, 2021</p><h3>Research & practice</h3><p>UC Berkeley · Graduate Researcher, 2025–present<br/>OJB Landscape Architecture · Sustainable Design Specialist, 2023–2025<br/>SWA Group, XL Lab · Design Researcher, 2023; Intern Researcher, 2022</p><h3>Advisors</h3><p>Danielle Rivera and Lu Liang</p><a className="external-button" href="mailto:xinyi_zh@berkeley.edu">xinyi_zh@berkeley.edu <ArrowUpRight size={17}/></a><button className="text-action about-index" onClick={()=>{setSelected(null);setView('academic');url('academic',null);}}>View publications & research <ArrowRight size={16}/></button></div>}
    </SheetContent></Sheet>
  </Tabs>;
}
