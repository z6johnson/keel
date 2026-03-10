export type BeatRole = 'statement' | 'paragraph' | 'signal' | 'breath' | 'section';

export interface Beat {
  id: string;
  role: BeatRole;
  content?: string;
  caption?: string;
  moduleId?: string;
}

export interface Module {
  id: string;
  title: string;
  estimatedMinutes: number;
  beats: Beat[];
}

export interface Manifest {
  title: string;
  modules: Module[];
  sequence: string[];
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
  flatBeats: Beat[];
  currentIndex: number;
  colorMode: 'light' | 'dark';
  contentCache: Map<string, string>;
  modules: Module[];
  selectedModuleIds: string[];
  isTransitioning: boolean;
}

export interface BeatInfo {
  beat: Beat;
  content: string;
  index: number;
  total: number;
  moduleTitle: string;
  moduleIndex: number;
  moduleTotal: number;
}
