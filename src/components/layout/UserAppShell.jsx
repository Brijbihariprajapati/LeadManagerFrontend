import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useState } from 'react';
import { useAuth } from '@/components/Providers';
import ThemeToggle from '@/components/ThemeToggle';
import { IconGlobe, IconLogOut, IconMenu, IconGauge, IconBriefcase, IconChart } from './icons';

const nav = [
  { href: '/user', label: 'Workspace', icon: IconGauge, desc: 'Summary & leads' },
  { href: '/leads', label: 'My leads', icon: IconBriefcase, desc: 'Your leads only' },
  { href: '/public', label: 'All leads', icon: IconGlobe, desc: "Everyone's leads" },
  { href: '/user/analytics', label: 'Analytics', icon: IconChart, desc: 'Charts & filters' },
];

export default function UserAppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const isActive = (href) => {
    if (href === '/user') {
      return pathname === '/user' || pathname === '/user/';
    }
    return pathname === href || Boolean(pathname?.startsWith(`${href}/`));
  };

  const showCreateLeadBtn =
    (pathname === '/leads' ||
      pathname === '/leads/' ||
      pathname === '/user' ||
      pathname === '/user/') &&
    !pathname?.startsWith('/leads/new');

  return (
    <div className="lms-shell lms-shell--crm d-flex">
      <div
        className={`lms-sidebar-backdrop d-lg-none ${mobileOpen ? 'show' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />

      <aside
        className={`lms-sidebar lms-sidebar--crm lms-sidebar--crm-user ${
          sidebarOpen ? '' : 'is-collapsed'
        } ${mobileOpen ? 'is-mobile-open' : ''}`}
      >
        <div className="lms-sidebar__brand">
          <div className="lms-sidebar__logo lms-sidebar__logo--crm-user">U</div>
          <div className="lms-sidebar__brand-text">
            <span className="lms-sidebar__title">Workspace</span>
            <span className="lms-sidebar__subtitle">Lead operations</span>
          </div>
          <button
            type="button"
            className="lms-sidebar__collapse btn btn-link d-none d-lg-flex"
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? 'Collapse' : 'Expand'}
            aria-label="Toggle sidebar width"
          >
            <IconMenu />
          </button>
        </div>

        <nav className="lms-sidebar__nav flex-grow-1" aria-label="User">
          {nav.map(({ href, label, icon: Icon, desc }) => (
            <Link
              key={href}
              to={href}
              className={`lms-nav-item ${isActive(href) ? 'is-active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="lms-nav-item__icon">
                <Icon />
              </span>
              <span className="lms-nav-item__text">
                <span className="lms-nav-item__label">{label}</span>
                <span className="lms-nav-item__desc">{desc}</span>
              </span>
            </Link>
          ))}
        </nav>

        <div className="lms-sidebar__footer">
          <div className="lms-user-pill lms-user-pill--user">
            <div className="lms-user-pill__avatar lms-user-pill__avatar--user">
              {user?.name?.charAt(0) ?? 'U'}
            </div>
            <div className="lms-user-pill__meta">
              <span className="lms-user-pill__name">{user?.name}</span>
              <span className="lms-user-pill__role">Team member</span>
            </div>
          </div>
          <button type="button" className="btn lms-btn-logout lms-btn-logout--user w-100 mt-2" onClick={handleLogout}>
            <IconLogOut className="me-2 lms-btn-logout__icon" />
            <span className="lms-btn-logout__label">Logout</span>
          </button>
        </div>
      </aside>

      <div className="lms-main lms-main--fill flex-grow-1 d-flex flex-column">
        <header className="lms-topbar lms-topbar--crm d-flex align-items-center gap-2 w-100">
          <button
            type="button"
            className="btn btn-link d-lg-none lms-topbar__menu flex-shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <IconMenu />
          </button>
          <div className="lms-topbar__crumb text-truncate flex-grow-1 min-w-0">
            <span className="text-uppercase small fw-semibold lms-topbar__eyebrow">User workspace</span>
            <h1 className="h5 mb-0 mt-1 lms-topbar__title">{userBreadcrumb(pathname)}</h1>
          </div>
          <ThemeToggle scope="user" />
          {showCreateLeadBtn && (
            <Link to="/leads/new" className="btn btn-primary btn-sm flex-shrink-0">
              Create lead
            </Link>
          )}
        </header>
        <div className="lms-main__content lms-main__content--scroll flex-grow-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function userBreadcrumb(pathname) {
  if (pathname?.startsWith('/user/analytics')) return 'Analytics';
  if (pathname && /^\/leads\/[^/]+\/proposal\/preview$/.test(pathname)) return 'Proposal preview';
  if (pathname?.startsWith('/leads/new')) return 'Create lead';
  if (pathname && /^\/leads\/[^/]+$/.test(pathname)) return 'Lead detail';
  if (pathname?.startsWith('/leads')) return 'My leads';
  if (pathname && /^\/public\/[^/]+$/.test(pathname)) return 'Lead detail';
  if (pathname?.startsWith('/public')) return 'All leads';
  return 'Your dashboard';
}
