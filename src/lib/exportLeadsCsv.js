/** Trigger a file download from a Blob (e.g. CSV from GET export endpoint). */
export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Prefer server `Content-Disposition` filename when present. */
export function pickFilenameFromContentDisposition(header, fallback) {
  if (!header || typeof header !== 'string') return fallback;
  const utf8 = /filename\*=UTF-8''([^;\s]+)/i.exec(header);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].replace(/"/g, ''));
    } catch {
      /* fall through */
    }
  }
  const ascii = /filename="([^"]+)"/i.exec(header) || /filename=([^;\s]+)/i.exec(header);
  if (ascii?.[1]) return ascii[1].replace(/"/g, '');
  return fallback;
}
