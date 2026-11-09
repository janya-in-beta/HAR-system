import React from 'react';
import { Camera, Code2, BookOpen, Sparkles, Activity } from 'lucide-react';

interface HeaderProps {
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onSelectImageMode: () => void;
  isImageMode: boolean;
  isDetecting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isDemoMode,
  onToggleDemoMode,
  onSelectImageMode,
  isImageMode,
  isDetecting,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Title */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                  Human Activity Recognition System
                </h1>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Live Status indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isDetecting ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>{isDetecting ? 'Pipeline Active' : 'System Paused'}</span>
            </div>

            {/* Insert Image Analysis Toggle */}
            <button
              type="button"
              onClick={onSelectImageMode}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                isImageMode
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-500/20'
                  : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
              }`}
              title="Upload human photo or test with sample images"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isImageMode ? 'Image Mode Active' : 'Insert Image'}</span>
            </button>

            {/* Demo Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDemoMode}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                isDemoMode
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
              title="Toggle interactive demo mode for evaluation without camera"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isDemoMode ? 'Exit Demo Mode' : 'Demo Mode'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
