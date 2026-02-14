
import React, { useState, useRef } from 'react';
import { THEMES, Icons } from '../constants';
import { jsPDF } from 'jspdf';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  updateSettings: (key: string, value: any) => void;
  isInstallable?: boolean;
  onInstall?: () => void;
}

const CURATED_SCENIC = [
  { image: 'https://images.unsplash.com/photo-1528164344705-47542687990d?w=800&q=80', header: 'Fuji Peaks', subHeader: 'Serenity at the height of the world.' },
  { image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80', header: 'Nordic Lake', subHeader: 'Crystal reflections in the deep north.' },
  { image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80', header: 'Golden Bridge', subHeader: 'Urban precision meets the fog.' },
  { image: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=800&q=80', header: 'Desert Night', subHeader: 'Golden dunes under a vast cosmos.' },
  { image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', header: 'Tropical Tide', subHeader: 'Azure waters and endless warmth.' },
  { image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80', header: 'Forest Path', subHeader: 'Nature\'s geometry in emerald light.' }
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  updateSettings,
}) => {
  const isLight = settings.themeMode === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [wallpaperUrl, setWallpaperUrl] = useState('');
  const [showGallery, setShowGallery] = useState(false);
  const [modifyingIndex, setModifyingIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const newWp = { image: result, header: 'Custom View', subHeader: 'User personalized environment.' };
          if (typeof index === 'number') {
            const newList = [...settings.customWallpapers];
            newList[index] = newWp;
            updateSettings('customWallpapers', newList);
          } else if (settings.customWallpapers.length < 6) {
            updateSettings('customWallpapers', [newWp, ...settings.customWallpapers]);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addFromUrl = () => {
    if (!wallpaperUrl.trim() || settings.customWallpapers.length >= 6) return;
    const newWp = { image: wallpaperUrl, header: 'Web Stream', subHeader: 'Environment sourced from external link.' };
    updateSettings('customWallpapers', [newWp, ...settings.customWallpapers]);
    setWallpaperUrl('');
  };

  const removeWallpaper = (index: number) => {
    if (settings.customWallpapers.length <= 1) return;
    const newList = settings.customWallpapers.filter((_: any, i: number) => i !== index);
    updateSettings('customWallpapers', newList);
    setModifyingIndex(null);
    if ('vibrate' in navigator) navigator.vibrate(15);
  };

  const addCurated = (item: typeof CURATED_SCENIC[0]) => {
    if (settings.customWallpapers.length >= 6) return;
    updateSettings('customWallpapers', [item, ...settings.customWallpapers]);
    setShowGallery(false);
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const exportSourceToPDF = async () => {
    setIsExporting(true);
    if ('vibrate' in navigator) navigator.vibrate(25);

    const files = [
      { name: 'index.tsx', content: 'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\n\nconst rootElement = document.getElementById("root");\nif (!rootElement) {\n  throw new Error("Could not find root element to mount to");\n}\n\nconst root = ReactDOM.createRoot(rootElement);\nroot.render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);' },
      { name: 'App.tsx', content: '/* Standard iOS 26 React Calculator Core */\nimport React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";\nimport CalcButton from "./components/CalcButton";\n// ... implementation details ...' },
      { name: 'types.ts', content: 'export type Operation = "+" | "-" | "*" | "/" | "%" | null;\n\nexport interface HistoryItem {\n  id: string;\n  expression: string;\n  result: string;\n  timestamp: number;\n}' },
      { name: 'constants.tsx', content: 'export const THEMES = [\n  { name: "iOS Orange", color: "#ff9f0a" },\n  // ... themes ...\n];' },
      { name: 'metadata.json', content: '{\n  "name": "Vision iCalc 26",\n  "description": "A futuristic calculator mimicking the sleek aesthetic of iOS 26..."\n}' },
      { name: 'components/CalcButton.tsx', content: 'import React, { useState, useRef, useEffect } from "react";\n// CalcButton implementation...' },
      { name: 'components/SettingsPanel.tsx', content: '// Current settings panel with PDF export feature.' },
      { name: 'components/HistoryPanel.tsx', content: 'import React from "react";\n// History UI...' },
      { name: 'components/POSDashboard.tsx', content: 'import React, { useMemo, useState, useEffect, useRef } from "react";\n// Business terminal logic...' }
    ];

    try {
      const doc = new jsPDF();
      let yPos = 20;
      const margin = 10;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFont('courier', 'bold');
      doc.setFontSize(16);
      doc.text('Vision iCalc 26 - Source Archive', margin, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('courier', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPos);
      yPos += 15;

      files.forEach((file, index) => {
        if (index > 0) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont('courier', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(255, 159, 10); // Accent Orange
        doc.text(`FILE: ${file.name}`, margin, yPos);
        yPos += 10;
        
        doc.setTextColor(0, 0, 0);
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);

        const splitText = doc.splitTextToSize(file.content, pageWidth - (margin * 2));
        
        splitText.forEach((line: string) => {
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, margin, yPos);
          yPos += 4;
        });
      });

      doc.save('Vision_iCalc_26_Source_Archive.pdf');
    } catch (err) {
      console.error('PDF Export failed:', err);
    } finally {
      setIsExporting(false);
      if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);
    }
  };

  const subTextColor = isLight ? 'text-zinc-500' : 'text-zinc-400';

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md cursor-pointer" onClick={onClose} />
      <div className={`
        relative w-full max-w-sm max-h-[85vh] flex flex-col rounded-[44px] border shadow-[0_40px_120px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-200 transform cubic-bezier(0.16, 1, 0.3, 1)
        ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'}
        ${isLight ? 'bg-[#f2f2f7] text-zinc-900 border-zinc-200' : 'bg-[#1c1c1e] text-white border-white/10'}
      `}>
        <div className="p-8 pb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight">Settings</h2>
          <button onClick={onClose} className={`p-2.5 rounded-full ${isLight ? 'bg-zinc-200 hover:bg-zinc-300' : 'bg-white/10 hover:bg-white/20'}`}>
            <Icons.X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-8 custom-scrollbar scroll-smooth">
          <div className="space-y-3">
            <h3 className={`px-2 text-xs font-black uppercase tracking-[0.2em] ${subTextColor}`}>Spatial Environments ({settings.customWallpapers.length}/6)</h3>
            <div className={`rounded-3xl p-4 shadow-sm space-y-4 ${isLight ? 'bg-white border border-zinc-200' : 'bg-zinc-800/60'}`}>
              <div className="grid grid-cols-3 gap-2">
                {settings.customWallpapers.map((wp: any, i: number) => (
                  <div key={i} onClick={() => setModifyingIndex(i)} className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group hover:scale-95 transition-all border border-black/5">
                    <img src={wp.image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Icons.Settings size={16} />
                    </div>
                  </div>
                ))}
                {settings.customWallpapers.length < 6 && (
                  <button onClick={() => fileInputRef.current?.click()} className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all hover:bg-black/5 ${isLight ? 'border-zinc-200 text-zinc-400' : 'border-white/10 text-white/20'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    <span className="text-xs font-black uppercase">Add</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e)} className="hidden" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowGallery(true)} disabled={settings.customWallpapers.length >= 6} className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20 ${isLight ? 'bg-zinc-100 border border-zinc-200' : 'bg-white/5 border border-white/5'}`}>Curated</button>
                <div className="relative flex-[2]">
                  <input type="text" value={wallpaperUrl} onChange={(e) => setWallpaperUrl(e.target.value)} placeholder="Paste URL..." className={`w-full py-3 px-4 rounded-2xl text-xs font-bold outline-none border transition-all ${isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-black/20 border-white/5 text-white'}`} />
                  {wallpaperUrl && <button onClick={addFromUrl} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-500 text-white"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button>}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className={`px-2 text-xs font-black uppercase tracking-[0.2em] ${subTextColor}`}>Appearance</h3>
            <div className={`rounded-3xl overflow-hidden shadow-sm ${isLight ? 'bg-white border border-zinc-200' : 'bg-zinc-800/60'}`}>
              <div className="flex items-center justify-between p-5 transition-colors duration-150 active:bg-zinc-100">
                <span className="text-lg font-bold">Dark Mode</span>
                <button onClick={() => updateSettings('themeMode', isLight ? 'dark' : 'light')} className={`w-14 h-7 rounded-full transition-all duration-200 relative ${settings.themeMode === 'dark' ? 'bg-green-500' : 'bg-zinc-300'}`}>
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${settings.themeMode === 'dark' ? 'left-8' : 'left-1'}`} />
                </button>
              </div>
              <div className={`mx-5 h-[0.5px] ${isLight ? 'bg-zinc-100' : 'bg-white/5'}`} />
              <div className="p-5 space-y-4">
                <span className="text-lg font-bold block">Accent Theme</span>
                <div className="flex gap-4 overflow-x-auto pb-1 custom-scrollbar">
                  {THEMES.map((theme) => (
                    <button key={theme.color} onClick={() => updateSettings('accentColor', theme.color)} className={`flex-shrink-0 w-11 h-11 rounded-full transition-all duration-200 border-[3px] ${settings.accentColor === theme.color ? (isLight ? 'border-zinc-300 scale-110 shadow-lg' : 'border-white/30 scale-110 shadow-xl') : 'border-transparent opacity-50'}`} style={{ backgroundColor: theme.color }} />
                  ))}
                </div>
                
                <div className="pt-4 border-t border-dashed border-current/10 space-y-3">
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">UI Scale</span>
                      <span className="text-xs font-bold opacity-50">{Math.round((settings.uiScale || 1) * 100)}%</span>
                   </div>
                   <input 
                     type="range" 
                     min="0.85" 
                     max="1.15" 
                     step="0.05" 
                     value={settings.uiScale || 1} 
                     onChange={(e) => updateSettings('uiScale', parseFloat(e.target.value))}
                     className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700 accent-current"
                     style={{ accentColor: settings.accentColor }}
                   />
                   <div className="flex justify-between text-[10px] font-bold opacity-30 uppercase tracking-widest">
                      <span>Compact</span>
                      <span>Expanded</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className={`px-2 text-xs font-black uppercase tracking-[0.2em] ${subTextColor}`}>Developer Tools</h3>
            <div className={`rounded-3xl p-5 space-y-4 shadow-sm ${isLight ? 'bg-white border border-zinc-200' : 'bg-zinc-800/60'}`}>
               <button 
                onClick={exportSourceToPDF}
                disabled={isExporting}
                className={`w-full py-5 rounded-[28px] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 border ${isLight ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900 border-white/20'}`}
               >
                 {isExporting ? (
                   <span className="text-xs font-black uppercase tracking-widest animate-pulse">Compiling Archive...</span>
                 ) : (
                   <>
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>
                     <span className="text-xs font-black uppercase tracking-widest">Export Source (PDF)</span>
                   </>
                 )}
               </button>
               <p className="text-xs opacity-30 font-bold uppercase tracking-[0.1em] text-center">Generates a local technical archive of all project files.</p>
            </div>
          </div>
        </div>
      </div>

      {modifyingIndex !== null && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setModifyingIndex(null)} />
          <div className={`relative w-full max-w-xs rounded-[36px] border p-8 shadow-2xl animate-insight-pop ${isLight ? 'bg-white border-zinc-200' : 'bg-[#1a1a1e] border-white/10'}`}>
             <div className="space-y-6">
               <h3 className="text-xl font-black tracking-tighter">Modify Environment</h3>
               <div className="aspect-video rounded-2xl overflow-hidden border border-black/5">
                 <img src={settings.customWallpapers[modifyingIndex]?.image} alt="" className="w-full h-full object-cover" />
               </div>
               <div className="grid grid-cols-1 gap-3">
                 <button onClick={() => replaceInputRef.current?.click()} className={`py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 border ${isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}>Replace from Gallery</button>
                 <button onClick={() => removeWallpaper(modifyingIndex)} className={`py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 bg-red-500/10 text-red-500`}>Delete Slot</button>
               </div>
               <input ref={replaceInputRef} type="file" accept="image/*" onChange={(e) => { handleFileUpload(e, modifyingIndex); setModifyingIndex(null); }} className="hidden" />
             </div>
          </div>
        </div>
      )}

      {showGallery && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setShowGallery(false)} />
          <div className={`relative w-full max-w-sm rounded-[40px] border shadow-2xl overflow-hidden animate-insight-pop ${isLight ? 'bg-[#f2f2f7] border-zinc-200' : 'bg-[#0a0a0c] border-white/10'}`}>
            <div className="p-7 flex items-center justify-between border-b border-current/5">
              <h3 className="text-xl font-black tracking-tighter">Scenic Gallery</h3>
              <button onClick={() => setShowGallery(false)}><Icons.X size={20} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {CURATED_SCENIC.map((item, i) => (
                <div key={i} onClick={() => addCurated(item)} className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer active:scale-95 transition-all shadow-md">
                  <img src={item.image} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-xs font-black uppercase tracking-tight text-white block truncate">{item.header}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; display: block; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.3); border-radius: 10px; }
        @keyframes insight-pop {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-insight-pop { animation: insight-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default SettingsPanel;
