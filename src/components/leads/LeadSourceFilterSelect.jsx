'use client';

import { LEAD_SOURCE_OPTIONS } from '@/utils/leadSources';

/** Shared dropdown: filter leads by `source` query param (backend). */
export default function LeadSourceFilterSelect({ value, onChange, id, className = 'form-select' }) {
  return (
    <select
      id={id}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filter by lead source"
    >
      <option value="">All sources</option>
      <option value="__empty__">No source set</option>
      {LEAD_SOURCE_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
