
import { useState, useCallback, useRef, useEffect } from 'react';
import React from 'react';
import { Upload, Zap, Activity, AlertCircle, RefreshCw, ChevronRight, Download, Clock, History, FileVideo, Sparkles, ShieldCheck, ExternalLink, Radio, Globe, BarChart, CreditCard, Trash2, Sun, Moon, Search, User, Fingerprint, Palette, MessageSquare } from 'lucide-react';
import { geminiService } from './services/geminiService';
import { dbService, GUEST_USER_ID } from './services/dbService';
import { AppState, VideoAnalysis, Thumbnail, StoredAnalysis } from './types';
import { AnalysisView } from './components/AnalysisView';

const VIBE_PRESETS = [
  { id: 'cinematic', label: 'Cinematic', icon: '🎬', desc: 'Moody, wide-lens, filmic' },
  { id: 'beast', label: 'Hyper-Energetic', icon: '⚡', desc: 'Bright, saturated, massive text' },
  { id: 'noir', label: 'Dark Mystery', icon: '🌑', desc: 'Shadowy, intense, suspenseful' },
  { id: 'minimal', label: 'Clean/Apple', icon: '⚪', desc: 'Modern, airy, sophisticated' },
  { id: 'retro', label: 'VHS/Retro', icon: '📺', desc: '80s analog, glitchy, nostalgic' },
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState<string>('');
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [history, setHistory] = useState<StoredAnalysis[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [fileName, setFileName] = useState<string>('original_video.mp4');
  const [customVibe, setCustomVibe] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('viralflow_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { fetchHistory(); }, []);
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('viralflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const fetchHistory = async () => {
    const items = await dbService.getUserAnalyses();
    setHistory(items);
  };

  const loadFromHistory = (item: StoredAnalysis) => {
    setAnalysis(item.analysis);
    setThumbnails(item.thumbnails);
    setFileName(item.videoName);
    setCustomVibe(item.vibe || '');
    setState(AppState.COMPLETED);
    setShowHistory(false);
  };

  const captureFrameAt = (seconds: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = hiddenVideoRef.current;
      const canvas = hiddenCanvasRef.current;
      if (!video || !canvas) return reject("Refs not ready");
      const onSeeked = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Canvas context error");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        video.removeEventListener('seeked', onSeeked);
        resolve(canvas.toDataURL('image/png'));
      };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = seconds;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { setError("Max size 200MB."); return; }
    setFileName(file.name);
    setVideoMimeType(file.type);
    setState(AppState.UPLOADING);
    const objectUrl = URL.createObjectURL(file);
    setVideoPreview(objectUrl);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      setVideoData((reader.result as string).split(',')[1]);
      setState(AppState.READY);
    };
  };

  const startAnalysis = async () => {
    if (!videoData) return;

    try {
      setState(AppState.ANALYZING);
      setCurrentStep(customVibe ? `Infusing engine with "${customVibe}" energy...` : 'Scanning viral patterns...');
      const result = await geminiService.analyzeVideo(videoData, videoMimeType, customVibe || undefined);
      
      if (!result || !result.thumbnailMoments) {
        throw new Error("Could not find high-potential moments.");
      }
      
      setAnalysis(result);

      setState(AppState.CAPTURING_FRAMES);
      const capturedFrames: { [key: number]: string } = {};
      for (let i = 0; i < result.thumbnailMoments.length; i++) {
        setCurrentStep(`Capturing precision frame ${i+1}/${result.thumbnailMoments.length}...`);
        capturedFrames[i] = await captureFrameAt(result.thumbnailMoments[i].seconds);
      }

      setState(AppState.GENERATING_THUMBNAILS);
      const currentThumbnails: Thumbnail[] = [];
      for (let i = 0; i < result.thumbnailMoments.length; i++) {
        const moment = result.thumbnailMoments[i];
        
        // Minor delay to throttle requests and avoid 429 errors
        if (i > 0) await new Promise(r => setTimeout(r, 800));

        setCurrentStep(`Human-like remastering of visual ${i+1}/${result.thumbnailMoments.length}...`);
        const enhancedUrl = await geminiService.enhanceFrame(
          capturedFrames[i], 
          moment.prompt, 
          moment.suggestedText, 
          moment.fontStyle, 
          moment.emotion, 
          customVibe || undefined
        );
        currentThumbnails.push({
          id: `thumb-${i}-${Date.now()}`,
          url: enhancedUrl,
          originalFrame: capturedFrames[i],
          prompt: moment.prompt,
          timestamp: moment.timestamp,
          suggestedText: moment.suggestedText,
          linkedTitle: moment.linkedTitle,
          emotion: moment.emotion,
          fontStyle: moment.fontStyle
        });
        setThumbnails([...currentThumbnails]);
      }

      const storedItem: StoredAnalysis = {
        id: crypto.randomUUID(),
        userId: GUEST_USER_ID,
        videoName: fileName,
        analysis: result,
        thumbnails: currentThumbnails,
        vibe: customVibe || undefined,
        createdAt: Date.now()
      };
      await dbService.saveAnalysis(storedItem);
      fetchHistory();
      setState(AppState.COMPLETED);
    } catch (err: any) {
      console.error("Analysis sequence failed:", err);
      setError(err.message || "An unexpected error occurred.");
      setState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setState(AppState.IDLE);
    setAnalysis(null);
    setThumbnails([]);
    setError(null);
  };

  return (
    <div className="min-h-screen relative p-4 md:p-8 lg:p-12 overflow-hidden transition-colors duration-500">
      <video ref={hiddenVideoRef} src={videoPreview || ''} className="hidden" muted />
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* NAVIGATION */}
      <nav className="relative z-10 flex items-center justify-between mb-16 max-w-7xl mx-auto">
        <div className="flex items-center space-x-4 group cursor-pointer" onClick={resetApp}>
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-xl shadow-indigo-600/30 group-hover:rotate-12 transition-transform duration-500">
            <Zap className="w-7 h-7 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">VIRALFLOW</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-indigo-500">Creative Engine</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={toggleTheme} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all hover:scale-105">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setShowHistory(!showHistory)} className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-white transition-all font-black uppercase tracking-widest text-xs">Vault</button>
        </div>
      </nav>

      {/* HISTORY DRAWER */}
      {showHistory && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[450px] z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border-l border-slate-200 dark:border-white/10 shadow-3xl p-12 animate-in slide-in-from-right duration-500">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-black italic uppercase text-slate-900 dark:text-white">Creator <span className="text-indigo-400">Archive</span></h2>
            <button onClick={() => setShowHistory(false)} className="p-3 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-500">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-6 overflow-y-auto h-[calc(100vh-200px)] pr-4 custom-scrollbar">
            {history.length === 0 ? (
              <div className="text-center py-32 opacity-20 flex flex-col items-center space-y-4">
                <Clock className="w-16 h-16" />
                <p className="text-sm font-black uppercase tracking-[0.3em]">No projects yet</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} onClick={() => loadFromHistory(item)} className="group cursor-pointer p-6 bg-slate-50 dark:bg-slate-900/40 hover:bg-indigo-600/10 border border-slate-200 dark:border-white/5 rounded-[32px] transition-all">
                  <div className="flex items-center space-x-6">
                    <div className="w-20 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-950">
                      <img src={item.thumbnails[0]?.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.analysis.primaryTrendingTitle}</h4>
                      <p className="text-[10px] text-slate-500 font-black uppercase mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-7xl mx-auto">
        {state === AppState.IDLE && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* VIBE CONSOLE SIDEBAR */}
            <div className="lg:col-span-5 space-y-8 animate-in slide-in-from-left duration-700">
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 p-10 rounded-[48px] shadow-3xl backdrop-blur-xl">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-indigo-600 rounded-2xl"><Palette className="w-6 h-6 text-white" /></div>
                  <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">Vibe Console</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mt-1">Creative Direction</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    {VIBE_PRESETS.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setCustomVibe(v.label)}
                        className={`p-4 rounded-3xl border text-left transition-all ${
                          customVibe.toLowerCase().includes(v.label.toLowerCase()) 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20' 
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-indigo-400'
                        }`}
                      >
                        <span className="text-xl mb-1 block">{v.icon}</span>
                        <span className="text-xs font-black uppercase tracking-tight block">{v.label}</span>
                        <span className={`text-[9px] opacity-60 block mt-1 ${customVibe.toLowerCase().includes(v.label.toLowerCase()) ? 'text-indigo-100' : ''}`}>{v.desc}</span>
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-3 block ml-2">Human Description</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <textarea 
                        placeholder="Describe the mood... (e.g. 'Dark and gritty 1940s film noir with dramatic lighting')" 
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5 rounded-3xl py-4 pl-12 pr-6 text-sm font-bold min-h-[120px] focus:border-indigo-600 outline-none transition-all shadow-inner resize-none"
                        value={customVibe}
                        onChange={(e) => setCustomVibe(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN UPLOAD AREA */}
            <div className="lg:col-span-7 flex flex-col justify-center animate-in slide-in-from-right duration-700">
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="group relative cursor-pointer transform transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-600 via-rose-600 to-amber-500 rounded-[60px] blur-3xl opacity-5 group-hover:opacity-20 transition-all duration-1000"></div>
                <div className="relative p-24 bg-white dark:bg-slate-900/60 border-4 border-dashed border-slate-200 dark:border-white/10 rounded-[56px] backdrop-blur-3xl text-center space-y-10 transition-all group-hover:border-indigo-500/50">
                  <div className="w-32 h-32 bg-indigo-600 rounded-[40px] flex items-center justify-center mx-auto shadow-3xl group-hover:rotate-6 transition-transform duration-500">
                    <Upload className="w-14 h-14 text-white" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-5xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase leading-[0.9]">Start Your <br/><span className="text-indigo-600">Viral Launch</span></h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-xs">MP4 • MOV • Max 200MB</p>
                  </div>
                  <div className="inline-flex items-center space-x-3 px-8 py-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black uppercase tracking-widest text-xs">
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                    <span>Gemini 3 Visual Remastering</span>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="video/*" />
              </div>
            </div>
          </div>
        )}

        {state === AppState.READY && (
           <div className="w-full max-w-4xl mx-auto space-y-12 py-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
             <div className="w-full aspect-video bg-slate-900 rounded-[48px] overflow-hidden border-8 border-white dark:border-slate-800 shadow-[0_30px_100px_rgba(0,0,0,0.3)] relative group">
                <video src={videoPreview || ''} className="w-full h-full object-cover" controls />
             </div>
             <button onClick={startAnalysis} className="px-20 py-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[40px] font-black uppercase tracking-[0.3em] shadow-[0_20px_60px_rgba(79,70,229,0.4)] flex items-center space-x-6 transform hover:scale-105 active:scale-95 transition-all">
               <Zap className="w-8 h-8 fill-white" />
               <span className="text-2xl">Bake Assets</span>
               <ChevronRight className="w-8 h-8" />
             </button>
           </div>
        )}

        {(state !== AppState.IDLE && state !== AppState.READY && state !== AppState.COMPLETED && state !== AppState.ERROR) && (
          <div className="w-full max-w-2xl mx-auto py-32 flex flex-col items-center text-center space-y-12 animate-in fade-in duration-500">
            <div className="relative">
              <div className="w-56 h-56 border-[16px] border-indigo-500/10 rounded-full flex items-center justify-center">
                <Activity className="w-24 h-24 text-indigo-600 animate-[pulse_1.5s_infinite]" />
              </div>
              <div className="absolute inset-0 w-56 h-56 border-t-[16px] border-indigo-600 rounded-full animate-spin"></div>
            </div>
            <div className="space-y-6">
              <h2 className="text-6xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white leading-none">{state.replace(/_/g, ' ')}</h2>
              <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-sm animate-pulse">{currentStep}</p>
            </div>
          </div>
        )}

        {state === AppState.COMPLETED && analysis && (
          <AnalysisView analysis={analysis} thumbnails={thumbnails} videoUrl={videoPreview} />
        )}

        {state === AppState.ERROR && (
          <div className="w-full max-w-xl mx-auto p-20 bg-rose-500/5 rounded-[64px] border border-rose-500/20 text-center space-y-10 shadow-3xl animate-in zoom-in">
            <div className="w-24 h-24 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-rose-500" />
            </div>
            <h3 className="text-5xl font-black italic text-slate-900 dark:text-white uppercase leading-none">Engine Halt</h3>
            <div className="space-y-4">
              <p className="text-rose-600 text-lg font-medium leading-relaxed">{error}</p>
              {error?.includes('429') && (
                <p className="text-xs text-rose-400 font-bold uppercase tracking-widest">Global Quota reached. Please wait a moment and retry.</p>
              )}
            </div>
            <button onClick={resetApp} className="w-full py-6 bg-rose-500 hover:bg-rose-600 text-white rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-500/20">Restart Launch</button>
          </div>
        )}
      </main>
      
      <style>{`
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.4); }
      `}</style>
    </div>
  );
};

export default App;
