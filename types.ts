
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: number;
}

export interface LogoOptions {
  description: string;
  subject: string;
  details: string;
  theme: string;
  style: 'mascot' | 'minimalist' | 'badge' | 'typography' | 'monogram' | 'cyber' | 'fantasy' | 'glossy';
  composition: 'head' | 'body' | 'symbol';
  noBackground: boolean;
  model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
  resolution: '1K' | '2K' | '4K';
  seed?: number;
  mode?: 'single' | 'collection' | 'characterSheet';
  referenceImage?: string; // Base64 string for design/identity
  poseImage?: string;      // Base64 string for posture/action
  customViews?: string[];
  gridSize?: string; // e.g., '2x2', '4x4', '1x2', etc.
}

export interface CollectionItem {
  id: string;
  subject: string;
  description: string;
}

export interface CollectionImportData {
  theme?: string;
  details?: string;
  style?: LogoOptions['style'];
  composition?: LogoOptions['composition'];
  noBackground?: boolean;
  model?: LogoOptions['model'];
  items?: Array<{
    subject: string;
    description?: string;
  }>;
}

export enum GeneratorStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
