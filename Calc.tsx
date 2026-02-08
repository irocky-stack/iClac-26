import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { jsPDF } from 'jspdf';

// --- TYPES & INTERFACES ---
export type Operation = '+' | '-' | '*' | '/' | '%' | null;

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

// --- CONSTANTS ---
export const THEMES = [
  { name: 'iOS Orange', color: '#ff9f0a' },
  { name: 'Electric Blue', color: '#0a84ff' },
  { name: 'Emerald Green', color: '#30d158' },
  { name: 'Cyber Pink', color: '#ff375f' }
];

export const WALLPAPER_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
    header: 'Vision iCalc 26',
    subHeader: 'Experience the future of spatial computation today.'
  },
  {
    image: 'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=2564&auto=format&fit=crop',
    header: 'Glassmorphic Design',
    subHeader: 'A UI that lives and breathes with your environment.'
  },
  {
    image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2564&auto=format&fit=crop',
    header: 'Precision Refined',
    subHeader: 'Advanced math logic meets uncompromising aesthetics.'
  }
];

// --- ICONS ---
interface IconProps { size?: number; }
export const Icons = {
  History: ({ size = 20 }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M