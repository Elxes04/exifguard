import React from 'react';
import { Shield, Cpu, UploadCloud, Github } from 'lucide-react';

interface HeaderProps {
  onOpenIngestion: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenIngestion }) => {
  return (
    <header className="border-b border-white/[0.08] bg-[#07080a]/90 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold tracking-tight text-white">
              ExifGuard
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-slate-300 font-mono">
              Client Local
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-subtle-pulse" />
            <span>Local Binary Processing</span>
          </div>

          <button
            onClick={onOpenIngestion}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Contribute Profile</span>
          </button>

          <a
            href="https://github.com/Elxes04/exifguard"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white transition-colors"
            title="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};

