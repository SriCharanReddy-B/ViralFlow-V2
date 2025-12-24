
export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  createdAt: number;
}

export interface StoredAnalysis {
  id: string;
  userId: string;
  videoName: string;
  analysis: VideoAnalysis;
  thumbnails: Thumbnail[];
  vibe?: string;
  videoUrl?: string;
  createdAt: number;
}

export interface KeyMoment {
  timestamp: string;
  description: string;
  viralScore: number;
}

export interface ThumbnailMoment {
  seconds: number;
  timestamp: string;
  prompt: string;
  suggestedText: string;
  fontStyle: string;
  emotion: string;
  linkedTitle: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface VideoAnalysis {
  summary: string;
  targetAudience: string;
  viralityHook: string;
  primaryTrendingTitle: string;
  optimizedDescription: string;
  trendingContext: string;
  keyMoments: KeyMoment[];
  suggestedTags: string[];
  thumbnailMoments: ThumbnailMoment[];
  sources?: GroundingSource[];
}

export interface Thumbnail {
  id: string;
  url: string;
  originalFrame?: string;
  prompt: string;
  timestamp: string;
  suggestedText: string;
  linkedTitle: string;
  emotion: string;
  fontStyle: string;
  isRegenerating?: boolean;
  feedback?: 'up' | 'down' | null;
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  READY = 'READY',
  ANALYZING = 'ANALYZING',
  CAPTURING_FRAMES = 'CAPTURING_FRAMES',
  GENERATING_THUMBNAILS = 'GENERATING_THUMBNAILS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
