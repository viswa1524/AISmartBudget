import React from 'react';
import { Layers, ArrowRight } from 'lucide-react';

interface TechPercentageBarProps {
  onNavigateTab?: (tab: string) => void;
}

export const TechPercentageBar: React.FC<TechPercentageBarProps> = ({ onNavigateTab }) => {
  const techItems = [
    { name: 'HTML', percentage: 26.8, color: '#e34c26', loc: 1140, role: 'Templates & Structure' },
    { name: 'CSS', percentage: 22.4, color: '#563d7c', loc: 960, role: 'Design & Themes' },
    { name: 'JavaScript', percentage: 27.5, color: '#f7df1e', loc: 1180, role: 'Client Engine & Logic' },
    { name: 'Python', percentage: 23.3, color: '#3572a5', loc: 1010, role: 'FastAPI & CLI Tools' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Full-Stack Technology Details Percentage
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
            (HTML · CSS · JavaScript · Python)
          </span>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('tech-stack')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View Full Details &amp; Sandbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Visual Multi-color Bar */}
      <div className="h-3 w-full rounded-full overflow-hidden bg-slate-950 flex p-0.5 border border-slate-800 shadow-inner">
        {techItems.map((item) => (
          <div
            key={item.name}
            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
            className="h-full first:rounded-l-full last:rounded-r-full transition-all hover:opacity-90 cursor-pointer"
            title={`${item.name}: ${item.percentage}%`}
            onClick={() => onNavigateTab && onNavigateTab('tech-stack')}
          />
        ))}
      </div>

      {/* Percentages and LOC details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
        {techItems.map((item) => (
          <div
            key={item.name}
            onClick={() => onNavigateTab && onNavigateTab('tech-stack')}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-bold text-white text-[11px]">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-emerald-400 text-xs">{item.percentage}%</span>
              <span className="text-[10px] text-slate-400 block font-mono leading-none">{item.loc} LOC</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
