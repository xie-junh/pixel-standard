import React from 'react';
import { Crop, Scaling, BookOpen, Upload, Layers, Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface HeaderProps {
  activeTab: 'crop' | 'scale' | 'library';
  onTabChange: (tab: 'crop' | 'scale' | 'library') => void;
  onOpenInspector: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenInspector,
}) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
            {t.common.appName}
          </span>
          <span className="hidden lg:inline-block text-xs text-slate-400 border-l border-slate-700 pl-2.5 whitespace-nowrap">
            {t.common.appSubtitle}
          </span>
        </div>

        {/* Zone 2: Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => onTabChange('crop')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'crop'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            <span>{t.header.cropTab}</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('scale')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'scale'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Scaling className="w-3.5 h-3.5" />
            <span>{t.header.scaleTab}</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('library')}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'library'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t.header.libraryTab}</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Language Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenInspector}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">{t.header.inspectMedia}</span>
            <span className="sm:hidden">{t.inspector.detectedPhysicalRes.slice(0, 4)}</span>
          </button>

          {/* Language Switcher */}
          <div
            className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg p-0.5"
            title={t.header.langTooltip}
          >
            <div className="pl-1.5 pr-1 text-slate-400 hidden xs:flex items-center">
              <Globe className="w-3 h-3" />
            </div>
            <button
              type="button"
              onClick={() => setLanguage('zh')}
              className={`px-2 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                language === 'zh'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              中
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

