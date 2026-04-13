'use client';

import Autocomplete from '@/components/ui/Autocomplete';
import { LEAD_SOURCE_OPTIONS } from '@/utils/leadSources';

/** Lead source field — MUI-style autocomplete with presets + free text. */
export default function SourceNameAutocomplete({
  id,
  value,
  onChange,
  className,
  disabled,
  placeholder = 'Type or pick a source',
}) {
  return (
    <Autocomplete
      id={id}
      options={LEAD_SOURCE_OPTIONS}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      inputClassName={className}
      freeSolo
      noOptionsText="No presets match — you can still use this as a custom source"
    />
  );
}
