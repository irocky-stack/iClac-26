
import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import CalcButton from './components/CalcButton';
import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';
import BlurredBackground from './components/BlurredBackground';
import POSDashboard from './components/POSDashboard';
import { Icons, THEMES, WALLPAPER_SLIDES } from './constants';
import { HistoryItem } from './types';

const App: React.FC = () => {
  const [expression, setExpression] = useState('0');
  const [lastExpression, setLastExpression] = useState('');
  const [isResultMode, setIsResultMode] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Undo/Redo Stacks
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // POS Mode states
  const [isPOSOpen, setIsPOSOpen] = useState(false);

  // Gesture states
  const [dragY, setDragY] = useState(0);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const totalDeltaY = useRef(0);

  const displayEndRef = useRef<HTMLDivElement>(null);
  const displayContentRef = useRef<HTMLDivElement>(null);

  const [displayFontSize, setDisplayFontSize] = useState(116.16); 
  const [settings, setSettings] = useState({
    accentColor: THEMES[0].color,
    glassBlur: 24,
    showSubExpression: true,
    hapticFeedback: true,
    hapticIntensity: 'medium' as 'soft' | 'medium' | 'intense',
    themeMode: 'light' as 'light' | 'dark',
    currency: 'GHS' as 'GHS' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'NGN',
    customWallpapers: WALLPAPER_SLIDES,
    inactivityTimeout: 0 // 0 means Never/Off
  });

  useLayoutEffect(() => {
    if (!displayContentRef.current) return;
    const content = displayContentRef.current;
    const baseSize = 116.16;
    content.style.fontSize = `${baseSize}px`;
    content.style.lineHeight = '1.1';
    
    const singleLineHeight = baseSize * 1.1;
    const lines = Math.max(1, Math.round(content.scrollHeight / singleLineHeight));

    let finalSize = baseSize;
    if (lines === 2) {
      finalSize = baseSize * 0.9;
    } else if (lines >= 3) {
      finalSize = baseSize * 0.81;
    }

    setDisplayFontSize(finalSize);
    content.style.fontSize = '';
    content.style.lineHeight = '';

    if (lines >= 4 && displayEndRef.current) {
      displayEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [expression]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('calc_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedSettings = localStorage.getItem('calc_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (parsed.customWallpapers && parsed.customWallpapers.length > 6) {
        parsed.customWallpapers = parsed.customWallpapers.slice(0, 6);
      }
      setSettings(prev => ({ ...prev, ...parsed }));
    }
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

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    startY.current = e.clientY;
    totalDeltaY.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const delta = e.clientY - startY.current;
    totalDeltaY.current = delta;
    
    let elasticDelta = 0;
    if (delta > 0) {
      if (delta <= 15) {
        elasticDelta = delta;
      } else {
        elasticDelta = 15 + Math.log10(delta - 14) * 10;
      }
    }
    setDragY(Math.min(30, elasticDelta));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    isDragging.current = false;
    
    // Aesthetic bounce feedback
    if (totalDeltaY.current > 15 || dragY > 15) {
      triggerHaptic(1);
    }
    setDragY(0);
    totalDeltaY.current = 0;
  };

  const runningResult = useMemo(() => {
    try {
      const cleanExpr = expression.replace(/×/g, '*').replace(/÷/g, '/');
      if (cleanExpr === '0' || !cleanExpr) return '0.00';
      
      const terms = cleanExpr.split('+');
      let grandTotal = 0;
      
      terms.forEach(term => {
        if (!term.trim()) return;
        
        let sanitizedTerm = term.replace(/[*/]$/, '');
        if (!sanitizedTerm) return;

        const components = sanitizedTerm.split('*');
        if (components.length === 0) return;

        const price = parseFloat(components[0]);
        if (isNaN(price)) return;

        let quantityProduct = 1;
        for (let i = 1; i < components.length; i++) {
          const qty = parseFloat(components[i]);
          if (!isNaN(qty)) {
            quantityProduct *= qty;
          }
        }
        
        grandTotal += (price * quantityProduct);
      });

      return grandTotal.toFixed(2);
    } catch {
      return '0.00';
    }
  }, [expression]);

  const formatCurrency = (valStr: string) => {
    const num = parseFloat(valStr) || 0;
    const val = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    switch (settings.currency) {
      case 'GHS': return `${val}ghs`;
      case 'USD': return `$${val}`;
      case 'EUR': return `€${val}`;
      case 'GBP': return `£${val}`;
      case 'JPY': return `¥${val}`;
      case 'NGN': return `₦${val}`;
      default: return val;
    }
  };

  const formattedRunningResult = useMemo(() => {
    return formatCurrency(runningResult);
  }, [runningResult, settings.currency]);

  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('calc_settings', JSON.stringify(settings));
    document.documentElement.style.setProperty('--glass-blur', `${settings.glassBlur}px`);
  }, [settings]);

  const clearAll = () => {
    triggerHaptic();
    pushToUndo(expression);
    setExpression('0');
    setLastExpression('');
    setIsResultMode(false);
  };

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
      
      const last = prev.slice(-1);
      if (['+', '×', '÷'].includes(iosChar) && ['+', '×', '÷'].includes(last)) {
        return prev.slice(0, -1) + iosChar;
      }
      return prev + iosChar;
    });
  };

  const toggleSign = () => {
    triggerHaptic();
    pushToUndo(expression);
    setIsResultMode(false);
    setExpression(prev => {
      if (prev === '0') return '0';
      if (prev.startsWith('-')) return prev.substring(1);
      return '-' + prev;
    });
  };

  const finalize = () => {
    triggerHaptic(2);
    try {
      const finalRes = runningResult;
      const newHistory: HistoryItem = {
        id: Date.now().toString(),
        expression: expression,
        result: finalRes,
        timestamp: Date.now()
      };
      setHistory(prev => [newHistory, ...prev].slice(0, 50));
      setLastExpression(expression);
      setIsResultMode(true);
      pushToUndo(expression);
      setExpression(finalRes);
    } catch {
      setExpression('Error');
    }
  };

  const handleDelete = () => {
    triggerHaptic();
    pushToUndo(expression);
    if (expression.length > 1) {
      setExpression(prev => prev.slice(0, -1));
    } else {
      setExpression('0');
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    triggerHaptic(3);
    pushToUndo(expression);
    setExpression(item.result);
    setLastExpression(item.expression);
    setIsResultMode(true);
    setIsHistoryOpen(false);
  };

  const exitOverlays = () => {
    if (!isAnyModalOpen) return;
    triggerHaptic();
    setIsPOSOpen(false);
    setIsHistoryOpen(false);
    setIsSettingsOpen(false);
  };

  const isLight = settings.themeMode === 'light';
  const isAnyModalOpen = isHistoryOpen || isSettingsOpen || isPOSOpen;

  return (
    <div className={`flex items-center justify-center min-h-screen transition-colors duration-200 overflow-hidden font-sans ${isLight ? 'bg-[#f2f2f7]' : 'bg-black'}`}>
      
      <BlurredBackground isLight={isLight} wallpapers={settings.customWallpapers} />

      <div className={`
        fixed inset-0 flex items-center justify-center transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) opacity-100 scale-100 pointer-events-auto
      `}>
        <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-all duration-300 ${isAnyModalOpen ? 'blur-xl scale-110 opacity-40' : 'blur-0 scale-100 opacity-60'}`}>
          <div className="absolute top-[5%] left-[5%] w-[50%] h-[50%] rounded-full opacity-25 blur-[100px]" style={{ backgroundColor: settings.accentColor }} />
          <div className="absolute bottom-[5%] right-[5%] w-[50%] h-[50%] rounded-full opacity-15 blur-[120px]" style={{ backgroundColor: settings.accentColor }} />
        </div>

        <div 
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[16px] transition-opacity duration-200 pointer-events-none"
          style={{ opacity: dragY / 60 }}
        />

        <div 
          onPointerDown={exitOverlays}
          className={`
            relative w-full max-w-[430px] h-screen max-h-[932px] flex flex-col p-6 pb-12 select-none m-4 rounded-[40px] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
            ${isLight ? 'bg-white/40 shadow-[0_48px_128px_-24px_rgba(0,0,0,0.25)] text-black' : 'bg-white/10 shadow-[0_64px_160px_-24px_rgba(0,0,0,0.95)] text-white'}
            backdrop-blur-[var(--glass-blur,24px)]
            ${isAnyModalOpen ? 'blur-xl opacity-40 scale-[0.92]' : 'opacity-100'}
            ${isAnyModalOpen ? 'cursor-pointer' : 'cursor-default'}
          `}
        >
          <div className={`flex justify-end items-center px-4 pt-4 absolute top-4 left-0 right-0 z-50 transition-opacity duration-150 ${isAnyModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); triggerHaptic(); }}
              className={`p-3 rounded-2xl transition-all duration-150 active:scale-90 ${isLight ? 'bg-black/5 hover:bg-black/10 text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            >
              <Icons.Settings size={22} />
            </button>
          </div>

          <div 
            className="w-full flex flex-col items-center mb-1 flex-shrink-0 h-[60px] justify-center mt-2 cursor-grab active:cursor-grabbing group relative z-40 touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div 
              className="w-full flex justify-center h-[6px] relative transition-transform duration-100"
              style={{ transform: `translateY(${dragY}px)` }}
            >
              <div 
                className={`h-full rounded-full transition-all duration-200 ${dragY > 0 ? 'w-[85%] opacity-100' : 'w-[60%] animate-pulse-glow'}`}
                style={{ 
                  backgroundColor: settings.accentColor,
                  boxShadow: `0 0 25px ${settings.accentColor}AA`,
                  transform: `scaleY(${1 + (dragY / 100)})` 
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-center mb-2 flex-shrink-0 h-[40px]">
            <div 
              className={`flex-1 transition-all text-[1.155rem] font-bold tracking-tight text-center truncate px-2`}
              style={{ color: isLight ? 'rgba(0,0,0,0.6)' : settings.accentColor }}
            >
              {isResultMode && lastExpression ? lastExpression : formattedRunningResult}
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col justify-end items-center py-4 relative cursor-pointer overflow-hidden mb-2">
            <div className="w-full overflow-y-auto h-full flex flex-col justify-end transition-all duration-200 px-4 scroll-smooth scrollbar-hide">
              <div 
                ref={displayContentRef}
                style={{ fontSize: `${displayFontSize}px`, lineHeight: '1.1' }}
                className={`font-light tracking-tighter break-all w-full text-center transition-all duration-200 ${isLight ? 'text-black' : 'text-white'}`}
              >
                {expression === '0' ? <span className="opacity-20">0</span> : expression}
              </div>
              <div ref={displayEndRef} />
            </div>
          </div>

          <div className="flex justify-between gap-2 mb-4 px-1 flex-shrink-0 relative">
            <div className={`flex flex-1 gap-2 p-1.5 rounded-[24px] transition-all ${isLight ? 'bg-black/5' : 'bg-white/5'}`}>
              <button onClick={handleUndo} disabled={undoStack.length === 0} title="Undo" className={`flex-1 flex items-center justify-center py-3 rounded-xl transition-all active:scale-90 disabled:opacity-20 ${isLight ? 'hover:bg-white' : 'hover:bg-white/10'}`}>
                <Icons.Undo size={18} />
              </button>
              <button onClick={handleRedo} disabled={redoStack.length === 0} title="Redo" className={`flex-1 flex items-center justify-center py-3 rounded-xl transition-all active:scale-90 disabled:opacity-20 ${isLight ? 'hover:bg-white' : 'hover:bg-white/10'}`}>
                <Icons.Redo size={18} />
              </button>
              <button onClick={() => { setIsHistoryOpen(true); triggerHaptic(); }} title="History" className={`flex-1 flex items-center justify-center py-3 rounded-xl transition-all active:scale-90 ${isLight ? 'hover:bg-white' : 'hover:bg-white/10'}`}>
                <Icons.History size={18} />
              </button>
              <button onClick={() => { setIsPOSOpen(true); triggerHaptic(); }} title="Terminal Dashboard" className={`flex-1 flex items-center justify-center py-3 rounded-xl transition-all active:scale-90 ${isLight ? 'hover:bg-white' : 'hover:bg-white/10'}`}>
                <Icons.Trends size={18} />
              </button>
              <button onClick={handleDelete} title="Delete" className={`flex-1 flex items-center justify-center py-3 rounded-xl transition-all active:scale-90 ${isLight ? 'hover:bg-white' : 'hover:bg-white/10'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
              </button>
            </div>
          </div>

          <div className={`h-[55%] grid grid-cols-4 gap-1 transition-all duration-150 pb-2`}>
            {/* Standard iOS Keypad Layout */}
            <CalcButton label={expression === '0' ? 'AC' : 'C'} onClick={clearAll} variant="secondary" isLight={isLight} />
            <CalcButton label="+/-" onClick={toggleSign} variant="secondary" isLight={isLight} />
            <CalcButton label="%" onClick={() => inputChar('%')} variant="secondary" isLight={isLight} />
            <CalcButton label="÷" onClick={() => inputChar('/')} variant="primary" accentColor={settings.accentColor} isLight={isLight} />

            <CalcButton label="7" onClick={() => inputChar('7')} isLight={isLight} />
            <CalcButton label="8" onClick={() => inputChar('8')} isLight={isLight} />
            <CalcButton label="9" onClick={ () => inputChar('9')} isLight={isLight} />
            <CalcButton label="×" onClick={() => inputChar('*')} variant="primary" accentColor={settings.accentColor} isLight={isLight} />

            <CalcButton label="4" onClick={() => inputChar('4')} isLight={isLight} />
            <CalcButton label="5" onClick={() => inputChar('5')} isLight={isLight} />
            <CalcButton label="6" onClick={() => inputChar('6')} isLight={isLight} />
            <CalcButton label="-" onClick={() => inputChar('-')} variant="primary" accentColor={settings.accentColor} isLight={isLight} />

            <CalcButton label="1" onClick={() => inputChar('1')} isLight={isLight} />
            <CalcButton label="2" onClick={() => inputChar('2')} isLight={isLight} />
            <CalcButton label="3" onClick={() => inputChar('3')} isLight={isLight} />
            <CalcButton label="+" onClick={() => inputChar('+')} variant="primary" accentColor={settings.accentColor} isLight={isLight} />

            <CalcButton label="0" onClick={() => inputChar('0')} wide isLight={isLight} />
            <CalcButton label="." onClick={() => inputChar('.')} isLight={isLight} />
            <CalcButton label="=" onClick={finalize} variant="primary" accentColor={settings.accentColor} isLight={isLight} />
          </div>
        </div>
      </div>

      <HistoryPanel history={history} isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} onClear={() => setHistory([])} onSelect={handleHistorySelect} isLight={isLight} />
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} updateSettings={(key, value) => setSettings(p => ({ ...p, [key]: value }))} />
      <POSDashboard history={history} isOpen={isPOSOpen} onClose={() => setIsPOSOpen(false)} isLight={isLight} accentColor={settings.accentColor} formatCurrency={formatCurrency} updateSettings={(key, value) => setSettings(p => ({ ...p, [key]: value }))} />

      <style>{`
        @keyframes pulse-glow {
          0% { opacity: 0.8; width: 55%; }
          50% { opacity: 1; width: 65%; }
          100% { opacity: 0.8; width: 55%; }
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
