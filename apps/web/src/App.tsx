import React, { useState, useMemo } from 'react';
import { HardwareProfile, SEED_PROFILES } from '@exifguard/seed-profiles';
import { auditPIIRisks, validateCoherency, CoherencyCheckResult } from '@exifguard/coherency-engine';
import { readExifTags, injectEXIFSegment, stripJPEGMetadata } from '@exifguard/wasm-exif';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ProfileSelector } from './components/ProfileSelector';
import { ExifInspector } from './components/ExifInspector';
import { CoherencyBadge } from './components/CoherencyBadge';
import { IngestionModal } from './components/IngestionModal';
import { Shield, Download, Sparkles, Image as ImageIcon, Trash2, Cpu, CheckCircle2 } from 'lucide-react';
import { fetchPublicProfiles, submitPublicProfile } from './services/api';

export const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageBuffer, setImageBuffer] = useState<Uint8Array | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Operation Mode: 'spoofer' (Profile Cloner) | 'stripper' (Complete Metadata Removal)
  const [operationMode, setOperationMode] = useState<'spoofer' | 'stripper'>('spoofer');

  const [profilesList, setProfilesList] = useState<HardwareProfile[]>(SEED_PROFILES);
  const [selectedProfile, setSelectedProfile] = useState<HardwareProfile>(SEED_PROFILES[0]);
  const [userOverrides, setUserOverrides] = useState<Record<string, any>>({});
  const [isIngestionOpen, setIsIngestionOpen] = useState(false);

  // Fetch Public Database Profiles on Mount
  React.useEffect(() => {
    fetchPublicProfiles().then(profiles => {
      setProfilesList(profiles);
      if (profiles.length > 0) {
        setSelectedProfile(profiles[0]);
      }
    });
  }, []);

  // Parse original EXIF tags
  const originalTags = useMemo(() => {
    if (!imageBuffer) return {};
    return readExifTags(imageBuffer);
  }, [imageBuffer]);

  // Audit Privacy & PII
  const piiReport = useMemo(() => {
    return auditPIIRisks(originalTags);
  }, [originalTags]);

  // Run Coherency Engine Validation
  const coherencyResult: CoherencyCheckResult = useMemo(() => {
    if (!imageDimensions) {
      return {
        isCohesive: true,
        score: 100,
        warnings: [],
        coercedTags: selectedProfile.exif_tags
      };
    }
    return validateCoherency(imageDimensions, selectedProfile, userOverrides);
  }, [imageDimensions, selectedProfile, userOverrides]);

  const handleImageSelected = (file: File, buffer: Uint8Array, dimensions: { width: number; height: number }) => {
    setSelectedFile(file);
    setImageBuffer(buffer);
    setImageDimensions(dimensions);
    setUserOverrides({});
  };

  const handleClear = () => {
    setSelectedFile(null);
    setImageBuffer(null);
    setImageDimensions(null);
    setUserOverrides({});
  };

  const handleOverrideChange = (key: string, value: any) => {
    setUserOverrides(prev => ({ ...prev, [key]: value }));
  };

  const handleProfileContributed = async (newProfile: HardwareProfile) => {
    setProfilesList(prev => [newProfile, ...prev]);
    setSelectedProfile(newProfile);
    const updated = await fetchPublicProfiles();
    if (updated && updated.length > 0) {
      setProfilesList(updated);
    }
  };

  // Generate & Download Output Photo (Spoofed OR Completely Stripped)
  const handleDownload = () => {
    if (!imageBuffer || !selectedFile) return;

    try {
      let outputBuffer: Uint8Array;
      let filenamePrefix = '';

      if (operationMode === 'stripper') {
        // Complete 100% Metadata Purge (Strip APP1, APP13, XMP)
        outputBuffer = stripJPEGMetadata(imageBuffer);
        filenamePrefix = 'purged_exif_';
      } else {
        // Profile Cloner / EXIF Spoofing
        outputBuffer = injectEXIFSegment(
          imageBuffer,
          coherencyResult.coercedTags,
          selectedProfile.makernote_structure.header_signature
        );
        filenamePrefix = `anonymized_${selectedProfile.id}_`;
      }

      const blob = new Blob([outputBuffer.buffer as ArrayBuffer], { type: selectedFile.type || 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filenamePrefix}${selectedFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Error processing image metadata.');
    }
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-slate-100 flex flex-col selection:bg-emerald-500/30">
      <Header onOpenIngestion={() => setIsIngestionOpen(true)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Hero Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-emerald-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EXIF Metadata Anonymization Tool</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Image EXIF Management & Anonymization
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl mx-auto">
            Clone target device hardware profiles or completely strip metadata markers. All operations perform in client memory.
          </p>
        </div>

        {/* Operation Mode Selector */}
        <div className="glass-panel-sleek rounded-2xl p-2 max-w-xl mx-auto grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => setOperationMode('spoofer')}
            className={`py-2.5 px-4 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 ${
              operationMode === 'spoofer'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Profile Cloner</span>
          </button>

          <button
            onClick={() => setOperationMode('stripper')}
            className={`py-2.5 px-4 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 ${
              operationMode === 'stripper'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Metadata Stripper</span>
          </button>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Image Target & Device Profile */}
          <div className="lg:col-span-6 space-y-5">
            <ImageUploader
              onImageSelected={handleImageSelected}
              onClear={handleClear}
              selectedFile={selectedFile}
              imageDimensions={imageDimensions}
            />

            {operationMode === 'spoofer' ? (
              <ProfileSelector
                selectedProfile={selectedProfile}
                onSelectProfile={setSelectedProfile}
                profilesList={profilesList}
              />
            ) : (
              <div className="glass-panel-sleek rounded-2xl p-6 text-center space-y-2 border-dashed border-rose-500/30 bg-rose-950/10">
                <Trash2 className="w-8 h-8 text-rose-400 mx-auto" />
                <h4 className="text-xs font-semibold text-rose-200">Metadata Stripper Mode Active</h4>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  All EXIF, XMP, IPTC, and ICC markers will be removed from the image buffer.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Coherency, Inspector & Action */}
          <div className="lg:col-span-6 space-y-5">
            {selectedFile ? (
              <>
                {operationMode === 'spoofer' ? (
                  <CoherencyBadge result={coherencyResult} />
                ) : (
                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-200 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-rose-400" />
                      <span className="font-semibold">Metadata Stripping Active</span>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/40 border border-rose-500/40">
                      0 EXIF Bytes
                    </span>
                  </div>
                )}

                <ExifInspector
                  originalTags={originalTags}
                  spoofedTags={operationMode === 'spoofer' ? coherencyResult.coercedTags : {}}
                  piiReport={piiReport}
                  onOverrideChange={handleOverrideChange}
                />

                <div className="glass-panel-sleek rounded-2xl p-5 text-center space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-white/[0.06] pb-2.5">
                    <span>Selected Mode: <strong className="text-white">{operationMode === 'spoofer' ? 'Profile Cloning' : 'Metadata Purge'}</strong></span>
                    <span>Target EXIF: <strong className={operationMode === 'spoofer' ? 'text-emerald-400' : 'text-rose-400'}>
                      {operationMode === 'spoofer' ? selectedProfile.device.model : '0 EXIF Tags'}
                    </strong></span>
                  </div>

                  <button
                    onClick={handleDownload}
                    className={`w-full py-3 px-5 rounded-xl text-slate-950 font-bold text-xs tracking-wide shadow-lg transition-all flex items-center justify-center space-x-2 ${
                      operationMode === 'spoofer'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 glow-emerald-sm'
                        : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>{operationMode === 'spoofer' ? 'Download Anonymized Image' : 'Download Stripped Photo'}</span>
                  </button>

                  <p className="text-[10px] text-slate-500 flex items-center justify-center space-x-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>Client-side processing • Local binary synthesis</span>
                  </p>
                </div>
              </>
            ) : (
              <div className="glass-panel-sleek rounded-2xl p-10 text-center space-y-2 border-dashed border-white/10">
                <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-xs font-semibold text-slate-300">No Image Loaded</h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Upload an image to inspect EXIF metadata, perform PII audit checks, and process the file locally.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <IngestionModal
        isOpen={isIngestionOpen}
        onClose={() => setIsIngestionOpen(false)}
        onProfileContributed={handleProfileContributed}
      />
    </div>
  );
};

export default App;
