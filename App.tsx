
import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import CalcButton from './components/CalcButton';
import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';
import BlurredBackground from './components/BlurredBackground';
import POSDashboard from './components/POSDashboard';
import WallpaperOverlay from './components/WallpaperOverlay';
import { Icons, THEMES, WALLPAPER_SLIDES } from './constants';
import { HistoryItem } from './types';

const App: React.FC = () => {
  const [expression, setExpression] = useState('0');
  const [isResultMode, setIsResultMode] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  
  const displayContentRef = useRef<HTMLDivElement>(null);
  const [displayFontSize, setDisplayFontSize] = useState(116.16); 

  const [settings, setSettings] = useState({
    accentColor: THEMES[0].color,
    glassBlur: 24,
    hapticFeedback: true,
    hapticIntensity: 'medium' as 'soft' | 'medium' | 'intense',
    themeMode: 'light' as 'light' | 'dark',
    currency: 'GHS' as 'GHS' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'NGN',
    customWallpapers: WALLPAPER_SLIDES
  });

  useLayoutEffect(() => {
    if (!displayContentRef.current) return;
    const content = displayContentRef.current;
    const baseSize = 116.16;
    content.style.fontSize = `${baseSize}px`;
    const singleLineHeight = baseSize * 1.1;
    const lines = Math.max(1, Math.round(content.scrollHeight / singleLineHeight));
    let finalSize = lines === 2 ? baseSize * 0.9 : lines >= 3 ? baseSize * 0.81 : baseSize;
    setDisplayFontSize(finalSize);
    content.style.fontSize = '';
  }, [expression]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('calc_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    const savedSettings = localStorage.getItem('calc_settings');
    if (savedSettings) setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
  }, []);

  const triggerHaptic = (multiplier: number = 1) => {
    if (!settings.hapticFeedback || !('vibrate' in navigator)) return;
    let duration = settings.hapticIntensity === 'soft' ? 5 : settings.hapticIntensity === 'medium' ? 15 : 30;
    navigator.vibrate(duration * multiplier);
  };

  const pushToUndo = (val: string) => { 
    setUndoStack(prev => [...prev, val].slice(-50)); 
    setRedoStack([]); 
  };

  const handleUndo = () => { 
    if (undoStack.length === 0) return; 
    triggerHaptic(); 
    const current = expression; 
    const prev = undoStack[undoStack.length - 1]; 
    setRedoStack(old => [...old, current]); 
    setUndoStack(old => old.slice(0, -1)); 
    setExpression(prev); 
  };

  const handleRedo = () => { 
    if (redoStack.length === 0) return; 
    triggerHaptic(); 
    const current = expression; 
    const next = redoStack[redoStack.length - 1]; 
    setUndoStack(old => [...old, current]); 
    setRedoStack(old => old.slice(0, -1)); 
    setExpression(next); 
  };

  const runningResult = useMemo(() => {
    try {
      const cleanExpr = expression.replace(/×/g, '*').replace(/÷/g, '/');
      if (cleanExpr === '0' || !cleanExpr) return '0.00';
      // Basic parser for demonstration
      const terms = cleanExpr.split('+');
      let total = 0;
      terms.forEach(term => {
        const components = term.split('*');
        let prod = parseFloat(components[0]) || 0;
        for(let i=1; i<components.length; i++) prod *= (parseFloat(components[i]) || 1);
        total += prod;
      });
      return total.toFixed(2);
    } catch { return '0.00'; }
  }, [expression]);

  const inputChar = (char: string) => {
    triggerHaptic(); 
    pushToUndo(expression);
    if (isResultMode && !['+', '*', '/'].includes(char)) { 
      setExpression(char === '*' ? '0×' : char === '/' ? '0÷' : char); 
      setIsResultMode(false); 
      return; 
    }
    setIsResultMode(false);
    setExpression(prev => {
      const iosChar = char === '*' ? '×' : char === '/' ? '÷' : char;
      if (prev === '0' && !['+', '×', '÷', '.'].includes(iosChar)) return iosChar;
      return prev + iosChar;
    });
  };

  const finalize = () => {
    triggerHaptic(2);
    const finalRes = runningResult;
    setHistory(prev => [{ id: Date.now().toString(), expression, result: finalRes, timestamp: Date.now() }, ...prev].slice(0, 50));
    setIsResultMode(true);
    pushToUndo(expression);
    setExpression(finalRes);
  };

  const isLight = settings.themeMode === 'light';
  const isAnyModalOpen = isHistoryOpen || isSettingsOpen || isPOSOpen;

  const formatCurrency = (valStr: string) => {
    const num = parseFloat(valStr) || 0;
    const val = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const symbols: any = { GHS: `${val}ghs`, USD: `$${val}`, EUR: `€${val}`, GBP: `£${val}`, JPY: `¥${val}`, NGN: `₦${val}` };
    return symbols[settings.currency] || val;
  };

  return (
    <div className={`flex items-center justify-center min-h-screen transition-colors duration-200 overflow-hidden font-sans ${isLight ? 'bg-[#f2f2f7]' : 'bg-black'}`}>
      <BlurredBackground isLight={isLight} wallpapers={settings.customWallpapers} />

      {!isUnlocked && (
        <WallpaperOverlay isLight={isLight} accentColor={settings.accentColor} onEnter={() => { triggerHaptic(2); setIsUnlocked(true); }} />
      )}

      <div className={`fixed inset-0 flex items-center justify-center transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
        <div className={`relative w-full max-w-[430px] h-screen max-h-[932px] flex flex-col p-6 pb-12 rounded-[40px] transition-all duration-500 ${isLight ? 'bg-white/40 shadow-2xl text-black' : 'bg-white/10 shadow-2xl text-white'} backdrop-blur-[var(--glass-blur,24px)] ${isAnyModalOpen ? 'blur-xl opacity-40 scale-[0.92]' : 'opacity-100'}`}>
          <div className="flex justify-end p-4 absolute top-4 left-0 right-0 z-50">
            <button onClick={() => { setIsSettingsOpen(true); triggerHaptic(); }} className={`p-3 rounded-2xl ${isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/10 hover:bg-white/20'}`}><Icons.Settings size={22} /></button>
          </div>
          
          <div className="flex-1 flex flex-col justify-end items-center py-4 px-4 overflow-hidden mb-2">
            <div ref={displayContentRef} style={{ fontSize: `${displayFontSize}px` }} className="font-light tracking-tighter break-all w-full text-center">
              {expression === '0' ? <span className="opacity-20">0</span> : expression}
            </div>
          </div>

          <div className="flex justify-between gap-2 mb-4 p-1.5 rounded-[24px] bg-current/5">
              <button onClick={handleUndo} className="flex-1 py-3 flex justify-center hover:bg-white/10 rounded-xl"><Icons.Undo size={18} /></button>
              <button onClick={handleRedo} className="flex-1 py-3 flex justify-center hover:bg-white/10 rounded-xl"><Icons.Redo size={18} /></button>
              <button onClick={() => setIsHistoryOpen(true)} className="flex-1 py-3 flex justify-center hover:bg-white/10 rounded-xl"><Icons.History size={18} /></button>
              <button onClick={() => setIsPOSOpen(true)} className="flex-1 py-3 flex justify-center hover:bg-white/10 rounded-xl"><Icons.Trends size={18} /></button>
              <button onClick={() => { triggerHaptic(); setExpression(prev => prev.slice(0, -1) || '0'); }} className="flex-1 py-3 flex justify-center hover:bg-white/10 rounded-xl"><Icons.Delete size={18} /></button>
          </div>

          <div className="h-[55%] grid grid-cols-4 gap-1">
            <CalcButton label="AC" onClick={() => setExpression('0')} variant="secondary" isLight={isLight} />
            <CalcButton label="+/-" onClick={() => {}} variant="secondary" isLight={isLight} />
            <CalcButton label="%" onClick={() => inputChar('%')} variant="secondary" isLight={isLight} />
            <CalcButton label="÷" onClick={() => inputChar('/')} variant="primary" accentColor={settings.accentColor} isLight={isLight} />
            
            {[7,8,9].map(n => <CalcButton key={n} label={n.toString()} onClick={() => inputChar(n.toString())} isLight={isLight} />)}
            <CalcButton label="×" onClick={() => inputChar('*')} variant="primary" accentColor={settings.accentColor} isLight={isLight} />
            
            {[4,5,6].map(n => <CalcButton key={n} label={n.toString()} onClick={() => inputChar(n.toString())} isLight={isLight} />)}
            <CalcButton label="-" onClick={() => inputChar('-')} variant="primary" accentColor={settings.accentColor} isLight={isLight} />
            
            {[1,2,3].map(n => <CalcButton key={n} label={n.toString()} onClick={() => inputChar(n.toString())} isLight={isLight} />)}
            <CalcButton label="+" onClick={() => inputChar('+')} variant="primary" accentColor={settings.accentColor} isLight={isLight} />
            
            <CalcButton label="0" onClick={() => inputChar('0')} wide isLight={isLight} />
            <CalcButton label="." onClick={() => inputChar('.')} isLight={isLight} />
            <CalcButton label="=" onClick={finalize} variant="primary" accentColor={settings.accentColor} isLight={isLight} />
          </div>
        </div>
      </div>

      <HistoryPanel history={history} isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} onClear={() => setHistory([])} onSelect={(i) => { setExpression(i.result); setIsHistoryOpen(false); }} isLight={isLight} />
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} updateSettings={(k, v) => setSettings(p => ({ ...p, [k]: v }))} />
      <POSDashboard history={history} isOpen={isPOSOpen} onClose={() => setIsPOSOpen(false)} isLight={isLight} accentColor={settings.accentColor} formatCurrency={formatCurrency} updateSettings={(k, v) => setSettings(p => ({ ...p, [k]: v }))} />
    </div>
  );
};

export default App;
