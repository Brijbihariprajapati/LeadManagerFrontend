/** Styles applied to the cloned DOM for html2canvas (full width, no clip). */
export function applyPdfCloneStyles(clonedDoc, docW) {
  const htmlEl = clonedDoc.documentElement;
  const body = clonedDoc.body;
  htmlEl.style.overflow = 'visible';
  htmlEl.style.height = 'auto';
  body.style.overflow = 'visible';
  body.style.width = `${docW}px`;
  body.style.minWidth = `${docW}px`;
  body.style.margin = '0';
  body.style.background = '#f3f4f6';

  const root = clonedDoc.querySelector('.needle-doc');
  if (root) {
    root.style.boxSizing = 'border-box';
    root.style.width = `${docW}px`;
    root.style.minWidth = `${docW}px`;
    root.style.maxWidth = 'none';
    root.style.overflow = 'visible';
    root.style.height = 'auto';
  }

  clonedDoc.querySelectorAll('.container-fluid').forEach((node) => {
    node.style.maxWidth = 'none';
    node.style.width = '100%';
    node.style.boxSizing = 'border-box';
  });

  const cols = clonedDoc.querySelector('.needle-doc__columns');
  if (cols) {
    cols.style.width = '100%';
    cols.style.maxWidth = 'none';
    cols.style.boxSizing = 'border-box';
  }

  clonedDoc
    .querySelectorAll(
      '.needle-doc__tech-modules-row, .needle-doc__after-phases, .needle-doc__phases, .needle-doc__check-row, .needle-doc__site-footer',
    )
    .forEach((node) => {
      node.style.width = '100%';
      node.style.maxWidth = 'none';
      node.style.boxSizing = 'border-box';
    });

  const topbar = clonedDoc.querySelector('.needle-doc__topbar');
  if (topbar) {
    topbar.style.width = '100%';
    topbar.style.maxWidth = 'none';
  }
}
