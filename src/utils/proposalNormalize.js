/** Optional: session draft key if we ever cache client-side */
export const PROPOSAL_PREVIEW_STORAGE_KEY = 'lms-proposal-preview-draft';

function str(v, fallback = '') {
  return typeof v === 'string' ? v : fallback;
}

function strArr(v) {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

function normalizePhase(p, idx) {
  const o = p && typeof p === 'object' ? p : {};
  const fe = o.frontend && typeof o.frontend === 'object' ? o.frontend : {};
  const be = o.backend && typeof o.backend === 'object' ? o.backend : {};
  return {
    label: str(o.label, `Phase ${idx + 1}`),
    title: str(o.title, ''),
    hours: str(o.hours, '—'),
    frontend: {
      heading: str(fe.heading, 'Frontend'),
      items: strArr(fe.items),
    },
    backend: {
      heading: str(be.heading, 'Backend'),
      items: strArr(be.items),
    },
  };
}

/**
 * Fills missing keys so ProposalDocumentation can render partial / pasted JSON.
 * @param {unknown} raw
 */
export function normalizeProposalDoc(raw) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Proposal data must be a JSON object');
  }
  const o = raw;

  return {
    pdf: {
      fileName:
        str(o.pdf?.fileName, 'Project-Documentation.pdf').trim() ||
        'Project-Documentation.pdf',
    },
    project: {
      title: str(o.project?.title, 'Untitled project'),
      subtitle: str(o.project?.subtitle, ''),
    },
    intro: {
      heading: str(o.intro?.heading, 'Description with Analysis'),
      paragraphs: strArr(o.intro?.paragraphs),
    },
    techStack: {
      heading: str(o.techStack?.heading, 'Tech Stack'),
      tags: strArr(o.techStack?.tags),
    },
    modules: {
      heading: str(o.modules?.heading, 'Modules'),
      items: strArr(o.modules?.items),
    },
    totalHours: {
      value: String(o.totalHours?.value ?? '—'),
      unit: str(o.totalHours?.unit, 'hours'),
      caption: str(o.totalHours?.caption, 'Estimated total project time'),
    },
    requiredCredentials: {
      heading: str(o.requiredCredentials?.heading, 'Required credentials'),
      items: strArr(o.requiredCredentials?.items),
    },
    clientRequirements: {
      heading: str(o.clientRequirements?.heading, 'Client requirements'),
      items: strArr(o.clientRequirements?.items),
    },
    phases: Array.isArray(o.phases) ? o.phases.map((p, i) => normalizePhase(p, i)) : [],
  };
}
