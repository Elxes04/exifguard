import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, Trash2, ShieldCheck } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (file: File, buffer: Uint8Array, dimensions: { width: number; height: number }) => void;
  onClear: () => void;
  selectedFile: File | null;
  imageDimensions: { width: number; height: number } | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  onClear,
  selectedFile,
  imageDimensions
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = new Uint8Array(e.target?.result as ArrayBuffer);
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        onImageSelected(file, buffer, { width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="glass-panel-sleek p-5 relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold tracking-wide text-slate-200 uppercase">
            Target Image
          </h3>
        </div>
        {selectedFile && (
          <button
            onClick={onClear}
            className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {!selectedFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-white/10 hover:border-white/25 bg-white/[0.02] hover:bg-white/[0.04]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto mb-3 text-emerald-400">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-xs font-medium text-slate-200 mb-1">
            Drop JPEG / PNG / WebP photo or <span className="text-emerald-400 font-semibold underline decoration-emerald-500/40">browse file</span>
          </p>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-slate-400 mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Parsed locally in client memory</span>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/10 flex items-center space-x-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-black border border-white/10 flex-shrink-0">
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Source preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5 mb-1">
              <span className="text-xs font-semibold text-slate-100 truncate">
                {selectedFile.name}
              </span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-slate-400 font-mono">
              <div>Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</div>
              <div>Format: {selectedFile.type.split('/')[1]?.toUpperCase()}</div>
              {imageDimensions && (
                <div className="col-span-2 text-emerald-400 font-medium">
                  {imageDimensions.width} × {imageDimensions.height} px ({(imageDimensions.width / imageDimensions.height).toFixed(2)}:1)
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
