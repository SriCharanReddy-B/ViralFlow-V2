
import React, { useState, useRef, useEffect } from 'react';
import { VideoAnalysis, Thumbnail } from '../types';
import { 
  Play, Tag, Sparkles, CheckCircle, Clock, Copy, ExternalLink, 
  Flame, Type as TypeIcon, MousePointer2, Activity, Heart, 
  Layers, ChevronRight, LayoutGrid, FileText, BarChart3, Search, Info,
  TrendingUp, Zap, Palette, X, RefreshCw, Wand2, Scissors, Video,
  ThumbsUp, ThumbsDown, AlertCircle
} from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface AnalysisViewProps {
  analysis: VideoAnalysis;
  thumbnails: Thumbnail[];
  videoUrl: string | null;
}

type AnalysisPage = 'bundles' | 'strategy' | 'seo' | 'retention';

const FONT_PRESETS = [
  { 
    id: 'beast', 
    name: 'The Beast', 
    description: 'Ultra-heavy sans-serif, bright yellow, massive black shadows.', 
    style: 'Impactful, massive sans-serif with 20px black drop shadow, neon yellow fill, bold strokes.' 
  },
  { 
    id: 'cinematic', 
    name: 'Cinematic', 
    description: 'Thin serif, elegant tracking, moody glows.', 
    style: 'Elegant Serif, wide letter spacing, subtle white outer glow, 80% opacity, cinematic mystery.' 
  },
  { 
    id: 'electric', 
    name: 'Electric', 
    description: 'Cyberpunk neon, vibrant gradients, glowing edges.', 
    style: 'Display font, neon cyan glow, chromatic aberration effects, bold italic styling.' 
  },
  { 
    id: 'minimal', 
    name: 'Modern Sans', 
    description: 'Clean, professional, high readability.', 
    style: 'Modern geometric sans-serif, white fill, subtle gray shadow, perfectly balanced.' 
  },
];

export const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, thumbnails: initialThumbnails, videoUrl }) => {
  const [activePage, setActivePage] = useState<AnalysisPage>('bundles');
  const [copied, setCopied] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>(initialThumbnails);
  const [editingThumb, setEditingThumb] = useState<Thumbnail | null>(null);
  const [customStyle, setCustomStyle] = useState('');
  const [customText, setCustomText] = useState('');
  const [useCustomFrame, setUseCustomFrame] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  
  const editorVideoRef = useRef<HTMLVideoElement>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setThumbnails(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, feedback: t.feedback === type ? null : type };
      }
      return t;
    }));
  };

  const captureCurrentFrame = (): string | null => {
    const video = editorVideoRef.current;
    if (!video) return null;
    
    if (video.readyState < 2) {
      setEditorError("Video is not ready. Please wait for it to load or play a moment.");
      return null;
    }

    const canvas = document.createElement('canvas');
    const width = video.videoWidth || video.clientWidth;
    const height = video.videoHeight || video.clientHeight;
    
    if (!width || !height) {
      setEditorError("Could determine video dimensions.");
      return null;
    }

    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setEditorError("Canvas context failed.");
      return null;
    }

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error("Frame capture error:", e);
      setEditorError("Failed to capture frame. Your browser may have security restrictions.");
      return null;
    }
  };

  const handleRegenerate = async (thumb: Thumbnail) => {
    setEditorError(null);
    const frameToUse = useCustomFrame ? captureCurrentFrame() : thumb.originalFrame;
    
    if (!frameToUse) {
      if (!useCustomFrame && !thumb.originalFrame) {
        setEditorError("No original frame found to regenerate from.");
      }
      return;
    }
    
    const updatedThumbs = thumbnails.map(t => 
      t.id === thumb.id ? { ...t, isRegenerating: true } : t
    );
    setThumbnails(updatedThumbs);

    try {
      const enhancedUrl = await geminiService.enhanceFrame(
        frameToUse,
        thumb.prompt,
        customText || thumb.suggestedText,
        customStyle || thumb.fontStyle,
        thumb.emotion
      );

      setThumbnails(prev => prev.map(t => 
        t.id === thumb.id ? { 
          ...t, 
          url: enhancedUrl, 
          originalFrame: frameToUse,
          isRegenerating: false, 
          suggestedText: customText || t.suggestedText,
          fontStyle: customStyle || t.fontStyle,
          feedback: null 
        } : t
      ));
      setEditingThumb(null);
    } catch (err) {
      console.error("Regeneration failed", err);
      setEditorError("AI enhancement failed. Please try again.");
      setThumbnails(prev => prev.map(t => 
        t.id === thumb.id ? { ...t, isRegenerating: false } : t
      ));
    }
  };

  const openEditor = (thumb: Thumbnail) => {
    setEditingThumb(thumb);
    setCustomStyle(thumb.fontStyle);
    setCustomText(thumb.suggestedText);
    setUseCustomFrame(false);
    setEditorError(null);
  };

  const navItems = [
    { id: 'bundles', label: 'Viral Bundles', icon: LayoutGrid, description: 'Visual hooks & 3D Typography' },
    { id: 'strategy', label: 'Strategic Intel', icon: FileText, description: 'Narrative & Trend Context' },
    { id: 'seo', label: 'SEO & Discovery', icon: Search, description: 'Algorithmic Metadata' },
    { id: 'retention', label: 'Retention Map', icon: BarChart3, description: 'Engagement Peak Analysis' },
  ] as const;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 min-h-[75vh] animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 relative">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-80 flex-shrink-0">
        <div className="sticky top-8 space-y-4">
          <div className="bg-white/80 dark:bg-slate-800/20 p-5 rounded-[32px] border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl shadow-xl dark:shadow-2xl">
            <div className="px-3 py-4 mb-4">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-1">Campaign Portal</h3>
              <p className="text-slate-900 dark:text-white font-extrabold text-lg tracking-tight">Select Strategy</p>
            </div>
            
            <div className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-start space-x-4 px-5 py-5 rounded-2xl transition-all duration-300 group text-left ${
                    activePage === item.id 
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                  }`}
                >
                  <div className={`mt-1 p-2 rounded-xl transition-colors ${activePage === item.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20'}`}>
                    <item.icon className={`w-5 h-5 ${activePage === item.id ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`} />
                  </div>
                  <div className="flex-grow">
                    <span className="block font-bold text-sm leading-none mb-1">{item.label}</span>
                    <span className={`block text-[10px] font-medium opacity-60 ${activePage === item.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {item.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 p-5 bg-indigo-50 dark:bg-gradient-to-br dark:from-indigo-500/10 dark:to-transparent rounded-2xl border border-indigo-100 dark:border-indigo-500/10 relative overflow-hidden group/card">
               <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover/card:opacity-20 transition-opacity">
                  <Zap className="w-16 h-16 text-indigo-500 dark:text-indigo-400" />
               </div>
               <div className="flex items-center space-x-2 mb-3">
                  <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[11px] font-black text-indigo-500 dark:text-indigo-300 uppercase tracking-widest">Global Reach</span>
               </div>
               <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">Assets engineered for accessibility and readability across platforms.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* PAGE CONTENT */}
      <main className="flex-grow bg-white/50 dark:bg-slate-800/10 rounded-[40px] border border-slate-200 dark:border-slate-700/30 p-8 lg:p-12 backdrop-blur-sm min-h-[600px] relative overflow-hidden shadow-2xl shadow-slate-200 dark:shadow-none transition-colors duration-500">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none"></div>
        
        <div className="relative animate-in fade-in zoom-in-95 duration-500">
          {activePage === 'bundles' && (
            <div className="space-y-12">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400 mb-2">
                  <LayoutGrid className="w-6 h-6" />
                  <span className="text-sm font-black uppercase tracking-[0.2em]">Visual Strategy</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase">
                  Viral <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-rose-600 dark:from-indigo-400 dark:to-rose-400">Bundles</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl font-medium">
                  Customizable typography sets optimized for peak click-through rates.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {thumbnails.map((thumb, idx) => (
                  <div key={thumb.id} className="group relative bg-white dark:bg-slate-900/40 rounded-[44px] border border-slate-200 dark:border-white/5 overflow-hidden transition-all duration-700 hover:shadow-2xl hover:shadow-indigo-500/10 p-5 shadow-lg shadow-slate-200 dark:shadow-none">
                    <div className="aspect-video bg-slate-100 dark:bg-slate-950 rounded-[30px] relative overflow-hidden mb-8 border border-slate-200 dark:border-white/10 shadow-inner">
                      {thumb.url ? (
                        <img src={thumb.url} alt="Thumbnail" className={`w-full h-full object-cover transition-all duration-1000 ${thumb.isRegenerating ? 'opacity-30 scale-95' : 'group-hover:scale-110'}`} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-950 animate-pulse">
                           <Activity className="w-12 h-12 text-indigo-500/20" />
                        </div>
                      )}
                      
                      {thumb.isRegenerating && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-black/20 backdrop-blur-[2px]">
                          <RefreshCw className="w-10 h-10 text-indigo-600 dark:text-indigo-500 animate-spin" />
                        </div>
                      )}

                      <div className="absolute top-4 right-4 flex items-center space-x-2 px-3 py-1.5 bg-rose-500 rounded-xl text-white text-[10px] font-black uppercase tracking-widest border border-rose-400 shadow-xl">
                        <Heart className="w-3.5 h-3.5 fill-white" />
                        <span>{thumb.emotion}</span>
                      </div>
                    </div>
                    
                    <div className="px-3 space-y-5">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-full">Package v{idx + 1}</span>
                         <div className="flex items-center space-x-2">
                           <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-xl px-1 border border-slate-200 dark:border-white/5 mr-1">
                              <button 
                                onClick={() => handleFeedback(thumb.id, 'up')}
                                className={`p-2 transition-all ${thumb.feedback === 'up' ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title="Thumbs Up"
                              >
                                <ThumbsUp className={`w-4 h-4 ${thumb.feedback === 'up' ? 'fill-emerald-400/20' : ''}`} />
                              </button>
                              <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/5 mx-1" />
                              <button 
                                onClick={() => handleFeedback(thumb.id, 'down')}
                                className={`p-2 transition-all ${thumb.feedback === 'down' ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title="Thumbs Down"
                              >
                                <ThumbsDown className={`w-4 h-4 ${thumb.feedback === 'down' ? 'fill-rose-400/20' : ''}`} />
                              </button>
                           </div>

                           <button 
                              onClick={() => openEditor(thumb)} 
                              className="p-2.5 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white rounded-xl transition-all border border-slate-200 dark:border-white/5"
                              title="Edit Design"
                           >
                              <Palette className="w-4 h-4" />
                           </button>
                           <button 
                              onClick={() => copyToClipboard(thumb.linkedTitle, thumb.id)} 
                              className="p-2.5 bg-slate-100 dark:bg-slate-800/50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all border border-slate-200 dark:border-white/5"
                           >
                              {copied === thumb.id ? <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-white" /> : <Copy className="w-4 h-4 text-slate-400" />}
                           </button>
                         </div>
                      </div>
                      <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {thumb.linkedTitle}
                      </h4>
                      <div className="flex flex-col space-y-2">
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Active Style:</div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-1">{thumb.fontStyle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePage === 'strategy' && (
            <div className="space-y-12 max-w-5xl">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400 mb-2">
                  <FileText className="w-6 h-6" />
                  <span className="text-sm font-black uppercase tracking-[0.2em]">Context Analysis</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase">
                  Strategic <span className="text-rose-600 dark:text-rose-500">Intel</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Detailed behavioral analysis and trend alignment.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[40px] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200 dark:shadow-none">
                  <h3 className="text-xl font-bold mb-6 flex items-center space-x-3 text-rose-600 dark:text-rose-400">
                    <TrendingUp className="w-5 h-5" />
                    <span>Trending Context</span>
                  </h3>
                  <p className="text-slate-700 dark:text-slate-200 text-lg leading-relaxed font-medium italic">"{analysis.trendingContext}"</p>
                </div>
                <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[40px] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200 dark:shadow-none">
                  <h3 className="text-xl font-bold mb-6 flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
                    <Zap className="w-5 h-5 fill-indigo-500 dark:fill-indigo-400" />
                    <span>The Scroll-Stopper</span>
                  </h3>
                  <p className="text-slate-900 dark:text-white text-3xl font-black leading-tight mb-8">"{analysis.viralityHook}"</p>
                  <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                    <MousePointer2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Target Demographic</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{analysis.targetAudience}</span>
                    </div>
                  </div>
                </div>
              </div>

              {analysis.sources && analysis.sources.length > 0 && (
                <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[40px] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200 dark:shadow-none">
                  <h3 className="text-xl font-bold mb-6 flex items-center space-x-3 text-emerald-600 dark:text-emerald-400">
                    <ExternalLink className="w-5 h-5" />
                    <span>Real-time Discovery Sources</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {analysis.sources.map((source, idx) => (
                      <a 
                        key={idx}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group/source"
                      >
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover/source:text-emerald-600 dark:group-hover/source:text-white truncate pr-4">{source.title}</span>
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover/source:text-emerald-600 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[40px] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200 dark:shadow-none">
                <h3 className="text-xl font-bold mb-6 flex items-center space-x-3 text-slate-400 dark:text-slate-500">
                  <BarChart3 className="w-5 h-5" />
                  <span>Executive Summary</span>
                </h3>
                <p className="text-slate-700 dark:text-slate-300 text-xl leading-relaxed font-medium">{analysis.summary}</p>
              </div>
            </div>
          )}

          {activePage === 'seo' && (
            <div className="space-y-12 max-w-4xl">
               <div className="space-y-3">
                <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400 mb-2">
                  <Search className="w-6 h-6" />
                  <span className="text-sm font-black uppercase tracking-[0.2em]">Growth Discovery</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase">
                  SEO & <span className="text-amber-600 dark:text-amber-500">Discovery</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Algorithmic metadata tuned for maximum visibility.</p>
              </div>

              <div className="bg-white dark:bg-slate-900/40 rounded-[40px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl shadow-slate-200 dark:shadow-none">
                <div className="p-10 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
                  <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] flex items-center">
                    <Sparkles className="w-5 h-5 mr-4" />
                    Global Optimized Title
                  </h3>
                  <button 
                    onClick={() => copyToClipboard(analysis.primaryTrendingTitle, 'main-title')} 
                    className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
                  >
                     {copied === 'main-title' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                     <span className="text-xs uppercase">Copy Title</span>
                  </button>
                </div>
                <div className="p-12">
                  <p className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">{analysis.primaryTrendingTitle}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900/40 rounded-[40px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-xl shadow-slate-200 dark:shadow-none">
                <div className="p-10 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Viral Description</h3>
                  <button onClick={() => copyToClipboard(analysis.optimizedDescription, 'main-desc')} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-all">
                     {copied === 'main-desc' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <div className="p-10 space-y-10">
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-8 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed text-sm font-medium">{analysis.optimizedDescription}</p>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Discovery Cloud</h4>
                    <div className="flex flex-wrap gap-2.5">
                       {analysis.suggestedTags.map((tag, idx) => (
                         <span key={idx} className="px-5 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-300">#{tag}</span>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 'retention' && (
            <div className="space-y-12 max-w-5xl">
               <div className="space-y-3">
                <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400 mb-2">
                  <BarChart3 className="w-6 h-6" />
                  <span className="text-sm font-black uppercase tracking-[0.2em]">Retention Intelligence</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase">
                  Retention <span className="text-rose-600 dark:text-rose-500">Map</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Pinpointing engagement spikes.</p>
              </div>

              <div className="bg-white dark:bg-slate-900/40 rounded-[44px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl shadow-slate-200 dark:shadow-none">
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                   {analysis.keyMoments.map((moment, idx) => (
                     <div key={idx} className="p-10 flex flex-col md:flex-row items-start md:items-center gap-8 group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all">
                        <div className="flex-shrink-0 w-24 px-4 py-2 bg-slate-900 dark:bg-slate-950 rounded-2xl text-rose-500 font-mono text-sm font-black text-center border border-slate-700 dark:border-white/10 group-hover:border-rose-500 transition-all shadow-lg">
                           {moment.timestamp}
                        </div>
                        <div className="flex-grow space-y-5">
                           <div className="flex items-center justify-between">
                             <p className="text-slate-800 dark:text-slate-100 text-xl font-bold leading-tight group-hover:text-slate-950 dark:group-hover:text-white transition-colors">{moment.description}</p>
                             <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-500/20">{moment.viralScore}% IMPACT</span>
                           </div>
                           <div className="relative h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 via-indigo-400 to-rose-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${moment.viralScore}%` }} />
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* DESIGN CUSTOMIZER MODAL */}
      {editingThumb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[48px] border border-slate-200 dark:border-white/10 shadow-3xl p-8 lg:p-12 relative">
            <button onClick={() => setEditingThumb(null)} className="absolute top-8 right-8 p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col lg:flex-row gap-12">
              <div className="w-full lg:w-1/2 space-y-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">Refine <span className="text-indigo-600 dark:text-indigo-400">Visuals</span></h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Fine-tune frame selection and typography for Package v{thumbnails.indexOf(editingThumb) + 1}.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Frame Selection</label>
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => { setUseCustomFrame(false); setEditorError(null); }}
                        className={`text-[10px] font-bold uppercase transition-colors px-3 py-1 rounded-full border ${!useCustomFrame ? 'bg-indigo-600 text-white border-indigo-500' : 'text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/5 hover:text-indigo-600 dark:hover:text-white'}`}
                      >
                        AI Suggested
                      </button>
                      <button 
                        onClick={() => { setUseCustomFrame(true); setEditorError(null); }}
                        className={`text-[10px] font-bold uppercase transition-colors px-3 py-1 rounded-full border ${useCustomFrame ? 'bg-indigo-600 text-white border-indigo-500' : 'text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/5 hover:text-indigo-600 dark:hover:text-white'}`}
                      >
                        Custom Frame
                      </button>
                    </div>
                  </div>

                  <div className="aspect-video bg-slate-100 dark:bg-slate-950 rounded-[32px] overflow-hidden border border-slate-200 dark:border-white/10 shadow-inner relative group">
                    {!useCustomFrame ? (
                      <div className="relative w-full h-full">
                        <img src={editingThumb.url} alt="Current Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white font-bold text-sm">Active AI Preview</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        <video 
                          ref={editorVideoRef} 
                          src={videoUrl || ''} 
                          className="w-full h-full object-cover" 
                          controls
                          crossOrigin="anonymous"
                        />
                        <div className="absolute top-4 left-4 flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 rounded-xl text-white text-[10px] font-black uppercase tracking-widest border border-indigo-400 shadow-xl pointer-events-none">
                          <Scissors className="w-3.5 h-3.5" />
                          <span>Scrub to select frame</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {editorError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center space-x-3 text-rose-600 dark:text-rose-400 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-bold uppercase tracking-tight">{editorError}</p>
                  </div>
                )}

                <div className="bg-indigo-50 dark:bg-indigo-500/5 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-500/10">
                   <div className="flex items-center space-x-3 mb-2">
                      <Wand2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-black text-indigo-500 dark:text-indigo-300 uppercase tracking-widest">Growth Accelerator</span>
                   </div>
                   <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      AI will automatically enforce high-contrast outlines and subject-masking depth even with custom frame selections.
                   </p>
                </div>
              </div>

              <div className="w-full lg:w-1/2 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Viral Text Hook</label>
                  <input 
                    type="text" 
                    value={customText} 
                    onChange={(e) => setCustomText(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Enter text (e.g., OMG!)"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Viral Style Presets</label>
                  <div className="grid grid-cols-2 gap-3">
                    {FONT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setCustomStyle(preset.style)}
                        className={`p-4 rounded-2xl border transition-all text-left ${
                          customStyle === preset.style 
                            ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/20' 
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 hover:border-indigo-400 dark:hover:border-slate-600'
                        }`}
                      >
                        <span className={`block font-bold text-sm mb-1 ${customStyle === preset.style ? 'text-white' : 'text-slate-900 dark:text-slate-200'}`}>{preset.name}</span>
                        <span className={`block text-[10px] leading-tight ${customStyle === preset.style ? 'text-indigo-100' : 'text-slate-500'}`}>{preset.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Custom Style / CSS</label>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-full">Advanced</span>
                  </div>
                  <textarea 
                    value={customStyle} 
                    onChange={(e) => setCustomStyle(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-slate-700 dark:text-slate-300 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none shadow-inner"
                    placeholder="Describe your style or enter CSS properties..."
                  />
                </div>

                <button 
                  onClick={() => handleRegenerate(editingThumb)}
                  disabled={editingThumb.isRegenerating}
                  className="w-full flex items-center justify-center space-x-3 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {editingThumb.isRegenerating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5" />
                  )}
                  <span>{useCustomFrame ? 'Capture & Regenerate' : 'Apply Changes & Bake'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
