import React, { useState } from 'react';
import { X, UploadCloud, ShieldCheck, Check, Copy } from 'lucide-react';
import { readExifTags } from '@exifguard/wasm-exif';
import { HardwareProfile } from '@exifguard/seed-profiles';
import { submitPublicProfile } from '../services/api';

interface IngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileContributed?: (profile: HardwareProfile) => void;
}

export const IngestionModal: React.FC<IngestionModalProps> = ({ isOpen, onClose, onProfileContributed }) => {
  const [extractedProfile, setExtractedProfile] = useState<Record<string, any> | null>(null);
  const [builtHardwareProfile, setBuiltHardwareProfile] = useState<HardwareProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSampleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = new Uint8Array(evt.target?.result as ArrayBuffer);
      const rawTags = readExifTags(buffer);

      // Sanitize & Purge PII locally
      const cleanString = (val: any): string => {
        if (typeof val !== 'string') return '';
        return val.replace(/\0/g, '').replace(/\u0000/g, '').trim();
      };

      const rawMake = cleanString(rawTags.Make) || 'Motorola';
      const rawModel = cleanString(rawTags.Model) || 'Moto Device';

      const sanitized: Record<string, any> = {};
      const allowedKeys = ['Make', 'Model', 'Software', 'LensMake', 'LensModel', 'FNumber', 'FocalLength', 'ExifVersion', 'ColorSpace'];

      for (const k of allowedKeys) {
        if (rawTags[k] !== undefined && rawTags[k] !== null) {
          const val = typeof rawTags[k] === 'string' ? cleanString(rawTags[k]) : rawTags[k];
          if (val !== '') {
            sanitized[k] = val;
          }
        }
      }

      const generatedProfile: HardwareProfile = {
        id: `contributed_${Date.now()}`,
        name: `${rawMake} ${rawModel} (Contributed)`,
        category: 'Smartphone',
        device: {
          make: rawMake,
          model: rawModel,
          software: sanitized.Software || 'Android 14',
          sensor_aspect_ratios: ['4:3', '16:9']
        },
        lens: {
          make: sanitized.LensMake || rawMake,
          model: sanitized.LensModel || `${rawModel} Main Camera`,
          min_focal_length: sanitized.FocalLength || 4.5,
          max_focal_length: sanitized.FocalLength || 4.5,
          focal_length_35mm: 26,
          min_aperture: sanitized.FNumber || 1.8,
          max_aperture: sanitized.FNumber || 1.8
        },
        coherency_rules: {
          iso_range: [50, 3200],
          shutter_speed_range: ['1/10000', '1/4'],
          supported_aspect_ratios: ['4:3', '16:9'],
          byte_order: 'II'
        },
        exif_tags: sanitized,
        makernote_structure: {
          format: `${rawMake}_Custom`,
          header_signature: `${rawMake}\u0000`,
          sample_tags: {}
        }
      };

      setBuiltHardwareProfile(generatedProfile);
      setExtractedProfile({
        device_make: rawMake,
        device_model: rawModel,
        sanitized_tags: sanitized,
        ingestion_policy: 'Local Client Parsing (Image bytes remain in local memory)'
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCopy = () => {
    if (extractedProfile) {
      navigator.clipboard.writeText(JSON.stringify(extractedProfile, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (builtHardwareProfile) {
      await submitPublicProfile(builtHardwareProfile);
      if (onProfileContributed) {
        onProfileContributed(builtHardwareProfile);
      }
    }
    setTimeout(() => {
      setSubmitted(false);
      setExtractedProfile(null);
      setBuiltHardwareProfile(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel rounded-2xl max-w-xl w-full p-6 relative border border-slate-700/60 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg bg-slate-800/60"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Contribute Hardware Profile</h3>
            <p className="text-xs text-slate-400">Extract clean hardware profiles without sending image binary data</p>
          </div>
        </div>

        {!extractedProfile ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Privacy & Metadata Sanitization</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Selecting a sample photo parses the metadata schema locally in client memory, stripping location data, serial numbers, timestamps, and binary thumbnails before creating a hardware profile template.
              </p>
            </div>

            <label className="block w-full border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer transition-all bg-slate-900/40 hover:bg-slate-900/80">
              <input
                type="file"
                onChange={handleSampleUpload}
                accept="image/jpeg"
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-slate-200 block mb-1">
                Select Sample Photo (JPEG)
              </span>
              <span className="text-xs text-slate-400">
                Extracted metadata is sanitized automatically before submission
              </span>
            </label>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl text-emerald-300">
              <span>Sanitization Complete: PII & GPS Purged</span>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
              {JSON.stringify(extractedProfile, null, 2)}
            </pre>

            <button
              onClick={handleSubmit}
              disabled={submitted}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm transition-all flex items-center justify-center space-x-2"
            >
              {submitted ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Profile Contributed Anonymously!</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Submit Hardware Profile to Database</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
