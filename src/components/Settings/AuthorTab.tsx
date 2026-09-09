import React, { useState, useEffect } from 'react';
import { AuthorProfile } from '../../types/index.ts';
import {
  User,
  Feather,
  Mail,
  Globe,
  AtSign,
  MapPin,
  Shield,
  Sparkles,
  Check,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import { DEFAULT_AUTHOR_PROFILE } from '../../storage/db.ts';

interface AuthorTabProps {
  authorProfile?: AuthorProfile;
  onSave: (profile: AuthorProfile) => void;
}

export const AuthorTab: React.FC<AuthorTabProps> = ({
  authorProfile = DEFAULT_AUTHOR_PROFILE,
  onSave,
}) => {
  const [profile, setProfile] = useState<AuthorProfile>(authorProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (authorProfile) {
      setProfile(authorProfile);
    }
  }, [authorProfile]);

  const handleChange = (field: keyof AuthorProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
    setSavedSuccess(false);
  };

  const handleGenerateCopyright = () => {
    const displayName = profile.penName?.trim() || profile.name.trim() || 'Author';
    const year = new Date().getFullYear();
    const notice = `© ${year} ${displayName}. All rights reserved.`;
    handleChange('copyrightNotice', notice);
  };

  const handleResetDefaults = () => {
    setProfile(DEFAULT_AUTHOR_PROFILE);
    onSave(DEFAULT_AUTHOR_PROFILE);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSave(profile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const displayName = profile.penName?.trim() || profile.name.trim() || 'Author';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AU';

  return (
    <div className="space-y-4 text-stone-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-100 flex items-center gap-1.5">
            <Feather className="w-4 h-4 text-amber-500" />
            <span>Author Profile & Credentials</span>
          </h3>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Manage your personal author information. This metadata is automatically embedded in exported manuscripts, title pages, PDF covers, and displayed across novel selectors.
          </p>
        </div>
        {savedSuccess && (
          <span
            id="author-save-success-badge"
            className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded font-medium animate-fade-in"
          >
            <Check className="w-3 h-3 text-emerald-400" />
            Saved!
          </span>
        )}
      </div>

      {/* Live Author Card Preview */}
      <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-lg space-y-2">
        <div className="flex items-center justify-between text-[10px] text-stone-400 uppercase tracking-wider font-semibold border-b border-stone-800 pb-1.5">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-amber-500" />
            <span>Manuscript Byline & Author Preview</span>
          </span>
          <span className="text-stone-500 font-mono">Live Export Preview</span>
        </div>

        <div className="flex items-start gap-3 pt-1">
          <div className="w-10 h-10 rounded-full bg-amber-950/80 border border-amber-600/60 flex items-center justify-center text-amber-300 font-bold font-serif text-sm shrink-0 shadow-inner">
            {initials}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-stone-100 text-xs truncate">
                {profile.name || 'Author Name'}
              </span>
              {profile.penName && (
                <span className="text-[10px] px-1.5 py-0.2 bg-stone-800 text-amber-300/90 rounded border border-stone-700">
                  Pen Name: {profile.penName}
                </span>
              )}
              {profile.location && (
                <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5 text-stone-500" />
                  {profile.location}
                </span>
              )}
            </div>

            {profile.bio ? (
              <p className="text-[11px] text-stone-300 leading-relaxed line-clamp-2 italic">
                &ldquo;{profile.bio}&rdquo;
              </p>
            ) : (
              <p className="text-[11px] text-stone-500 italic">No biography added yet.</p>
            )}

            <div className="flex items-center gap-3 text-[10px] text-stone-400 pt-0.5 flex-wrap font-mono">
              {profile.website && (
                <span className="flex items-center gap-1 text-amber-400/90 truncate">
                  <Globe className="w-2.5 h-2.5" />
                  {profile.website.replace(/^https?:\/\//, '')}
                </span>
              )}
              {profile.email && (
                <span className="flex items-center gap-1 truncate">
                  <Mail className="w-2.5 h-2.5 text-stone-500" />
                  {profile.email}
                </span>
              )}
              {profile.socialHandle && (
                <span className="flex items-center gap-1 truncate">
                  <AtSign className="w-2.5 h-2.5 text-stone-500" />
                  {profile.socialHandle}
                </span>
              )}
            </div>

            {profile.copyrightNotice && (
              <div className="text-[9px] text-stone-500 pt-0.5 font-mono truncate">
                {profile.copyrightNotice}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Author Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Author Full Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-stone-300 flex items-center gap-1">
              <User className="w-3 h-3 text-amber-500" />
              <span>Full Name / Legal Name</span>
            </label>
            <input
              id="author-name-input"
              type="text"
              value={profile.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g. Eleanor Sterling"
              className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-100 text-xs focus:border-amber-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Pen Name / Pseudonym */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-stone-300 flex items-center gap-1">
              <Feather className="w-3 h-3 text-amber-500" />
              <span>Pen Name / Pseudonym (Optional)</span>
            </label>
            <input
              id="author-pen-name-input"
              type="text"
              value={profile.penName || ''}
              onChange={e => handleChange('penName', e.target.value)}
              placeholder="e.g. E. A. Sterling"
              className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-100 text-xs focus:border-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-stone-300 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-amber-500" />
            <span>Author Biography / About the Author</span>
          </label>
          <textarea
            id="author-bio-input"
            rows={3}
            value={profile.bio || ''}
            onChange={e => handleChange('bio', e.target.value)}
            placeholder="Write a short author blurb or biography to be included at the end of novels and title pages..."
            className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-stone-100 text-xs focus:border-amber-500 focus:outline-hidden leading-relaxed resize-none"
          />
          <div className="text-[10px] text-stone-500 text-right">
            {(profile.bio || '').length} characters
          </div>
        </div>

        {/* Contact / Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Website */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-stone-300 flex items-center gap-1">
              <Globe className="w-3 h-3 text-stone-400" />
              <span>Website / Portfolio</span>
            </label>
            <input
              id="author-website-input"
              type="url"
              value={profile.website || ''}
              onChange={e => handleChange('website', e.target.value)}
              placeholder="https://author.example.com"
              className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-100 text-xs focus:border-amber-500 focus:outline-hidden font-mono"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-stone-300 flex items-center gap-1">
              <Mail className="w-3 h-3 text-stone-400" />
              <span>Public Contact Email</span>
            </label>
            <input
              id="author-email-input"
              type="email"
              value={profile.email || ''}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="author@example.com"
              className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-100 text-xs focus:border-amber-500 focus:outline-hidden font-mono"
            />
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-stone-300 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-stone-400" />
              <span>Location / City</span>
            </label>
            <input
              id="author-location-input"
              type="text"
              value={profile.location || ''}
              onChange={e => handleChange('location', e.target.value)}
              placeholder="e.g. Edinburgh, Scotland"
              className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-100 text-xs focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Social Handle */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-stone-300 flex items-center gap-1">
              <AtSign className="w-3 h-3 text-stone-400" />
              <span>Social Media Handle</span>
            </label>
            <input
              id="author-social-input"
              type="text"
              value={profile.socialHandle || ''}
              onChange={e => handleChange('socialHandle', e.target.value)}
              placeholder="e.g. @authorname"
              className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-100 text-xs focus:border-amber-500 focus:outline-hidden font-mono"
            />
          </div>
        </div>

        {/* Copyright Notice with Auto-fill */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-stone-300 flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-500" />
              <span>Default Copyright Notice</span>
            </label>
            <button
              type="button"
              id="author-generate-copyright-btn"
              onClick={handleGenerateCopyright}
              className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Sparkles className="w-2.5 h-2.5" />
              Auto-generate notice
            </button>
          </div>
          <input
            id="author-copyright-input"
            type="text"
            value={profile.copyrightNotice || ''}
            onChange={e => handleChange('copyrightNotice', e.target.value)}
            placeholder="© 2026 Author Name. All rights reserved."
            className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-100 text-xs focus:border-amber-500 focus:outline-hidden font-mono"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-800">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-[11px] text-stone-500 hover:text-stone-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Default</span>
          </button>

          <button
            type="submit"
            id="author-save-profile-btn"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold rounded text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Author Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
};
