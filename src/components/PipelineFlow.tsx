import React from 'react';
import { Camera, UserCheck, Orbit, Cpu, Binary, MonitorPlay, ArrowRight } from 'lucide-react';
import { PipelineStage } from '../types';

interface PipelineFlowProps {
  currentStage: PipelineStage;
  personDetected: boolean;
}

export const PipelineFlow: React.FC<PipelineFlowProps> = ({ currentStage, personDetected }) => {
  const steps = [
    {
      id: 'webcam_capture',
      title: '1. Video / Image Input',
      desc: 'Raw RGB frame from camera or uploaded photo',
      icon: Camera,
    },
    {
      id: 'person_detection',
      title: '2. Person Detection',
      desc: personDetected ? 'Human subject detected in frame' : 'Scanning for body profile',
      icon: UserCheck,
    },
    {
      id: 'pose_estimation',
      title: '3. Pose Landmarks',
      desc: 'MediaPipe 33 skeletal keypoints (X, Y, Z)',
      icon: Orbit,
    },
    {
      id: 'feature_extraction',
      title: '4. Feature Extraction',
      desc: 'Knee & hip flexion angles + kinematic velocity',
      icon: Cpu,
    },
    {
      id: 'activity_classification',
      title: '5. Classification',
      desc: 'Rule-based decision tree with confidence',
      icon: Binary,
    },
    {
      id: 'result_display',
      title: '6. Result Display',
      desc: 'Dashboard telemetry & activity history log',
      icon: MonitorPlay,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          HAR Pipeline Architecture (System Flow)
        </h2>
        <span className="text-[11px] text-slate-400 font-mono">End-to-End Latency: ~18ms</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive =
            currentStage === step.id ||
            currentStage === 'result_display' ||
            (step.id === 'webcam_capture' && currentStage === 'image_input');
          const isWarning = step.id === 'person_detection' && !personDetected && currentStage !== 'idle';

          return (
            <div key={step.id} className="relative flex flex-col">
              <div
                className={`flex-1 rounded-lg p-2.5 border transition-all text-left ${
                  isActive
                    ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-2xs'
                    : isWarning
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isWarning
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold truncate">{step.title}</span>
                </div>
                <p className="text-[11px] leading-snug line-clamp-2 text-slate-500">{step.desc}</p>
              </div>

              {/* Connecting arrow for larger screens */}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-300 pointer-events-none">
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
