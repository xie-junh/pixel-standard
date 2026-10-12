import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface PixelNumberInputProps {
  value: number;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  placeholder?: string;
  className?: string;
}

export const PixelNumberInput: React.FC<PixelNumberInputProps> = ({
  value,
  onChange,
  step = 16,
  min = 1,
  max = 100000000,
  unit = 'px',
  placeholder,
  className = '',
}) => {
  const { language } = useLanguage();
  const effectivePlaceholder = placeholder || (language === 'zh' ? '输入数值...' : 'Enter value...');
  // Local string representation so user can type freely without premature clamping

  const [textValue, setTextValue] = useState<string>(value > 0 ? String(value) : '');
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Synchronize with external changes (presets, prop updates) only when not user-focused
  useEffect(() => {
    if (!isFocused) {
      if (value > 0) {
        if (parseInt(textValue, 10) !== value) {
          setTextValue(String(value));
        }
      } else if (textValue !== '') {
        setTextValue('');
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    // Allow digits only or empty string
    if (raw === '' || /^\d+$/.test(raw)) {
      setTextValue(raw);
      if (raw !== '') {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed) && parsed > 0) {
          onChange(parsed);
        }
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseInt(textValue, 10);
    if (isNaN(parsed) || parsed < min) {
      const fallback = min > 0 ? min : 1;
      setTextValue(String(fallback));
      onChange(fallback);
    } else if (max && parsed > max) {
      setTextValue(String(max));
      onChange(max);
    } else {
      setTextValue(String(parsed));
      onChange(parsed);
    }
  };

  const handleStep = (delta: number) => {
    const current = parseInt(textValue, 10) || min;
    const next = Math.max(min, Math.min(max, current + delta));
    setTextValue(String(next));
    onChange(next);
  };

  const effectiveStep = Math.max(1, step || 1);

  return (
    <div
      className={`relative flex items-stretch h-10 bg-slate-900 border border-slate-700 hover:border-slate-600 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 rounded-lg overflow-hidden transition-all shadow-xs ${className}`}
    >
      {/* Number Text Input */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={textValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent border-0 pl-3 pr-2 text-sm font-mono tabular-nums text-white placeholder-slate-500 focus:outline-none"
      />

      {/* Unit label */}
      {unit && (
        <span className="flex items-center text-xs font-mono text-slate-500 select-none pr-2">
          {unit}
        </span>
      )}

      {/* Arrow icons attached directly at the end of the input box */}
      <div className="flex flex-col w-7 shrink-0 border-l border-slate-700/80 bg-slate-800/40 select-none">
        <button
          type="button"
          onClick={() => handleStep(effectiveStep)}
          className="flex-1 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/80 active:bg-slate-600 transition-colors border-b border-slate-700/60 cursor-pointer"
          title={`增加 ${effectiveStep} ${unit}`}
          aria-label={`增加 ${effectiveStep} ${unit}`}
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => handleStep(-effectiveStep)}
          className="flex-1 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/80 active:bg-slate-600 transition-colors cursor-pointer"
          title={`减少 ${effectiveStep} ${unit}`}
          aria-label={`减少 ${effectiveStep} ${unit}`}
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
