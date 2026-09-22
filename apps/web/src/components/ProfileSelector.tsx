import React, { useState, useMemo } from 'react';
import { HardwareProfile, SEED_PROFILES } from '@exifguard/seed-profiles';
import { searchProfiles } from '@exifguard/database-schema';
import { Smartphone, Camera, Check, SlidersHorizontal, Search, X, Layers } from 'lucide-react';

interface ProfileSelectorProps {
  selectedProfile: HardwareProfile;
  onSelectProfile: (profile: HardwareProfile) => void;
  profilesList?: HardwareProfile[];
}

const CATEGORIES = ['All', 'Smartphone', 'Mirrorless', 'DSLR', 'Contributed'];

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  selectedProfile,
  onSelectProfile,
  profilesList = SEED_PROFILES
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProfiles = useMemo(() => {
    return searchProfiles(profilesList, searchQuery, activeCategory);
  }, [profilesList, searchQuery, activeCategory]);

  return (
    <div className="glass-panel-sleek rounded-2xl p-5 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold tracking-wide text-slate-200 uppercase">
            Target Hardware Profile Database
          </h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-slate-400 font-mono">
          {filteredProfiles.length} of {profilesList.length} Profiles
        </span>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by make, model, lens (e.g., iPhone, Sony, 50mm)..."
          className="w-full pl-8 pr-8 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px]">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap flex items-center space-x-1 ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/[0.04]'
              }`}
            >
              {cat === 'Contributed' && <Layers className="w-3 h-3 text-indigo-400" />}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Profile Cards Grid */}
      {filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-0.5">
          {filteredProfiles.map((profile) => {
            const isSelected = selectedProfile.id === profile.id;
            const isPhone = profile.category === 'Smartphone';

            return (
              <div
                key={profile.id}
                onClick={() => onSelectProfile(profile)}
                className={`glass-card-sleek rounded-xl p-3.5 cursor-pointer relative ${
                  isSelected ? 'glass-card-active' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded-md ${
                      isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.04] text-slate-400'
                    }`}>
                      {isPhone ? <Smartphone className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-100 leading-tight">
                        {profile.device.model}
                      </h4>
                      <span className="text-[10px] text-slate-400">{profile.device.make}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-emerald-400 text-black flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="mt-2 text-[11px] text-slate-300 font-mono space-y-0.5 pt-1.5 border-t border-white/[0.04]">
                  <div className="truncate text-slate-400">
                    {profile.lens.model}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>f/{profile.lens.min_aperture}</span>
                    <span className="text-indigo-300 font-semibold">{profile.makernote_structure.format}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-xl space-y-1">
          <p className="font-semibold text-slate-400">No hardware profiles matched "{searchQuery}"</p>
          <p className="text-[11px]">Try searching for "iPhone", "Sony", "Pixel", or "Canon".</p>
        </div>
      )}
    </div>
  );
};
