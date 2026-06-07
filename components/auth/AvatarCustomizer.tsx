'use client';
import React, { useState, useEffect } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { DICEBEAR_OPTIONS } from '../../lib/dicebear-options';

interface AvatarCustomizerProps {
  initialUrl?: string;
  onChange: (url: string) => void;
  defaultNickname?: string;
}

export default function AvatarCustomizer({ initialUrl, onChange, defaultNickname }: AvatarCustomizerProps) {
  const [tab, setTab] = useState<'face' | 'hair' | 'accessory' | 'colors'>('face');

  // States for each trait
  const [eyesIdx, setEyesIdx] = useState(0);
  const [mouthIdx, setMouthIdx] = useState(0);
  const [hairIdx, setHairIdx] = useState(0);
  const [glassesIdx, setGlassesIdx] = useState(0); // 0 is "none"
  const [earringsIdx, setEarringsIdx] = useState(0); // 0 is "none"
  const [featuresIdx, setFeaturesIdx] = useState(0); // 0 is "none"

  // Colors
  const [skinColor, setSkinColor] = useState(DICEBEAR_OPTIONS.skinColor[0]);
  const [hairColor, setHairColor] = useState(DICEBEAR_OPTIONS.hairColor[0]);
  const [bgColor, setBgColor] = useState(DICEBEAR_OPTIONS.backgroundColor[0]);

  // Collapsible states
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);

  // Parse initialUrl on mount
  useEffect(() => {
    if (initialUrl && initialUrl.includes('api.dicebear.com')) {
      try {
        const params = new URL(initialUrl).searchParams;

        const findIdx = (arr: string[], val: string | null) => {
          if (!val) return 0;
          const idx = arr.indexOf(val);
          return idx !== -1 ? idx : 0;
        };

        if (params.has('eyes')) setEyesIdx(findIdx(DICEBEAR_OPTIONS.eyes, params.get('eyes')));
        if (params.has('mouth')) setMouthIdx(findIdx(DICEBEAR_OPTIONS.mouth, params.get('mouth')));
        if (params.has('hair')) setHairIdx(findIdx(DICEBEAR_OPTIONS.hair, params.get('hair')));

        if (params.get('glassesProbability') === '100') {
          setGlassesIdx(findIdx(DICEBEAR_OPTIONS.glasses, params.get('glasses')));
        } else {
          setGlassesIdx(0);
        }

        if (params.get('earringsProbability') === '100') {
          setEarringsIdx(findIdx(DICEBEAR_OPTIONS.earrings, params.get('earrings')));
        } else {
          setEarringsIdx(0);
        }

        if (params.get('featuresProbability') === '100') {
          setFeaturesIdx(findIdx(DICEBEAR_OPTIONS.features, params.get('features')));
        } else {
          setFeaturesIdx(0);
        }

        if (params.has('skinColor')) setSkinColor(params.get('skinColor')!);
        if (params.has('hairColor')) setHairColor(params.get('hairColor')!);
        if (params.has('backgroundColor')) setBgColor(params.get('backgroundColor')!);

      } catch (e) {
        console.error(e);
      }
    }
  }, [initialUrl]);

  const generateUrl = () => {
    const params = new URLSearchParams();

    // Always use a fixed seed to ensure base is same, then override with traits
    params.set('seed', defaultNickname || 'Adventurer');

    params.set('eyes', DICEBEAR_OPTIONS.eyes[eyesIdx]);
    params.set('mouth', DICEBEAR_OPTIONS.mouth[mouthIdx]);
    params.set('hair', DICEBEAR_OPTIONS.hair[hairIdx]);

    // Accessories & Features
    if (glassesIdx === 0) {
      params.set('glassesProbability', '0');
    } else {
      params.set('glasses', DICEBEAR_OPTIONS.glasses[glassesIdx]);
      params.set('glassesProbability', '100');
    }

    if (earringsIdx === 0) {
      params.set('earringsProbability', '0');
    } else {
      params.set('earrings', DICEBEAR_OPTIONS.earrings[earringsIdx]);
      params.set('earringsProbability', '100');
    }

    if (featuresIdx === 0) {
      params.set('featuresProbability', '0');
    } else {
      params.set('features', DICEBEAR_OPTIONS.features[featuresIdx]);
      params.set('featuresProbability', '100');
    }

    // Colors
    params.set('skinColor', skinColor);
    params.set('hairColor', hairColor);
    params.set('backgroundColor', bgColor === 'transparent' ? 'transparent' : bgColor);

    return `https://api.dicebear.com/9.x/adventurer/svg?${params.toString()}`;
  };

  useEffect(() => {
    onChange(generateUrl());
  }, [eyesIdx, mouthIdx, hairIdx, glassesIdx, earringsIdx, featuresIdx, skinColor, hairColor, bgColor, defaultNickname]);

  // Randomize all traits
  const handleRandomize = () => {
    setEyesIdx(Math.floor(Math.random() * DICEBEAR_OPTIONS.eyes.length));
    setMouthIdx(Math.floor(Math.random() * DICEBEAR_OPTIONS.mouth.length));
    setHairIdx(Math.floor(Math.random() * DICEBEAR_OPTIONS.hair.length));
    setGlassesIdx(Math.floor(Math.random() * DICEBEAR_OPTIONS.glasses.length));
    setEarringsIdx(Math.floor(Math.random() * DICEBEAR_OPTIONS.earrings.length));
    setFeaturesIdx(Math.floor(Math.random() * DICEBEAR_OPTIONS.features.length));
    setSkinColor(DICEBEAR_OPTIONS.skinColor[Math.floor(Math.random() * DICEBEAR_OPTIONS.skinColor.length)]);
    setHairColor(DICEBEAR_OPTIONS.hairColor[Math.floor(Math.random() * DICEBEAR_OPTIONS.hairColor.length)]);
    setBgColor(DICEBEAR_OPTIONS.backgroundColor[Math.floor(Math.random() * DICEBEAR_OPTIONS.backgroundColor.length)]);
  };

  const getThumbnailUrl = (type: string, opt: string) => {
    const params = new URLSearchParams();
    params.set('seed', 'preview_base');
    params.set('backgroundColor', 'f8f9fa');
    params.set('hair', 'short01'); // 짧은 머리로 고정하여 얼굴이 잘 보이게 함

    if (type === 'eyes') params.set('eyes', opt);
    if (type === 'mouth') params.set('mouth', opt);
    if (type === 'hair') params.set('hair', opt);

    if (type === 'glasses') {
      params.set('glasses', opt);
      params.set('glassesProbability', '100');
    }
    if (type === 'earrings') {
      params.set('earrings', opt);
      params.set('earringsProbability', '100');
    }
    if (type === 'features') {
      params.set('features', opt);
      params.set('featuresProbability', '100');
    }

    return `https://api.dicebear.com/9.x/adventurer/svg?${params.toString()}`;
  };

  const renderGrid = (label: string, idx: number, setIdx: (n: number) => void, options: string[], type: string) => {
    const open = expanded[type] !== false;
    return (
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setExpanded(prev => ({ ...prev, [type]: !open }))}
          className="flex items-center justify-between w-full mb-3 group outline-none"
        >
          <span className="text-sm font-extrabold text-gray-800 tracking-tight group-hover:text-teal-600 transition-colors">{label}</span>
          <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </button>
        {open && (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            {options.map((opt, i) => {
              if (opt === 'none') {
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setIdx(i)}
                    className={`aspect-square rounded-[1rem] border-2 flex items-center justify-center transition-all duration-200 ${idx === i ? 'border-teal-500 bg-teal-50 text-teal-600 shadow-sm ring-2 ring-teal-500/20' : 'border-gray-100 bg-gray-50/50 text-gray-300 hover:border-teal-200 hover:text-teal-400 hover:shadow-sm'}`}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                )
              }

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`relative aspect-square rounded-[1rem] border-2 overflow-hidden bg-white transition-all duration-200 ${idx === i ? 'border-teal-500 scale-[1.03] shadow-[0_8px_16px_-6px_rgba(20,184,166,0.3)] z-10 ring-2 ring-teal-500/20' : 'border-gray-100 hover:border-teal-300 hover:shadow-md hover:-translate-y-0.5'}`}
                >
                  <img
                    src={getThumbnailUrl(type, opt)}
                    alt={opt}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>
    );
  };

  const renderColorGrid = (label: string, currentColor: string, setColor: (c: string) => void, options: string[], type: string) => {
    const open = expanded[type] !== false;
    const isCustom = currentColor !== 'transparent' && !options.includes(currentColor);
    const isPickerOpen = pickerOpen === type;

    return (
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setExpanded(prev => ({ ...prev, [type]: !open }))}
          className="flex items-center justify-between w-full mb-3 group outline-none"
        >
          <span className="text-sm font-extrabold text-gray-800 tracking-tight group-hover:text-teal-600 transition-colors">{label}</span>
          <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </button>
        {open && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex flex-wrap gap-3 items-center">
              {options.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-full border-[3px] transition-all duration-200 ${currentColor === c ? 'scale-110 border-teal-500 shadow-[0_4px_12px_rgba(20,184,166,0.3)] z-10' : 'border-white ring-1 ring-gray-200 hover:scale-105 hover:ring-teal-300 hover:shadow-sm'}`}
                  style={c === 'transparent' ? { background: 'repeating-conic-gradient(#eee 0% 25%, transparent 0% 50%) 50% / 10px 10px' } : { backgroundColor: `#${c}` }}
                />
              ))}

              <button
                type="button"
                onClick={() => setPickerOpen(isPickerOpen ? null : type)}
                className={`w-9 h-9 rounded-full relative overflow-hidden transition-all duration-300 flex items-center justify-center group ${isPickerOpen || isCustom
                  ? 'scale-110 shadow-[0_4px_12px_rgba(20,184,166,0.3)] z-10 border-[2.5px] border-white ring-2 ring-teal-500'
                  : 'border-[3px] border-white ring-1 ring-gray-200 hover:scale-105 hover:ring-teal-300 hover:shadow-sm'
                  }`}
              >
                <div className="absolute inset-0 bg-[conic-gradient(from_90deg,#ff0000,#ff8a00,#ffe600,#14ff00,#00a3ff,#0500ff,#ad00ff,#ff00c8,#ff0000)] group-hover:rotate-180 transition-transform duration-700 ease-in-out"></div>
                <div className="relative w-[18px] h-[18px] bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                </div>
              </button>
            </div>

            {isPickerOpen && (
              <div className="p-4 bg-white border border-gray-100 rounded-[1.5rem] flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] relative mt-1">
                <style dangerouslySetInnerHTML={{
                  __html: `
                  .react-colorful { width: 100% !important; max-width: 100%; height: 180px !important; }
                  .react-colorful__pointer { width: 24px; height: 24px; border-width: 3px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                  .react-colorful__hue { height: 16px !important; border-radius: 8px !important; margin-top: 14px; }
                  .react-colorful__saturation { border-radius: 12px !important; border-bottom: none !important; }
                `}} />

                <HexColorPicker
                  color={`#${currentColor === 'transparent' || !currentColor ? 'ffffff' : currentColor}`}
                  onChange={(hex) => setColor(hex.replace('#', ''))}
                />

                <div className="flex items-center gap-3 w-full bg-gray-50/80 px-4 py-2.5 rounded-xl border border-gray-100 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all">
                  <span className="text-[11px] font-black text-gray-400 tracking-wider">HEX</span>
                  <HexColorInput
                    color={`#${currentColor === 'transparent' || !currentColor ? 'ffffff' : currentColor}`}
                    onChange={(hex) => setColor(hex.replace('#', ''))}
                    prefixed
                    className="w-full text-sm font-semibold outline-none text-gray-700 bg-transparent uppercase"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-[2rem] overflow-hidden border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] mb-6 bg-gray-50 shrink-0">
        <img src={generateUrl()} alt="Custom Avatar" className="w-full h-full object-cover transition-opacity duration-300" />
      </div>

      <button type="button" onClick={handleRandomize} className="flex items-center justify-center w-10 h-10 bg-teal-600 text-white rounded-full mb-8 hover:bg-teal-500 hover:-translate-y-0.5 hover:shadow-md hover:shadow-teal-500/30 transition-all duration-300 group" aria-label="랜덤 생성">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-500 group-hover:rotate-[180deg]"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l-5.38 5.38" /></svg>
      </button>

      <div className="w-full bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[380px]">
        <div className="flex bg-gray-50/80 p-2 m-3 mb-0 rounded-[1.25rem] shrink-0 border border-gray-100/50">
          {['face', 'hair', 'accessory', 'colors'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t as any)}
              className={`flex-1 py-2.5 text-[13px] font-bold rounded-[1rem] transition-all duration-200 ${tab === t ? 'text-teal-700 bg-white shadow-sm ring-1 ring-black/5 scale-[1.02]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/40'}`}
            >
              {t === 'face' ? '얼굴' : t === 'hair' ? '머리' : t === 'accessory' ? '장신구' : '색상'}
            </button>
          ))}
        </div>

        <div className="p-6 pt-5 overflow-y-auto flex-1 custom-scrollbar">
          {tab === 'face' && (
            <div className="animate-in fade-in duration-200">
              {renderGrid('눈', eyesIdx, setEyesIdx, DICEBEAR_OPTIONS.eyes, 'eyes')}
              {renderGrid('입', mouthIdx, setMouthIdx, DICEBEAR_OPTIONS.mouth, 'mouth')}
              {renderGrid('스타일', featuresIdx, setFeaturesIdx, DICEBEAR_OPTIONS.features, 'features')}
            </div>
          )}
          {tab === 'hair' && (
            <div className="animate-in fade-in duration-200">
              {renderGrid('헤어', hairIdx, setHairIdx, DICEBEAR_OPTIONS.hair, 'hair')}
            </div>
          )}
          {tab === 'accessory' && (
            <div className="animate-in fade-in duration-200">
              {renderGrid('안경', glassesIdx, setGlassesIdx, DICEBEAR_OPTIONS.glasses, 'glasses')}
              {renderGrid('귀걸이', earringsIdx, setEarringsIdx, DICEBEAR_OPTIONS.earrings, 'earrings')}
            </div>
          )}
          {tab === 'colors' && (
            <div className="animate-in fade-in duration-200">
              {renderColorGrid('스킨', skinColor, setSkinColor, DICEBEAR_OPTIONS.skinColor, 'skinColor')}
              {renderColorGrid('헤어컬러', hairColor, setHairColor, DICEBEAR_OPTIONS.hairColor, 'hairColor')}
              {renderColorGrid('배경색', bgColor, setBgColor, DICEBEAR_OPTIONS.backgroundColor, 'bgColor')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
