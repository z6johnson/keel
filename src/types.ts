export type SlideRole = 'statement' | 'paragraph' | 'signal' | 'breath';

export interface Slide {
  id: string;
  role: SlideRole;
  content?: string;
}

export interface Manifest {
  title: string;
  slides: Slide[];
  fogbellUrl?: string;
}

export interface Signal {
  title: string;
  summary: string;
  source: string;
  level: string;
  date: string;
  url?: string;
}

export interface EngineState {
  slides: Slide[];
  currentIndex: number;
  colorMode: 'light' | 'dark';
  contentCache: Map<string, string>;
  isTransitioning: boolean;
}

export interface SlideInfo {
  slide: Slide;
  content: string;
  index: number;
  total: number;
}
