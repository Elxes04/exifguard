import React from 'react';
import { CoherencyCheckResult } from '@exifguard/coherency-engine';
import { CheckCircle2, AlertCircle, Shield } from 'lucide-react';

interface CoherencyBadgeProps {
  result: CoherencyCheckResult;
}

export const CoherencyBadge: React.FC<CoherencyBadgeProps> = ({ result }) => {
  const isHighScore = result.score >= 80;

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isHighScore
        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
        : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {isHighScore ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400" />
          )}
          <span className="font-semibold text-sm">
            Coherency Rating: {result.score}% Match
          </span>
        </div>

        <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-300">
          {isHighScore ? 'Syntactically & Optically Sound' : 'Coercions Applied'}
        </span>
      </div>

      {result.warnings.length > 0 ? (
        <ul className="space-y-1 text-xs font-mono opacity-90 pl-1">
          {result.warnings.map((w, idx) => (
            <li key={idx} className="flex items-start space-x-1.5">
              <span className="text-amber-400 font-bold">•</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-emerald-300/80">
          Target hardware optics, sensor dimensions, and exposure boundaries match perfectly.
        </p>
      )}
    </div>
  );
};
