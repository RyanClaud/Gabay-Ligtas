
export interface ScamAnalysis {
  isScam: boolean;
  confidence: number;
  reasonTagalog: string;
  actionTagalog: string;
}

export interface AwarenessArticle {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  details: string;
}

export enum AppTab {
  SCANNER = 'scanner',
  LEARN = 'learn',
  HELP = 'help'
}
