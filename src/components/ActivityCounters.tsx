import React from 'react';
import { ActivityCounts } from '../types';

interface ActivityCountersProps {
  counts: ActivityCounts;
}

export const ActivityCounters: React.FC<ActivityCountersProps> = ({ counts }) => {
  const items = [
    { label: 'Standing', count: counts.Standing, emoji: '🧍', color: 'border-emerald-200 bg-emerald-50/60 text-emerald-900', numColor: 'text-emerald-700' },
    { label: 'Sitting', count: counts.Sitting, emoji: '🪑', color: 'border-indigo-200 bg-indigo-50/60 text-indigo-900', numColor: 'text-indigo-700' },
    { label: 'Walking', count: counts.Walking, emoji: '🚶', color: 'border-blue-200 bg-blue-50/60 text-blue-900', numColor: 'text-blue-700' },
    { label: 'Running', count: counts.Running, emoji: '🏃', color: 'border-amber-200 bg-amber-50/60 text-amber-900', numColor: 'text-amber-700' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl border p-3.5 flex items-center justify-between shadow-2xs ${item.color}`}
        >
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {item.label}
            </div>
            <div className={`text-2xl font-black font-mono mt-0.5 ${item.numColor}`}>
              {item.count}
            </div>
          </div>
          <div className="text-2xl">{item.emoji}</div>
        </div>
      ))}
    </div>
  );
};
