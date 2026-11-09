import React from 'react';
import { ActivityType } from '../types';
import { Sparkles, Info, X } from 'lucide-react';

interface DemoModePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectActivity: (activity: 'Standing' | 'Sitting' | 'Walking' | 'Running') => void;
  currentActivity: ActivityType;
}

export const DemoModePanel: React.FC<DemoModePanelProps> = ({
  isOpen,
  onClose,
  onSelectActivity,
  currentActivity,
}) => {
  if (!isOpen) return null;

  const activities: Array<{
    name: 'Standing' | 'Sitting' | 'Walking' | 'Running';
    emoji: string;
    conf: number;
    description: string;
    color: string;
  }> = [
    {
      name: 'Standing',
      emoji: '🧍',
      conf: 92,
      description: 'Simulates extended legs (174°) and zero velocity.',
      color: 'hover:border-emerald-400 hover:bg-emerald-50/50',
    },
    {
      name: 'Sitting',
      emoji: '🪑',
      conf: 89,
      description: 'Simulates flexed knee angle (92°) & seated hip position.',
      color: 'hover:border-indigo-400 hover:bg-indigo-50/50',
    },
    {
      name: 'Walking',
      emoji: '🚶',
      conf: 85,
      description: 'Simulates upright posture with cyclic foot movement (v = 1.35).',
      color: 'hover:border-blue-400 hover:bg-blue-50/50',
    },
    {
      name: 'Running',
      emoji: '🏃',
      conf: 94,
      description: 'Simulates high-velocity stride displacement (v = 2.45).',
      color: 'hover:border-amber-400 hover:bg-amber-50/50',
    },
  ];

  return (
    <div className="bg-amber-50/90 border-2 border-amber-300 rounded-xl p-4 mb-6 shadow-xs relative">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
              <span>DEMO MODE (Simulation & Override)</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                Evaluation Safe
              </span>
            </h3>
            <p className="text-xs text-amber-800">
              Select an activity below to simulate instant detection metrics, update counters, and verify the UI without webcam constraints.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-amber-700 hover:text-amber-950 p-1 rounded hover:bg-amber-200/60"
          title="Close Demo Mode"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
        {activities.map((act) => {
          const isSelected = currentActivity === act.name;
          return (
            <button
              key={act.name}
              type="button"
              onClick={() => onSelectActivity(act.name)}
              className={`text-left p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-white border-amber-500 shadow-xs ring-2 ring-amber-400/40'
                  : `bg-white/80 border-amber-200 text-slate-800 ${act.color}`
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{act.emoji}</span>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  {act.conf}%
                </span>
              </div>
              <div className="font-bold text-sm text-slate-900 mt-1">{act.name}</div>
              <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                {act.description}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-[11px] text-amber-800">
        <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
        <span>
          Note: In accordance with academic honesty, simulated outputs are clearly demarcated from live computer vision inference.
        </span>
      </div>
    </div>
  );
};
