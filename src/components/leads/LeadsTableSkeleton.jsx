'use client';

/** Skeleton rows for leads tables — `cols` = number of `<td>` columns. */
export function LeadsTableSkeletonRows({ rows = 8, cols = 7 }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={`sk-${i}`} className="placeholder-glow" aria-hidden>
          {Array.from({ length: cols }, (_, j) => (
            <td key={j} className={j === 0 ? 'text-center' : ''}>
              <span
                className="placeholder rounded col-12 d-inline-block"
                style={{ height: j === 0 ? 14 : 16, maxWidth: j === 0 ? 28 : '100%' }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
