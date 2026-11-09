import React from 'react';
import { ActivityType, ExtractedFeatures } from '../types';
import { ShieldCheck, Info } from 'lucide-react';

interface CurrentActivityCardProps {
  activity: ActivityType;
  confidence: number;
  reason: string;
  ruleMatched: string;
  isDetecting: boolean;
  features: ExtractedFeatures;
}

export const CurrentActivityCard: React.FC<CurrentActivityCardProps> = ({
  activity,
  confidence,
  reason,
  ruleMatched,
  isDetecting,
  features,
}) => {
  // Activity styling metadata
  const getActivityMeta = (act: ActivityType) => {
    switch (act) {
      case 'Standing':
        return {
          emoji: '🧍',
          label: 'Standing',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          barColor: 'bg-emerald-500',
          desc: 'Upright body posture with stationary lower limbs',
        };
      case 'Sitting':
        return {
          emoji: '🪑',
          label: 'Sitting',
          badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          barColor: 'bg-indigo-600',
          desc: 'Lowered torso with knee flexion angle < 138°',
        };
      case 'Walking':
        return {
          emoji: '🚶',
          label: 'Walking',
          badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
          barColor: 'bg-blue-600',
          desc: 'Rhythmic bipedal displacement with moderate velocity',
        };
      case 'Running':
        return {
          emoji: '🏃',
          label: 'Running',
          badgeBg: 'bg-amber-50 text-amber-900 border-amber-200',
          barColor: 'bg-amber-500',
          desc: 'High velocity stride cycles with dynamic flight phases',
        };
      default:
        return {
          emoji: '👤',
          label: 'No Person Detected',
          badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
          barColor: 'bg-slate-400',
          desc: 'Position subject in front of camera to begin tracking',
        };
    }
  };

  const meta = getActivityMeta(activity);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Current Classification
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
          <ShieldCheck className="w-3 h-3 text-blue-600" />
          Pose Evaluator
        </span>
      </div>

      {/* Main Activity Display */}
      <div className="flex items-center gap-4 my-2">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl shadow-inner shrink-0">
          {meta.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-2xl font-black text-slate-900 truncate">
              {meta.label}
            </h3>
            {activity !== 'No Person' && (
              <span className="text-lg font-black text-blue-600 font-mono">
                {confidence}%
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{meta.desc}</p>
        </div>
      </div>

      {/* Confidence Bar */}
      {activity !== 'No Person' && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Model Confidence</span>
            <span>{confidence >= 80 ? 'High Agreement' : 'Moderate Agreement'}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${meta.barColor}`}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      )}

      {/* Decision Rationale */}
      <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
        <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>Decision Logic:</span>
        </div>
        <p className="text-slate-600 font-mono text-[11px] leading-relaxed">
          {isDetecting ? reason : 'Detection paused. Click "Start Detection" to process webcam.'}
        </p>
        {isDetecting && activity !== 'No Person' && (
          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Rule: <code className="text-blue-700 font-semibold">{ruleMatched}</code></span>
          </div>
        )}
      </div>
    </div>
  );
};
