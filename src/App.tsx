import React, { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Header } from './components/Header';
import { CropMatcherTab } from './components/CropMatcherTab';
import { PixelScalerTab } from './components/PixelScalerTab';
import { ResolutionLibraryTab } from './components/ResolutionLibraryTab';
import { ImageDropzoneModal } from './components/ImageDropzoneModal';
import { CopyToast } from './components/CopyToast';
import { Cpu, ShieldCheck, Film, Sparkles } from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';

export default function App() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'crop' | 'scale' | 'library'>('crop');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [injectedDimensions, setInjectedDimensions] = useState<{ width: number; height: number } | null>(null);

  // Trigger copy toast
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setToastMessage(t.toast.copiedToClipboard.replace('{label}', label));
      setTimeout(() => setToastMessage(null), 2500);
    }).catch(() => {
      // Fallback
      setToastMessage(t.toast.copyFallback.replace('{label}', label));
      setTimeout(() => setToastMessage(null), 2500);
    });
  };

  const handleApplyDimensions = (w: number, h: number, mode: 'crop' | 'scale') => {
    setInjectedDimensions({ width: w, height: h });
    setActiveTab(mode);
    setToastMessage(
      t.toast.appliedDimensions.replace('{w}', String(w)).replace('{h}', String(h))
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar following Top Bar Contract */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenInspector={() => setIsInspectorOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'crop' && (
          <CropMatcherTab
            onCopyText={handleCopyText}
            injectedDimensions={injectedDimensions}
          />
        )}

        {activeTab === 'scale' && (
          <PixelScalerTab
            onCopyText={handleCopyText}
            injectedDimensions={injectedDimensions}
          />
        )}

        {activeTab === 'library' && (
          <ResolutionLibraryTab onCopyText={handleCopyText} />
        )}

        {/* Technical Reference Footer Strip */}
        <section className="mt-16 pt-8 border-t border-slate-800/80">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-slate-400">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-200 mb-2">
                <Film className="w-4 h-4 text-sky-400" />
                <span>{t.footer.videoCodecTitle}</span>
              </div>
              <p className="leading-relaxed">
                {t.footer.videoCodecDesc}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 font-bold text-slate-200 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>{t.footer.aiLatentTitle}</span>
              </div>
              <p className="leading-relaxed">
                {t.footer.aiLatentDesc}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 font-bold text-slate-200 mb-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>{t.footer.gpuTextureTitle}</span>
              </div>
              <p className="leading-relaxed">
                {t.footer.gpuTextureDesc}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 font-bold text-slate-200 mb-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>{t.footer.distortionTitle}</span>
              </div>
              <p className="leading-relaxed">
                {t.footer.distortionDesc}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Media Inspection Modal */}
      <ImageDropzoneModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        onApplyDimensions={handleApplyDimensions}
      />

      {/* Floating Copy Feedback Toast */}
      <CopyToast message={toastMessage} />
      
      {/* Vercel Analytics */}
      <Analytics />
    </div>
  );
}
