
import React, { useState, useEffect } from 'react';
import { Mail, Lock, UserPlus, LogIn, Zap, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, User as UserIcon } from 'lucide-react';
import { dbService } from '../services/dbService';
import { User } from '../types';

interface AuthPageProps {
  onAuthenticated: (user: User) => void;
}

type AuthMode = 'login' | 'register';

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [mode]);

  const validateEmail = (email: string) => {
    return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email.toLowerCase());
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setIsLoading(false);
      return;
    }

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setIsLoading(false);
          return;
        }
        if (!name.trim()) {
          setError("Please enter your name.");
          setIsLoading(false);
          return;
        }

        const newUser: User = {
          id: crypto.randomUUID(),
          email,
          name,
          password, 
          createdAt: Date.now()
        };

        await dbService.registerUser(newUser);
        setSuccess("Account created! Logging you in...");
        setTimeout(() => onAuthenticated(newUser), 1500);
      } else {
        const user = await dbService.getUser(email);
        if (!user || user.password !== password) {
          setError("Invalid email or password.");
          setIsLoading(false);
          return;
        }
        const { password: _, ...safeUser } = user;
        onAuthenticated(safeUser as User);
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 animate-in fade-in duration-700 relative z-10 transition-colors duration-500">
      <div className="w-full max-w-md relative">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-rose-600/10 dark:bg-rose-600/20 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[48px] p-8 md:p-12 shadow-3xl">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="bg-indigo-600 p-4 rounded-3xl shadow-xl shadow-indigo-600/30 mb-6">
              <Zap className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase mb-2">
              Viral<span className="text-indigo-600 dark:text-indigo-500">Flow</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              {mode === 'login' ? 'The viral engine is ready' : 'Join the elite creators'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {mode === 'register' && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-4">Full Name</label>
                <div className="relative group">
                  <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-3xl py-5 pl-14 pr-6 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                    placeholder="Alex Creator"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-4">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-3xl py-5 pl-14 pr-6 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-4">Password</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-3xl py-5 pl-14 pr-6 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-4">Confirm Password</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-3xl py-5 pl-14 pr-6 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-sm animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 text-sm animate-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p className="font-medium">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm font-bold flex items-center justify-center space-x-2 mx-auto"
            >
              <span>{mode === 'login' ? "New creator?" : "Already verified?"}</span>
              <span className="text-indigo-600 dark:text-indigo-400 flex items-center">
                {mode === 'login' ? 'Register' : 'Login'} <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
