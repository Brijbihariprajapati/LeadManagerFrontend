'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { applyPdfCloneStyles } from './pdfExport.js';
import './ProposalDocumentation.css';

/** When phases >= this, switch to stacked layout + phase grid (no empty left column). */
const MANY_PHASES_THRESHOLD = 5;

/** Company brand box is static; all project copy comes from JSON (`data`). */
const ProposalDocumentation = forwardRef(function ProposalDocumentation(
  { data, autoDownload = false, hideInlinePdfButton = false, onPdfBusyChange },
  ref,
) {
  const brandGradId = `g${useId().replace(/:/g, '')}`;
  const manyPhases = data.phases.length >= MANY_PHASES_THRESHOLD;
  const printRootRef = useRef(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const autoRan = useRef(false);

  const pdfFileName = data.pdf?.fileName?.trim() || 'Project-Documentation.pdf';

  const downloadPdf = useCallback(async () => {
    const el = printRootRef.current;
    if (!el || pdfBusy) return;
    setPdfBusy(true);
    const prevScroll = window.scrollY;

    const prevInline = {
      width: el.style.width,
      maxWidth: el.style.maxWidth,
      minWidth: el.style.minWidth,
      overflow: el.style.overflow,
    };

    try {
      window.scrollTo(0, 0);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 80));

      const rect = el.getBoundingClientRect();
      const docW = Math.ceil(Math.max(rect.width, el.offsetWidth, el.scrollWidth, 320));

      el.style.width = `${docW}px`;
      el.style.maxWidth = 'none';
      el.style.minWidth = `${docW}px`;
      el.style.overflow = 'visible';
      void el.offsetHeight;

      const docH = Math.ceil(
        Math.max(el.scrollHeight, el.offsetHeight, document.documentElement.scrollHeight),
      );

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        letterRendering: true,
        logging: false,
        backgroundColor: '#f3f4f6',
        scrollX: 0,
        scrollY: 0,
        windowWidth: docW,
        windowHeight: Math.max(docH + 64, 800),
        foreignObjectRendering: false,
        onclone: (clonedDoc) => applyPdfCloneStyles(clonedDoc, docW),
      });

      const imgData = canvas.toDataURL('image/png');

      const pdfPageWidthMm = 297;
      const pdfPageHeightMm = (canvas.height * pdfPageWidthMm) / canvas.width;

      const pdf = new jsPDF({
        unit: 'mm',
        format: [pdfPageWidthMm, pdfPageHeightMm],
        orientation: 'portrait',
        compress: true,
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfPageWidthMm, pdfPageHeightMm, undefined, 'FAST');

      pdf.save(pdfFileName);
    } catch (err) {
      console.error(err);
    } finally {
      el.style.width = prevInline.width;
      el.style.maxWidth = prevInline.maxWidth;
      el.style.minWidth = prevInline.minWidth;
      el.style.overflow = prevInline.overflow;
      window.scrollTo(0, prevScroll);
      setPdfBusy(false);
    }
  }, [pdfBusy, pdfFileName]);

  useImperativeHandle(ref, () => ({ downloadPdf }), [downloadPdf]);

  useEffect(() => {
    onPdfBusyChange?.(pdfBusy);
  }, [pdfBusy, onPdfBusyChange]);

  useEffect(() => {
    if (!autoDownload || autoRan.current) return;
    autoRan.current = true;
    const t = setTimeout(() => {
      void downloadPdf();
    }, 900);
    return () => clearTimeout(t);
  }, [autoDownload, downloadPdf]);

  return (
    <div className="needle-doc" ref={printRootRef}>
      <div className="needle-doc__topbar-wrap container-fluid">
        <header className="needle-doc__topbar doc-card doc-card--topbar">
          <div className="needle-doc__brand">
            <div className="needle-doc__brand-inner">
              <div className="needle-doc__brand-logo-wrap">
                <img
                  className="needle-doc__brand-logo"
                  src="/logo.png"
                  alt="Codelatent Labs"
                  width={96}
                  height={96}
                  decoding="async"
                />
              </div>
              <div className="needle-doc__brand-text">
                <span className="needle-doc__brand-name">
                  <svg
                    className="needle-doc__brand-svg needle-doc__brand-svg--title"
                    viewBox="0 0 780 80"
                    preserveAspectRatio="xMinYMid meet"
                    role="img"
                    aria-label="Codelatent Labs"
                  >
                    <title>Codelatent Labs</title>
                    <defs>
                      <linearGradient
                        id={`${brandGradId}-title`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#ffc107" />
                        <stop offset="32%" stopColor="#ff9800" />
                        <stop offset="72%" stopColor="#ff007a" />
                        <stop offset="100%" stopColor="#e91e8c" />
                      </linearGradient>
                    </defs>
                    <text
                      x="0"
                      y="60"
                      fill={`url(#${brandGradId}-title)`}
                      fontSize="80"
                      fontWeight="800"
                      fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
                      letterSpacing="-0.03em"
                    >
                      Codelatent Labs
                    </text>
                  </svg>
                </span>
                <span className="needle-doc__brand-slogan">
                  <svg
                    className="needle-doc__brand-svg needle-doc__brand-svg--slogan"
                    viewBox="0 0 720 46"
                    preserveAspectRatio="xMinYMid meet"
                    role="img"
                    aria-label="Engineering Digital Excellence"
                  >
                    <title>Engineering Digital Excellence</title>
                    <defs>
                      <linearGradient
                        id={`${brandGradId}-slogan`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#ffe082" />
                        <stop offset="38%" stopColor="#ff9800" />
                        <stop offset="78%" stopColor="#ff007a" />
                        <stop offset="100%" stopColor="#f48fb1" />
                      </linearGradient>
                    </defs>
                    <text
                      x="5"
                      y="25"
                      fill={`url(#${brandGradId}-slogan)`}
                      fontSize="35"
                      fontWeight="500"
                      fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
                      letterSpacing="0.02em"
                    >
                      Engineering Digital Excellence
                    </text>
                  </svg>
                </span>
              </div>
            </div>
          </div>
          <div className="needle-doc__header-main">
            <h1>{data.project.title}</h1>
            <p className="needle-doc__subtitle">{data.project.subtitle}</p>
          </div>
        </header>
      </div>

      <div className="needle-doc__inner container-fluid">
        <div
          className={
            manyPhases ? 'needle-doc__columns needle-doc__columns--many' : 'needle-doc__columns'
          }
        >
          <div className="needle-doc__col needle-doc__col--left">
            <div className="doc-card doc-card--intro">
              <h2>{data.intro.heading}</h2>
              {data.intro.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="needle-doc__tech-modules-row">
              <div className="doc-card doc-card--tech">
                <h2>{data.techStack.heading}</h2>
                <div className="needle-doc__tags" role="list">
                  {data.techStack.tags.map((tag) => (
                    <span key={tag} className="needle-doc__tag" role="listitem">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="doc-card doc-card--modules">
                <h2>{data.modules.heading}</h2>
                <ul className="needle-doc__module-grid">
                  {data.modules.items.map((name) => (
                    <li key={name} className="needle-doc__module-tile">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="needle-doc__col needle-doc__col--right">
            <div className="needle-doc__phases">
              {data.phases.map((phase, idx) => (
                <section
                  key={`${phase.label}-${phase.title}-${idx}`}
                  className="doc-card doc-card--phase phase"
                >
                  <div className="phase__head">
                    <span className="phase__label">{phase.label}</span>
                    <h2 className="phase__title">{phase.title}</h2>
                    <span className="phase__hours">{phase.hours}</span>
                  </div>
                  <div className="phase__grid">
                    <div className="sub-card sub-card--fe">
                      <h3>{phase.frontend.heading}</h3>
                      <ul>
                        {phase.frontend.items.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="sub-card sub-card--be">
                      <h3>{phase.backend.heading}</h3>
                      <ul>
                        {phase.backend.items.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>

        <div className="needle-doc__after-phases">
          <div className="doc-card doc-card--total">
            <div className="total-stat">
              <span className="total-stat__value">{data.totalHours.value}</span>
              <span className="total-stat__unit">{data.totalHours.unit}</span>
            </div>
            <p className="total-stat__caption">{data.totalHours.caption}</p>
          </div>

          <div className="needle-doc__check-row">
            <div className="doc-card doc-card--check">
              <h2>{data.requiredCredentials.heading}</h2>
              <ul className="needle-doc__checklist">
                {data.requiredCredentials.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="doc-card doc-card--check doc-card--last">
              <h2>{data.clientRequirements.heading}</h2>
              <ul className="needle-doc__checklist needle-doc__checklist--req">
                {data.clientRequirements.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <footer className="needle-doc__site-footer container-fluid">
        <p className="needle-doc__site-footer-text">https://codelatentlabs.com</p>
      </footer>

      {!hideInlinePdfButton && (
        <div className="needle-doc__download-wrap container-fluid" data-html2canvas-ignore="true">
          <button
            type="button"
            className="needle-doc__download-btn"
            onClick={downloadPdf}
            disabled={pdfBusy}
          >
            {pdfBusy ? 'Generating PDF…' : 'Download PDF'}
          </button>
        </div>
      )}
    </div>
  );
});

export default ProposalDocumentation;
