import React from 'react';
import { ExtractedFeatures } from '../types';
import { Activity, Gauge, ArrowUpDown, Compass } from 'lucide-react';

interface FeatureTelemetryProps {
  features: ExtractedFeatures;
}

export const FeatureTelemetry: React.FC<FeatureTelemetryProps> = ({ features }) => {
  const {
    avgKneeAngle,
    leftKneeAngle,
    rightKneeAngle,
    avgHipAngle,
    displacementVelocity,
    torsoAlignmentAngle,
    postureRatio,
    personDetected,
  } = features;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5">
          <Gauge className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Extracted Kinematic Features
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Real-time Telemetry</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Feature 1: Knee Flexion */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium mb-0.5">Knee Angle (Avg)</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-slate-900 font-mono">
              {personDetected ? `${avgKneeAngle}°` : '--'}
            </span>
            <span className="text-[10px] text-slate-400">
              {avgKneeAngle < 138 ? 'Bent (Seated)' : 'Extended'}
            </span>
          </div>
          {/* Progress gauge */}
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full ${avgKneeAngle < 138 ? 'bg-indigo-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (avgKneeAngle / 180) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-1">
            <span>0°</span>
            <span className="text-amber-600 font-semibold">138° (Sit)</span>
            <span>180°</span>
          </div>
        </div>

        {/* Feature 2: Hip Angle */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium mb-0.5">Hip Angle (Avg)</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-slate-900 font-mono">
              {personDetected ? `${avgHipAngle}°` : '--'}
            </span>
            <span className="text-[10px] text-slate-400">
              {avgHipAngle < 148 ? 'Flexed' : 'Erect'}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${Math.min(100, (avgHipAngle / 180) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-1">
            <span>0°</span>
            <span className="text-amber-600 font-semibold">148°</span>
            <span>180°</span>
          </div>
        </div>

        {/* Feature 3: Kinetic Velocity / Stride Spread */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium mb-0.5">
            {features.isStaticImage ? 'Stride Spread (Photo)' : 'Velocity Index'}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-slate-900 font-mono">
              {personDetected
                ? features.isStaticImage
                  ? `${features.strideSpread ?? 0}x`
                  : displacementVelocity.toFixed(2)
                : '--'}
            </span>
            <span className="text-[10px] text-slate-400">
              {features.isStaticImage
                ? (features.strideSpread ?? 0) >= 0.8
                  ? 'Running Stride'
                  : (features.strideSpread ?? 0) >= 0.35
                  ? 'Walking Gait'
                  : 'Standing'
                : displacementVelocity >= 2.0
                ? 'Running'
                : displacementVelocity >= 0.65
                ? 'Walking'
                : 'Static'}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full ${
                (features.isStaticImage ? (features.strideSpread ?? 0) >= 0.8 : displacementVelocity >= 2.0)
                  ? 'bg-amber-500'
                  : (features.isStaticImage ? (features.strideSpread ?? 0) >= 0.35 : displacementVelocity >= 0.65)
                  ? 'bg-blue-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  features.isStaticImage
                    ? ((features.strideSpread ?? 0) / 1.2) * 100
                    : (displacementVelocity / 3.0) * 100
                )}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-1">
            <span>{features.isStaticImage ? '0.0' : '0.0'}</span>
            <span className="text-blue-600 font-medium">
              {features.isStaticImage ? '0.35 (Walk)' : '0.65 (Walk)'}
            </span>
            <span className="text-amber-600 font-medium">
              {features.isStaticImage ? '0.80 (Run)' : '2.0 (Run)'}
            </span>
          </div>
        </div>

        {/* Feature 4: Torso Alignment Angle */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium mb-0.5">Torso Incline</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-slate-900 font-mono">
              {personDetected ? `${torsoAlignmentAngle}°` : '--'}
            </span>
            <span className="text-[10px] text-slate-400">
              {torsoAlignmentAngle <= 15 ? 'Vertical' : 'Tilted'}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="h-full bg-teal-500"
              style={{ width: `${Math.min(100, (torsoAlignmentAngle / 45) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-1">
            <span>0° (Upright)</span>
            <span>45°</span>
          </div>
        </div>
      </div>
    </div>
  );
};
