import React, { useState } from 'react';
import { ActivityHistoryItem, ActivityType } from '../types';
import { Download, Trash2, History, Filter } from 'lucide-react';

interface ActivityHistoryTableProps {
  history: ActivityHistoryItem[];
  onClearHistory: () => void;
}

export const ActivityHistoryTable: React.FC<ActivityHistoryTableProps> = ({
  history,
  onClearHistory,
}) => {
  const [filter, setFilter] = useState<string>('all');

  const filteredHistory = filter === 'all'
    ? history
    : history.filter((item) => item.activity.toLowerCase() === filter.toLowerCase());

  // Export to CSV for academic records
  const exportToCSV = () => {
    if (history.length === 0) return;
    const headers = ['Timestamp', 'Detected Activity', 'Confidence (%)', 'Velocity Index', 'Knee Angle (deg)', 'Rule Reason'];
    const rows = history.map((h) => [
      `"${h.time}"`,
      `"${h.activity}"`,
      h.confidence,
      h.velocity.toFixed(2),
      h.kneeAngle,
      `"${h.reason.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HAR_Experiment_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActivityBadge = (activity: ActivityType) => {
    switch (activity) {
      case 'Standing':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">🧍 Standing</span>;
      case 'Sitting':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">🪑 Sitting</span>;
      case 'Walking':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">🚶 Walking</span>;
      case 'Running':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">🏃 Running</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">None</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
      {/* Table Header & Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Activity History Log</h3>
          <span className="text-xs text-slate-500 font-mono">({history.length} records)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Activity filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 text-xs font-medium focus:outline-hidden"
            >
              <option value="all">All Activities</option>
              <option value="standing">Standing</option>
              <option value="sitting">Sitting</option>
              <option value="walking">Walking</option>
              <option value="running">Running</option>
            </select>
          </div>

          {/* Export CSV button */}
          <button
            type="button"
            onClick={exportToCSV}
            disabled={history.length === 0}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Download CSV for Lab Record / Report"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          {/* Clear button */}
          <button
            type="button"
            onClick={onClearHistory}
            disabled={history.length === 0}
            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Clear history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto max-h-72 overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100/90 text-slate-700 sticky top-0 border-b border-slate-200 font-semibold z-10">
            <tr>
              <th className="py-2.5 px-3 w-28">Time</th>
              <th className="py-2.5 px-3">Detected Activity</th>
              <th className="py-2.5 px-3 w-28">Confidence</th>
              <th className="py-2.5 px-3 hidden sm:table-cell">Key Feature Rationale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  No activity events recorded yet. Start camera detection or select Demo Mode.
                </td>
              </tr>
            ) : (
              filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors font-sans">
                  <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{item.time}</span>
                      {item.sourceType === 'image' && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-sans font-semibold">
                          Photo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {getActivityBadge(item.activity)}
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                    <span className={item.confidence >= 85 ? 'text-emerald-700' : 'text-blue-700'}>
                      {item.confidence}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-500 hidden sm:table-cell truncate max-w-xs" title={item.reason}>
                    {item.reason}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
