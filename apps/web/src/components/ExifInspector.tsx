import React, { useState } from 'react';
import { PIIRiskReport } from '@exifguard/coherency-engine';
import { ShieldCheck, ShieldAlert, Sliders, FileText, AlertTriangle, Eye } from 'lucide-react';

interface ExifInspectorProps {
  originalTags: Record<string, any>;
  spoofedTags: Record<string, any>;
  piiReport: PIIRiskReport;
  onOverrideChange: (key: string, value: any) => void;
}

export const ExifInspector: React.FC<ExifInspectorProps> = ({
  originalTags,
  spoofedTags,
  piiReport,
  onOverrideChange
}) => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'tuner' | 'privacy'>('comparison');

  // Combine all keys from both original photo and target spoofed profile
  const allKeys = Array.from(
    new Set([...Object.keys(originalTags), ...Object.keys(spoofedTags)])
  ).filter(key => key !== 'GPSInfo');

  return (
    <div className="glass-panel-sleek rounded-2xl p-5">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 mb-4">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-all ${
              activeTab === 'comparison'
                ? 'bg-white/[0.08] text-white border border-white/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Comparison ({Object.keys(originalTags).length} Source Tags)</span>
          </button>

          <button
            onClick={() => setActiveTab('tuner')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-all ${
              activeTab === 'tuner'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tag Tuner</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-all ${
              activeTab === 'privacy'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Audit</span>
          </button>
        </div>

        {/* Risk Badge */}
        <div className={`px-2 py-0.5 rounded-full text-[11px] font-mono flex items-center space-x-1 ${
          piiReport.riskScore > 30
            ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
        }`}>
          {piiReport.riskScore > 30 ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
          <span>Risk: {piiReport.riskScore}%</span>
        </div>
      </div>

      {/* Tab 1: Comparison */}
      {activeTab === 'comparison' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-[11px] font-semibold text-slate-400 pb-1.5 border-b border-white/[0.04]">
            <div>Original Source ({Object.keys(originalTags).length} EXIF Tags)</div>
            <div className="text-emerald-400">Target Output State</div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
            {allKeys.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-xs italic">No EXIF tags found in source file</div>
            ) : (
              allKeys.map(key => {
                const origVal = originalTags[key];
                const spoofVal = spoofedTags[key];

                const isOrigPresent = origVal !== undefined && origVal !== null;
                const isSpoofPresent = spoofVal !== undefined && spoofVal !== null;

                return (
                  <div key={key} className="grid grid-cols-2 gap-3 py-1 border-b border-white/[0.03] hover:bg-white/[0.02] rounded px-1 transition-colors">
                    <div className="text-slate-400 truncate">
                      <span className="text-slate-500 mr-1">{key}:</span>
                      <span className={isOrigPresent ? 'text-slate-200' : 'text-slate-600 italic'}>
                        {isOrigPresent ? String(origVal) : '<NONE>'}
                      </span>
                    </div>

                    <div className="truncate font-medium">
                      <span className="text-slate-500 mr-1">{key}:</span>
                      {isSpoofPresent ? (
                        <span className="text-emerald-400">{String(spoofVal)}</span>
                      ) : (
                        <span className="text-rose-400/80 italic font-sans text-[10px]">
                          &lt;PURGED / STRIPPED&gt;
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Tag Tuner */}
      {activeTab === 'tuner' && (
        <div className="space-y-3 text-xs">
          <p className="text-slate-400 text-[11px]">Override specific EXIF values before profile injection:</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1 text-[11px]">Aperture (f-number)</label>
              <input
                type="number"
                step="0.1"
                value={spoofedTags.FNumber || 2.8}
                onChange={(e) => onOverrideChange('FNumber', parseFloat(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1 text-[11px]">Focal Length (mm)</label>
              <input
                type="number"
                step="1"
                value={spoofedTags.FocalLength || 50}
                onChange={(e) => onOverrideChange('FocalLength', parseFloat(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1 text-[11px]">Software Firmware Build</label>
              <input
                type="text"
                value={spoofedTags.Software || ''}
                onChange={(e) => onOverrideChange('Software', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Privacy Audit */}
      {activeTab === 'privacy' && (
        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-200 text-xs flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Sanitization Audit Checklist</span>
              </h4>
              <span className="font-mono text-[10px] text-slate-400">
                {piiReport.detectedPIITags.length} PII Tags Detected
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
              <div className="flex items-center space-x-1.5 p-1.5 rounded bg-black/30 border border-white/[0.04]">
                <span className={`w-2 h-2 rounded-full ${piiReport.hasGPS ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-emerald-400'}`} />
                <span>GPS Data: <strong className={piiReport.hasGPS ? 'text-rose-400' : 'text-emerald-400'}>{piiReport.hasGPS ? 'Detected' : 'Clean'}</strong></span>
              </div>

              <div className="flex items-center space-x-1.5 p-1.5 rounded bg-black/30 border border-white/[0.04]">
                <span className={`w-2 h-2 rounded-full ${piiReport.hasSerialNumber ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-emerald-400'}`} />
                <span>Serials: <strong className={piiReport.hasSerialNumber ? 'text-rose-400' : 'text-emerald-400'}>{piiReport.hasSerialNumber ? 'Detected' : 'Clean'}</strong></span>
              </div>

              <div className="flex items-center space-x-1.5 p-1.5 rounded bg-black/30 border border-white/[0.04]">
                <span className={`w-2 h-2 rounded-full ${piiReport.hasTimestamps ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-emerald-400'}`} />
                <span>Timestamps: <strong className={piiReport.hasTimestamps ? 'text-amber-300' : 'text-emerald-400'}>{piiReport.hasTimestamps ? 'Exposed' : 'Clean'}</strong></span>
              </div>

              <div className="flex items-center space-x-1.5 p-1.5 rounded bg-black/30 border border-white/[0.04]">
                <span className={`w-2 h-2 rounded-full ${piiReport.hasOwnerName ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-emerald-400'}`} />
                <span>Owner/Artist: <strong className={piiReport.hasOwnerName ? 'text-rose-400' : 'text-emerald-400'}>{piiReport.hasOwnerName ? 'Detected' : 'Clean'}</strong></span>
              </div>
            </div>

            {piiReport.detectedPIITags.length > 0 && (
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1.5 flex items-center space-x-1">
                  <Eye className="w-3 h-3 text-amber-400" />
                  <span>Exposed Fingerprint Attributes:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {piiReport.detectedPIITags.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-[10px]">
                      {t}: {String(originalTags[t] ?? '')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

