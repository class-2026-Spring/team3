'use client';
// components/layout/SettingsPanel.tsx

import { useEffect, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Language, Theme, MapFilter } from '../../types/settings';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: Props) {
  const { settings, updateSettings, resetSettings } = useAppContext();
  const panelRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  // --- 공통 토글 UI ---
  const Toggle = ({
    checked,
    onChange,
    disabled,
  }: {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-teal-500' : 'bg-gray-200'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );

  // --- 칩 선택 UI ---
  const ChipGroup = <T extends string>({
    options,
    value,
    onChange,
  }: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
  }) => (
    <div className="flex gap-1.5 flex-wrap">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            value === opt.value
              ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
              : 'border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-600'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[1px]" />

      {/* 슬라이드 패널 */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-[300px] bg-white shadow-2xl z-50 flex flex-col"
        style={{ borderLeft: '1px solid #f0f0f0' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-teal-500">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94zM12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
            <h2 className="text-[14px] font-bold text-gray-800">설정</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* 언어 */}
          <section>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">언어</p>
            <ChipGroup<Language>
              options={[
                { value: 'ko', label: '한국어' },
                { value: 'en', label: 'English' },
              ]}
              value={settings.language}
              onChange={v => updateSettings({ language: v })}
            />
          </section>

          {/* 테마 */}
          <section>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">테마</p>
            <ChipGroup<Theme>
              options={[
                { value: 'light', label: '라이트' },
                { value: 'dark', label: '다크' },
                { value: 'system', label: '시스템' },
              ]}
              value={settings.theme}
              onChange={v => updateSettings({ theme: v })}
            />
          </section>

          {/* 지도 기본 설정 */}
          <section>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">지도 기본 설정</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-600 font-semibold mb-2">기본 충전 속도 필터</p>
                <ChipGroup<MapFilter>
                  options={[
                    { value: '전체', label: '전체' },
                    { value: '급속', label: '급속' },
                    { value: '완속', label: '완속' },
                  ]}
                  value={settings.mapDefaultFilter}
                  onChange={v => updateSettings({ mapDefaultFilter: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">사용 가능한 충전소만 표시</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">지도에서 사용 가능 상태만 필터</p>
                </div>
                <Toggle
                  checked={settings.mapShowAvailableOnly}
                  onChange={() => updateSettings({ mapShowAvailableOnly: !settings.mapShowAvailableOnly })}
                />
              </div>
            </div>
          </section>

          {/* 알림 설정 */}
          <section>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">알림 설정</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">알림 전체 활성화</p>
                </div>
                <Toggle
                  checked={settings.notifications.enabled}
                  onChange={() =>
                    updateSettings({
                      notifications: {
                        ...settings.notifications,
                        enabled: !settings.notifications.enabled,
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-semibold ${settings.notifications.enabled ? 'text-gray-600' : 'text-gray-300'}`}>
                    즐겨찾기 상태 변경 알림
                  </p>
                  <p className={`text-[10px] mt-0.5 ${settings.notifications.enabled ? 'text-gray-400' : 'text-gray-200'}`}>
                    즐겨찾기 충전소 상태 변경 시 알림
                  </p>
                </div>
                <Toggle
                  checked={settings.notifications.favoriteStatusChange}
                  onChange={() =>
                    updateSettings({
                      notifications: {
                        ...settings.notifications,
                        favoriteStatusChange: !settings.notifications.favoriteStatusChange,
                      },
                    })
                  }
                  disabled={!settings.notifications.enabled}
                />
              </div>
            </div>
          </section>
        </div>

        {/* 하단 초기화 버튼 */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={resetSettings}
            className="w-full py-2.5 text-xs font-semibold text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-xl transition-colors"
          >
            설정 초기화
          </button>
        </div>
      </div>
    </>
  );
}
