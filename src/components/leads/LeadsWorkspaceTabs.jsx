'use client';

import { useId, useState } from 'react';
import CreateLeadSection from '@/components/leads/CreateLeadSection';
import LeadsListSection from '@/components/leads/LeadsListSection';
import ManageLeadsSection from '@/components/leads/ManageLeadsSection';

const TAB_DEFS = [
  { id: 'create', label: 'New lead', panel: 'create' },
  { id: 'list', label: 'My leads', panel: 'list' },
  { id: 'manage', label: 'Manage leads', panel: 'manage' },
  { id: 'all', label: 'Overview', panel: 'all' },
];

/**
 * Tabbed workspace: create lead, all leads table, or combined “All” view.
 */
export default function LeadsWorkspaceTabs({
  tableKey = 0,
  onLeadCreated,
  onRefresh,
  readOnly = false,
  listTitle = 'My leads',
  listMineOnly = true,
  defaultTab = 'create',
}) {
  const [active, setActive] = useState(defaultTab);
  const uid = useId().replace(/:/g, '');

  const tabs = readOnly ? TAB_DEFS.filter((t) => t.id !== 'manage') : TAB_DEFS;

  return (
    <div className="lms-leads-tabs">
      <div className="lms-leads-tabs__nav" role="tablist" aria-label="Leads sections">
        {tabs.map((t) => {
          const tabId = `lms-tab-${uid}-${t.id}`;
          const selected = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={tabId}
              className={`lms-leads-tabs__btn ${selected ? 'is-active' : ''}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              aria-controls={`lms-panel-${uid}-${t.panel}`}
              onClick={() => setActive(t.id)}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="lms-leads-tabs__panels">
        {active === 'create' && (
          <div
            role="tabpanel"
            id={`lms-panel-${uid}-create`}
            aria-labelledby={`lms-tab-${uid}-create`}
            className="lms-leads-tabs__panel"
          >
            <CreateLeadSection onCreated={onLeadCreated} />
          </div>
        )}

        {active === 'list' && (
          <div
            role="tabpanel"
            id={`lms-panel-${uid}-list`}
            aria-labelledby={`lms-tab-${uid}-list`}
            className="lms-leads-tabs__panel"
          >
            <LeadsListSection
              title={listTitle}
              readOnly={readOnly}
              onRefresh={onRefresh}
              tableKey={tableKey}
              headingVariant="tab"
              mineOnly={listMineOnly}
            />
          </div>
        )}

        {active === 'manage' && !readOnly && (
          <div
            role="tabpanel"
            id={`lms-panel-${uid}-manage`}
            aria-labelledby={`lms-tab-${uid}-manage`}
            className="lms-leads-tabs__panel"
          >
            <ManageLeadsSection onRefresh={onRefresh} tableKey={tableKey} />
          </div>
        )}

        {active === 'all' && (
          <div
            role="tabpanel"
            id={`lms-panel-${uid}-all`}
            aria-labelledby={`lms-tab-${uid}-all`}
            className="lms-leads-tabs__panel lms-leads-tabs__panel--stack"
          >
            <CreateLeadSection onCreated={onLeadCreated} />
            <LeadsListSection
              title={listTitle}
              readOnly={readOnly}
              onRefresh={onRefresh}
              tableKey={tableKey}
              headingVariant="default"
              mineOnly={listMineOnly}
            />
          </div>
        )}
      </div>
    </div>
  );
}
