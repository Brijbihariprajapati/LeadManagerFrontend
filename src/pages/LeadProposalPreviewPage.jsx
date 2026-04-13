import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProposalDocumentation from '@/components/proposal/ProposalDocumentation';
import { normalizeProposalDoc } from '@/utils/proposalNormalize';
import * as api from '@/services/api';

function ProposalPreviewInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const autoDownload = searchParams.get('download') === '1';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const proposalDocRef = useRef(null);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getLeadProposal(id);
        if (cancelled) return;
        if (res.success && res.proposal?.data) {
          setData(normalizeProposalDoc(res.proposal.data));
        } else {
          toast.error('No proposal saved for this lead');
          navigate(`/leads/${id}`, { replace: true });
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(e.response?.data?.message || 'Could not load proposal');
          navigate(`/leads/${id}`, { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  if (!id || loading) {
    return (
      <div className="container-fluid px-3 py-5 text-center text-muted">Loading proposal…</div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-vh-100 lms-proposal-preview-page" style={{ background: '#f3f4f6' }}>
      <div
        className="lms-proposal-preview-bar border-bottom bg-white py-2 px-3 d-flex align-items-center justify-content-between gap-2 flex-wrap"
        role="toolbar"
        aria-label="Proposal preview actions"
      >
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Link to={`/leads/${id}`} className="btn btn-sm btn-outline-secondary">
            ← Back to lead
          </Link>
          <span className="badge rounded-pill bg-primary">Preview</span>
        </div>
        <button
          type="button"
          className="needle-doc__download-btn needle-doc__download-btn--toolbar"
          disabled={pdfBusy}
          onClick={() => proposalDocRef.current?.downloadPdf()}
        >
          {pdfBusy ? 'Generating PDF…' : 'Download PDF'}
        </button>
      </div>
      <ProposalDocumentation
        ref={proposalDocRef}
        data={data}
        autoDownload={autoDownload}
        hideInlinePdfButton
        onPdfBusyChange={setPdfBusy}
      />
    </div>
  );
}

export default function LeadProposalPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="container-fluid py-5 text-center text-muted">Loading…</div>
      }
    >
      <ProposalPreviewInner />
    </Suspense>
  );
}
