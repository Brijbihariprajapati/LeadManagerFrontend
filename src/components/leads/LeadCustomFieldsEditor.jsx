'use client';

function newFieldId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `cf_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Reusable label + value rows (max 30). Below notes on create + detail.
 * Read-only uses same key / value grid as Contact & ownership (`lms-detail-field`).
 */
export default function LeadCustomFieldsEditor({
  value,
  onChange,
  readOnly = false,
  idPrefix = 'cf',
  compact = false,
  /** When false, skip the inner "Custom fields" line (parent card already has a header). */
  showInnerTitle = true,
}) {
  const rows = Array.isArray(value) ? value : [];

  if (readOnly) {
    if (!rows.length) return null;
    return (
      <div className="lms-custom-fields lms-custom-fields--readonly">
        {showInnerTitle && (
          <p
            className={
              compact ? 'small fw-semibold text-secondary mb-3' : 'lms-form-section mb-3'
            }
          >
            Custom fields
          </p>
        )}
        <div className="lms-custom-fields-kv">
          {rows.map((f) => (
            <div key={f.id} className="lms-detail-field">
              <div className="lms-detail-field__label">{f.label?.trim() || '—'}</div>
              <div className="lms-detail-field__value text-break">{f.value?.trim() ? f.value : '—'}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const addRow = () => {
    if (rows.length >= 30) return;
    onChange([...rows, { id: newFieldId(), label: '', value: '' }]);
  };

  const removeRow = (id) => {
    onChange(rows.filter((r) => r.id !== id));
  };

  const patchRow = (id, field, v) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: v } : r)));
  };

  return (
    <div className="lms-custom-fields">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <p className="lms-form-section mb-0">Custom fields</p>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary rounded-pill"
          onClick={addRow}
          disabled={rows.length >= 30}
        >
          Add field
        </button>
      </div>
      <p className="small text-muted mb-3">
        Optional. Name each field and add a value — they appear on the lead below notes (max 30).
      </p>
      {rows.length === 0 ? (
        <p className="small text-muted fst-italic mb-0">No extra fields yet. Click &quot;Add field&quot; to start.</p>
      ) : (
        <div className="lms-custom-fields-kv lms-custom-fields-kv--edit">
          {rows.map((row, idx) => (
            <div key={row.id} className="lms-detail-field lms-detail-field--custom-edit">
              <div className="lms-detail-field__label">
                <label className="visually-hidden" htmlFor={`${idPrefix}-label-${row.id}`}>
                  Field name {idx + 1}
                </label>
                <input
                  id={`${idPrefix}-label-${row.id}`}
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Field name"
                  value={row.label}
                  onChange={(e) => patchRow(row.id, 'label', e.target.value)}
                  maxLength={120}
                  autoComplete="off"
                />
              </div>
              <div className="lms-detail-field__value">
                <div className="d-flex align-items-center gap-2 w-100 flex-nowrap lms-custom-fields__value-row">
                  <label className="visually-hidden" htmlFor={`${idPrefix}-val-${row.id}`}>
                    Value {idx + 1}
                  </label>
                  <input
                    id={`${idPrefix}-val-${row.id}`}
                    type="text"
                    className="form-control form-control-sm flex-grow-1 min-w-0 lms-custom-fields__value-input"
                    placeholder="Value"
                    value={row.value}
                    onChange={(e) => patchRow(row.id, 'value', e.target.value)}
                    maxLength={2000}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-danger text-decoration-none flex-shrink-0 p-0"
                    onClick={() => removeRow(row.id)}
                    aria-label={`Remove field ${idx + 1}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
