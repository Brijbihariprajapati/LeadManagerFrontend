import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import * as api from '@/services/api';
import PublicLeadsTable from '@/components/public/PublicLeadsTable';
import LeadSourceFilterSelect from '@/components/leads/LeadSourceFilterSelect';
import { useAuth } from '@/components/Providers';
import { safeLeadsArray, safePagination } from '@/lib/apiSafe';
import { pickFilenameFromContentDisposition, triggerBlobDownload } from '@/lib/exportLeadsCsv';
import { INTEREST_OPTIONS, PIPELINE_OPTIONS } from '@/utils/status';

const PAGE_SIZE = 20;

export default function PublicLeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 1,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [interestFilter, setInterestFilter] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [exporting, setExporting] = useState(false);
  const filterRef = useRef({ search: '', interestFilter: '', pipelineFilter: '', sourceFilter: '' });
  const nextPageRef = useRef(1);
  const loadMoreSentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const paginationRef = useRef(pagination);
  const initialLoadingRef = useRef(initialLoading);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);
  useEffect(() => {
    initialLoadingRef.current = initialLoading;
  }, [initialLoading]);

  const hasMore = pagination.pages > 0 && pagination.page < pagination.pages;

  const buildParams = useCallback(
    (pageNum) => ({
      page: pageNum,
      limit: PAGE_SIZE,
      search: search || undefined,
      interest: interestFilter || undefined,
      pipeline: pipelineFilter || undefined,
      source: sourceFilter || undefined,
    }),
    [search, interestFilter, pipelineFilter, sourceFilter]
  );

  const fetchFirstPage = useCallback(async () => {
    setInitialLoading(true);
    nextPageRef.current = 1;
    try {
      const data = await api.getPublicLeads(buildParams(1));
      const list = safeLeadsArray(data);
      setLeads(list);
      const pag = safePagination(data, PAGE_SIZE);
      setPagination(pag);
      paginationRef.current = pag;
      nextPageRef.current = pag.page + 1;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load public data');
      setLeads([]);
    } finally {
      setInitialLoading(false);
    }
  }, [buildParams]);

  const loadMore = useCallback(async () => {
    if (initialLoadingRef.current || loadingMoreRef.current) return;
    const pag = paginationRef.current;
    if (pag.pages <= 0 || pag.page >= pag.pages) return;

    const p = nextPageRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const data = await api.getPublicLeads(buildParams(p));
      const list = safeLeadsArray(data);
      setLeads((prev) => [...prev, ...list]);
      const pag = safePagination(data, PAGE_SIZE);
      setPagination(pag);
      paginationRef.current = pag;
      nextPageRef.current = pag.page + 1;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load public data');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [buildParams]);

  useEffect(() => {
    const prev = filterRef.current;
    const filterChanged =
      prev.search !== search ||
      prev.interestFilter !== interestFilter ||
      prev.pipelineFilter !== pipelineFilter ||
      prev.sourceFilter !== sourceFilter;
    filterRef.current = { search, interestFilter, pipelineFilter, sourceFilter };

    const delay =
      filterChanged && (search || interestFilter || pipelineFilter || sourceFilter) ? 320 : 0;
    const t = setTimeout(() => {
      void fetchFirstPage();
    }, delay);
    return () => clearTimeout(t);
  }, [search, interestFilter, pipelineFilter, sourceFilter, fetchFirstPage]);

  useEffect(() => {
    if (initialLoading) return undefined;
    const el = loadMoreSentinelRef.current;
    if (!el) return undefined;

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (initialLoadingRef.current || loadingMoreRef.current) return;
        const p = paginationRef.current;
        if (p.pages <= 0 || p.page >= p.pages) return;
        void loadMore();
      },
      { root: null, rootMargin: '120px', threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [initialLoading, loadMore, pagination.page, pagination.pages]);

  const exportFullDatabaseCsv = useCallback(async () => {
    setExporting(true);
    try {
      const res = await api.getLeadsFullExport();
      const blob = res.data;
      const fallback = `leads-full-export-${new Date().toISOString().slice(0, 10)}.csv`;
      const cd = res.headers['content-disposition'];
      const filename = pickFilenameFromContentDisposition(cd, fallback);
      triggerBlobDownload(blob, filename);
      toast.success('Full database export downloaded');
    } catch (e) {
      let msg = 'Export failed';
      if (e.response?.data instanceof Blob) {
        try {
          const t = await e.response.data.text();
          const j = JSON.parse(t);
          if (j?.message) msg = j.message;
        } catch {
          /* ignore */
        }
      } else if (e.response?.data?.message) {
        msg = e.response.data.message;
      }
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  }, []);

  return (
    <main className="container-fluid px-3 px-xl-4 lms-page lms-page--public">
      <div className="row g-2 mb-3 align-items-end">
        <div className="col-12 col-md-6 col-xl-4">
          <input
            type="search"
            className="form-control"
            placeholder="Search name, email, phone, source…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="col-12 col-sm-6 col-md-3 col-xl-2">
          <select
            className="form-select"
            value={interestFilter}
            onChange={(e) => setInterestFilter(e.target.value)}
          >
            <option value="">All interest</option>
            {INTEREST_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-md-3 col-xl-2">
          <select
            className="form-select"
            value={pipelineFilter}
            onChange={(e) => setPipelineFilter(e.target.value)}
          >
            <option value="">All pipeline</option>
            {PIPELINE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-md-12 col-xl-4">
          <LeadSourceFilterSelect value={sourceFilter} onChange={setSourceFilter} />
        </div>
        {user?.role === 'admin' && (
          <div className="col-12 col-xl-auto ms-xl-auto">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm w-100 w-xl-auto"
              disabled={exporting}
              title="Download all leads from the database (every saved field) as CSV"
              onClick={() => void exportFullDatabaseCsv()}
            >
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
        )}
      </div>

      <PublicLeadsTable
        leads={leads}
        initialLoading={initialLoading}
        loadingMore={loadingMore}
      />

      <div
        ref={loadMoreSentinelRef}
        className="lms-infinite-sentinel"
        aria-hidden
        style={{ height: 1 }}
      />

      {!initialLoading && leads.length > 0 && (
        <p className="text-muted small mt-2 mb-0">
          Showing {leads.length} of {pagination.total} leads
          {hasMore ? ' · Scroll for more' : ''}
        </p>
      )}
    </main>
  );
}
