import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useState } from 'react';
import { useAuth } from '@/components/Providers';
import AdminTeamTopBarActions from '@/components/admin/AdminTeamTopBarActions';
import ThemeToggle from '@/components/ThemeToggle';
import { IconGlobe, IconLogOut, IconMenu, IconGauge, IconUsers, IconChart } from './icons';

const nav = [
  { href: '/admin', label: 'Overview', icon: IconGauge, desc: 'Stats & lead cards' },
  { href: '/admin/analytics', label: 'Analytics', icon: IconChart, desc: 'Charts & filters' },
  { href: '/admin/team', label: 'Team', icon: IconUsers, desc: 'Manage users' },
  { href: '/public', label: 'All leads', icon: IconGlobe, desc: "Everyone's leads" },
];

export default function AdminAppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const isActive = (href) => navItemIsActive(pathname, href);

  return (
    <div className="lms-shell lms-shell--crm d-flex">
      <div
        className={`lms-sidebar-backdrop d-lg-none ${mobileOpen ? 'show' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />

      <aside
        className={`lms-sidebar lms-sidebar--crm lms-sidebar--crm-admin ${
          sidebarOpen ? '' : 'is-collapsed'
        } ${mobileOpen ? 'is-mobile-open' : ''}`}
      >
        <div className="lms-sidebar__brand">
          <div className="lms-sidebar__logo lms-sidebar__logo--crm-admin lms-sidebar__logo--mark">
            <img src="/logo.png" alt="" width={28} height={28} decoding="async" />
          </div>
          <div className="lms-sidebar__brand-text">
            <span className="lms-sidebar__title">Admin</span>
            <span className="lms-sidebar__subtitle">Control center</span>
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

        <nav className="lms-sidebar__nav flex-grow-1" aria-label="Admin">
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
          <div className="lms-user-pill">
            <div className="lms-user-pill__avatar">{user?.name?.charAt(0) ?? 'A'}</div>
            <div className="lms-user-pill__meta">
              <span className="lms-user-pill__name">{user?.name}</span>
              <span className="lms-user-pill__role">Administrator</span>
            </div>
          </div>
          <button type="button" className="btn lms-btn-logout w-100 mt-2" onClick={handleLogout}>
            <IconLogOut className="me-2 lms-btn-logout__icon" />
            <span className="lms-btn-logout__label">Logout</span>
          </button>
        </div>
      </aside>

      <div className="lms-main lms-main--fill flex-grow-1 d-flex flex-column">
        <header className="lms-topbar lms-topbar--crm d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-link d-lg-none lms-topbar__menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <IconMenu />
          </button>
          <div className="lms-topbar__crumb text-truncate flex-grow-1 min-w-0">
            <span className="lms-topbar__eyebrow">Admin workspace</span>
            <h1 className="h5 mb-0 mt-1 lms-topbar__title">{breadcrumbTitle(pathname)}</h1>
          </div>
          <ThemeToggle scope="admin" />
          {pathname === '/admin/team' && (
            <div className="lms-topbar__actions flex-shrink-0">
              <AdminTeamTopBarActions />
            </div>
          )}
        </header>
        <div className="lms-main__content lms-main__content--scroll flex-grow-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function navItemIsActive(pathname, href) {
  if (href === '/admin') {
    return pathname === '/admin' || pathname === '/admin/';
  }
  return pathname === href || Boolean(pathname?.startsWith(`${href}/`));
}

function breadcrumbTitle(pathname) {
  if (pathname?.startsWith('/admin/analytics')) return 'Analytics';
  if (pathname && /^\/leads\/[^/]+$/.test(pathname)) return 'Lead detail';
  if (pathname?.startsWith('/leads')) return 'My leads';
  if (pathname && /^\/public\/[^/]+$/.test(pathname)) return 'Lead detail';
  if (pathname?.startsWith('/public')) return 'All leads';
  if (pathname === '/admin/team' || pathname === '/admin/team/') return 'Team management';
  if (pathname && /^\/admin\/team\/[^/]+$/.test(pathname)) return 'Team member';
  return 'Dashboard';
}
