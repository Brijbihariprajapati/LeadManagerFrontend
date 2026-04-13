'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

function filterOptions(options, inputValue) {
  const v = (inputValue ?? '').trim();
  if (!v) return [...options];
  const q = v.toLowerCase();
  return options.filter((o) => String(o).toLowerCase().includes(q));
}

/**
 * MUI-style combobox: typeahead filter, dropdown list, keyboard nav, free text (freeSolo).
 */
export default function Autocomplete({
  options = [],
  value,
  onChange,
  freeSolo = true,
  disabled = false,
  placeholder = '',
  id: idProp,
  className = '',
  inputClassName = '',
  noOptionsText = 'No matches',
}) {
  const uid = useId().replace(/:/g, '');
  const inputId = idProp ?? `lms-autocomplete-${uid}`;
  const listboxId = `${uid}-listbox`;

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const filtered = useMemo(() => filterOptions(options, value), [options, value]);

  const showPanel = open && !disabled;
  const showOptions = filtered.length > 0;
  const showNoOptions = showPanel && !showOptions && (value ?? '').trim() !== '';

  useEffect(() => {
    setHighlighted(0);
  }, [value, filtered.length]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onDocDown = (e) => {
      if (!rootRef.current?.contains(e.target)) close();
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [close]);

  const pick = useCallback(
    (opt) => {
      onChange(opt);
      close();
      inputRef.current?.focus();
    },
    [onChange, close]
  );

  const onKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      else setHighlighted((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) setOpen(true);
      else setHighlighted((h) => Math.max(h - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      if (!open) return;
      e.preventDefault();
      if (showOptions && filtered[highlighted] != null) {
        pick(filtered[highlighted]);
      } else {
        close();
      }
      return;
    }
    if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        close();
      }
    }
  };

  const onInputChange = (e) => {
    onChange(e.target.value);
    setOpen(true);
  };

  const onInputFocus = () => {
    if (!disabled) setOpen(true);
  };

  const onInputBlur = () => {
    window.setTimeout(() => {
      if (!rootRef.current?.contains(document.activeElement)) close();
    }, 120);
  };

  return (
    <div ref={rootRef} className={`lms-autocomplete ${className}`.trim()}>
      <div className={`lms-autocomplete__control${showPanel ? ' is-open' : ''}`}>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          className={`form-control lms-autocomplete__input ${inputClassName}`.trim()}
          value={value ?? ''}
          onChange={onInputChange}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
        />
        <span className="lms-autocomplete__icon" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      {showPanel && (showOptions || showNoOptions) && (
        <div
          id={listboxId}
          role="listbox"
          className="lms-autocomplete__paper border rounded shadow-sm"
        >
          {showOptions &&
            filtered.map((opt, idx) => (
              <div
                key={`${opt}-${idx}`}
                role="option"
                aria-selected={highlighted === idx}
                className={`lms-autocomplete__option px-3 py-2 ${highlighted === idx ? 'is-highlighted' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(opt);
                }}
                onMouseEnter={() => setHighlighted(idx)}
              >
                {opt}
              </div>
            ))}
          {showNoOptions && freeSolo && (
            <div className="lms-autocomplete__empty px-3 py-2 text-muted small">{noOptionsText}</div>
          )}
        </div>
      )}
    </div>
  );
}
