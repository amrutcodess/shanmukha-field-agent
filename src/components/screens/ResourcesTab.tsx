import React, { useState } from 'react';
import { useShanpoorna } from '../../context/ShanpoornaContext';
import {
  Video,
  Presentation,
  Printer,
  ExternalLink,
  Download,
  BookOpen,
  Play,
  FileText,
} from 'lucide-react';

export const ResourcesTab: React.FC = () => {
  const { resources, showToast, t } = useShanpoorna();
  const [activeCategory, setActiveCategory] = useState<'Crop' | 'Product'>('Crop');

  const filteredResources = resources.filter((r) => r.category === activeCategory);
  const videos = filteredResources.filter((r) => r.type === 'video');
  const presentations = filteredResources.filter((r) => r.type === 'presentation');
  const printPdfs = filteredResources.filter((r) => r.type === 'pdf');

  const handleVideoClick = (url: string, title: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast(`Opening YouTube: "${title}"`, 'info');
  };

  const handleDownload = (title: string) => {
    showToast(`Downloading: "${title}"`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4] pb-28 text-stone-800">
      {/* Header */}
      <header className="bg-white px-4 pt-5 pb-3 border-b border-stone-200 sticky top-0 z-20">
        <h1 className="text-xl font-bold text-stone-900 tracking-tight">
          {t.ourResources}
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">{t.resourcesSub}</p>

        {/* Category Pill Toggle */}
        <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl mt-3">
          <button
            type="button"
            onClick={() => setActiveCategory('Crop')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              activeCategory === 'Crop'
                ? 'bg-[#0B7A3B] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t.cropResources}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('Product')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              activeCategory === 'Product'
                ? 'bg-[#0B7A3B] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t.productResources}
          </button>
        </div>
      </header>

      <div className="p-4 space-y-5">
        {/* 1. Video Lessons */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#0B7A3B]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                {t.videoLessons}
              </h2>
            </div>
            <span className="text-[10px] text-stone-400 font-semibold">
              {videos.length} videos
            </span>
          </div>

          <div className="space-y-2.5">
            {videos.map((vid) => (
              <div
                key={vid.id}
                onClick={() => handleVideoClick(vid.linkUrl, vid.title)}
                className="bg-white rounded-2xl p-3 shadow-sm border border-stone-200/80 hover:border-emerald-300 transition cursor-pointer flex items-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0B7A3B] shrink-0 group-hover:scale-105 transition-transform">
                  <Play className="w-5 h-5 fill-current" />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold text-[#0B7A3B] uppercase tracking-wider block">
                    {vid.tag}
                  </span>
                  <h3 className="text-xs font-bold text-stone-900 group-hover:text-[#0B7A3B] transition-colors truncate">
                    {vid.title}
                  </h3>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Duration: {vid.sizeOrDuration}
                  </span>
                </div>

                <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-[#0B7A3B] transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* 2. Presentations */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Presentation className="w-4 h-4 text-[#0B7A3B]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                {t.presentations}
              </h2>
            </div>
            <span className="text-[10px] text-stone-400 font-semibold">
              {presentations.length} presentations
            </span>
          </div>

          <div className="space-y-2.5">
            {presentations.map((ppt) => (
              <div
                key={ppt.id}
                onClick={() => handleDownload(ppt.title)}
                className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 hover:border-emerald-300 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E8731A] shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-stone-900 group-hover:text-[#0B7A3B] transition-colors truncate">
                      {ppt.title}
                    </h3>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {ppt.tag} · {ppt.sizeOrDuration}
                    </p>
                  </div>
                </div>

                <Download className="w-4 h-4 text-stone-400 group-hover:text-[#0B7A3B] transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* 3. Print Materials */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#0B7A3B]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                {t.printMaterials}
              </h2>
            </div>
            <span className="text-[10px] text-stone-400 font-semibold">
              {printPdfs.length} printable PDFs
            </span>
          </div>

          <div className="space-y-2.5">
            {printPdfs.map((pdf) => (
              <div
                key={pdf.id}
                onClick={() => handleDownload(pdf.title)}
                className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 hover:border-emerald-300 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0B7A3B] shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-stone-900 group-hover:text-[#0B7A3B] transition-colors truncate">
                      {pdf.title}
                    </h3>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {pdf.tag} · {pdf.sizeOrDuration}
                    </p>
                  </div>
                </div>

                <Download className="w-4 h-4 text-stone-400 group-hover:text-[#0B7A3B] transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
