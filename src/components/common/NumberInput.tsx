import React, { useState, useEffect, useRef } from 'react';

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number | string;
  fallbackValue?: number;
  selectOnFocus?: boolean;
  className?: string;
}

/**
 * NumberInput provides a bulletproof numeric input UX:
 * - Allows clearing the field without immediately reverting to 0 or 1.
 * - Automatically selects the current text on focus so typing a new number replaces the old one (e.g. typing "4" doesn't produce "14").
 * - Validates and clamps bounds on blur.
 */
export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  fallbackValue,
  selectOnFocus = true,
  className = '',
  onFocus,
  onBlur,
  ...rest
}) => {
  const [localText, setLocalText] = useState<string>(
    value !== undefined && value !== null ? String(value) : ''
  );
  const isFocusedRef = useRef<boolean>(false);

  // Synchronize when external value changes and input is not focused
  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalText(value !== undefined && value !== null ? String(value) : '');
    }
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = true;
    if (selectOnFocus) {
      e.target.select();
    }
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalText(raw);

    // If completely empty or just typing a minus or dot, allow user to keep typing
    if (raw === '' || raw === '-' || raw === '.') {
      return;
    }

    const isInteger = typeof step === 'number' ? Number.isInteger(step) : !String(step).includes('.');
    const parsed = isInteger ? parseInt(raw, 10) : parseFloat(raw);

    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = false;
    let parsed = parseFloat(localText);

    if (isNaN(parsed)) {
      parsed = fallbackValue !== undefined ? fallbackValue : (min !== undefined ? min : 0);
    }

    if (min !== undefined && parsed < min) {
      parsed = min;
    }
    if (max !== undefined && parsed > max) {
      parsed = max;
    }

    setLocalText(String(parsed));
    onChange(parsed);

    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <input
      type="number"
      value={localText}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      min={min}
      max={max}
      step={step}
      className={className}
      {...rest}
    />
  );
};
