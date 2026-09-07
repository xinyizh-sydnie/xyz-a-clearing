import { base } from './portfolio';
export const paper = {
  title: 'Wildfire as urban risk',
  subtitle: 'Global synthesis of compound hazards, cascade pathways, and research-exposure-vulnerability mismatch',
  authors: 'Xinyi Zhang and Lu Liang',
  journal: 'Environmental Research Letters',
  citation: 'Zhang, X., & Liang, L. (2026). Wildfire as urban risk: global synthesis of compound hazards, cascade pathways, and research-exposure-vulnerability mismatch. Environmental Research Letters, 21, 133007. https://doi.org/10.1088/1748-9326/ae8039',
  doi: 'https://doi.org/10.1088/1748-9326/ae8039',
  pdf: `${base}/papers/wildfire-as-urban-risk.pdf`,
  abstract: 'As cities expand into fire-prone landscapes and climate change intensifies both wildfire activity and the associated climate extremes, wildfire is increasingly an urban risk. However, wildfire-linked risks have been inconsistently defined across disciplines, limiting cross-study comparison and policy translation. Compound climate conditions increasingly drive fire occurrence, but how specific combinations shape risk across fire regime types remains poorly resolved. Urban and wildland-urban interface (WUI) areas face rapidly growing fire exposure, while research concentrates on wildland settings and low-deprivation areas, leaving the most fire-exposed and socially vulnerable urban populations underrepresented in the literature. Here we review 3625 studies on wildfire-linked risks (Web of Science, 2000–2025) alongside global spatial risk analysis of fire occurrence, compound climate conditions, land use setting, and social vulnerability. We develop an interaction taxonomy using decision-tree logic that not only resolves terminological inconsistencies but also enables alignment with distinct management phases. Compound climate conditions, particularly co-occurring heat and drought, are the strongest predictors of wildfire occurrence globally, but their effects vary sharply across fire regime types. A triple-mismatch framework reveals that fire burden, research neglect, and social vulnerability converge most severely in the Global South. WUI and urban areas account for over 33% of global fire occurrence but receive only 4% of research attention. Urban fire risk depends on compound climate extremes rather than any single weather driver. Single climate extremes produce negligible risk elevation, yet compound conditions produce stronger risk amplification in urban areas than in any other setting. Smoke transport, debris flows, and infrastructure cascades emerge as the dominant propagation pathways through urban systems. Finally, based on these findings, we propose priority actions in compound hazard assessment, WUI-focused monitoring, equity-aware research, and phase-specific management.',
};
export const landSettings = [
  { id: 'wildland', title: 'Wildland', fire: 66.8, research: 96, note: 'Wildland settings dominate the research corpus. Fire-active regions in the Global South nevertheless remain sparsely studied.' },
  { id: 'wui', title: 'Wildland–urban interface', fire: 28.7, research: .9, note: 'Where buildings and wildland vegetation meet, fire exposure coincides with social vulnerability and very little research attention. The WUI has the highest combined mismatch score.' },
  { id: 'urban', title: 'Urban', fire: 4.5, research: 3.1, note: 'Built-up settings respond especially strongly to compound climate conditions. Their risks also travel through smoke, watersheds, infrastructure, and services.' },
];
export const paperFigures = [
  { number: 1, page: 4, title: 'Research–spatial risk workflow', caption: 'A review of 3,625 studies is combined with global observational data on fire, climate, land settings, and deprivation.' },
  { number: 2, page: 8, title: 'How the research field has evolved', caption: 'Publication trends and the distribution of reported hazard interaction types.' },
  { number: 3, page: 9, title: 'A shared language for linked hazards', caption: 'A decision tree distinguishes interaction types by causality, timing, spatial extent, and the sign of the interaction.' },
  { number: 4, page: 11, title: 'From hazard interactions to management', caption: 'Interaction types connect with IPCC risk components and different management phases.' },
  { number: 5, page: 12, title: 'Compound climate conditions', caption: 'Global wildfire occurrence and relative risk under single and compound climate conditions.' },
  { number: 6, page: 13, title: 'Different regions, different fire regimes', caption: 'Compound risk patterns vary across regions and fire regime types.' },
  { number: 7, page: 14, title: 'The triple mismatch', caption: 'Fire burden, research attention, and social vulnerability compared globally. Each panel uses its own relative index scale; colors are not directly comparable across panels.' },
  { number: 8, page: 16, title: 'Along the wildland-to-urban gradient', caption: 'Land area, fire occurrence, deprivation, publication share, and mismatch across wildland, WUI, and urban settings.' },
  { number: 9, page: 17, title: 'Compound-dependent urban fire risk', caption: 'Relative risk and exposed area by climate hazard and land setting. Estimates describe mean annual co-occurrence, not event-scale causal effects.' },
  { number: 10, page: 18, title: 'Where the evidence chain breaks', caption: 'An evidence map based on 2,368 studies with cascade-stage signals. The left columns show literature counts; later stages include an IPCC-based conceptual chain. This is not an estimate of causal mechanism strength.' },
];
export const figureImage = (number: number) => `${base}/images/research/figure-${String(number).padStart(2, '0')}.webp`;
