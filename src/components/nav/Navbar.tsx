'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Menu, X, User, ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { backendApi } from '../../lib/backendApi'; 

const AUTH_CHANGED_EVENT = 'delisey-auth-changed';

const publicLinks = [
  { href: '/#menu', label: 'Menu' },
  { href: '/#hours', label: 'Hours' },
  { href: '/#map', label: 'Find Us' },
  { href: '/contact', label: 'Contact' }, 
];


type Me = { email: string; name?: string };

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const [me, setMe] = useState<Me | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // ✅ user menu (desktop)
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const safeNext = (pathname || '/').startsWith('/') ? (pathname || '/') : '/';
  const nextEncoded = useMemo(() => encodeURIComponent(safeNext), [safeNext]);

  async function fetchMe() {
    try {
      const res = await backendApi.get('/auth/me');
      setMe(res.data?.user || null);
    } catch {
      setMe(null);
    } finally {
      setAuthChecked(true);
    }
  }

  // ✅ Fetch on mount + whenever route changes
  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ✅ Also respond to auth change events (login/logout/reset)
  useEffect(() => {
    const handler = () => fetchMe();
    window.addEventListener(AUTH_CHANGED_EVENT, handler);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Close user dropdown on outside click / ESC
  useEffect(() => {
    if (!userMenuOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [userMenuOpen]);

  async function handleLogout() {
    try {
      await backendApi.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      setMe(null);
      setOpen(false);
      setUserMenuOpen(false);
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      router.push('/');
    }
  }

  const navClasses =
    'sticky top-0 inset-x-0 z-50 bg-brown-900/95 border-b border-cream-100/10';

  const linkClasses =
    'px-3 py-2 text-sm font-semibold text-cream-100/90 hover:text-white hover:underline underline-offset-4 rounded ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70';

  const buttonAuthClasses =
    'ml-3 inline-flex items-center gap-2 rounded-lg border border-cream-100/40 px-3 py-2 text-xs font-semibold ' +
    'text-cream-100/90 hover:text-white hover:border-white ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70';

  const orderNowClasses =
    'ml-3 inline-flex items-center rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white ' +
    'hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70';

const dropdownPanelClasses =
  'absolute right-0 mt-2 w-56 rounded-xl border border-cream-100/15 bg-brown-950/95 text-white shadow-xl ' +
  'backdrop-blur-sm overflow-hidden';


const dropdownItemClasses =
  'block w-full text-left px-4 py-2.5 text-sm font-semibold text-cream-100 no-underline ' +
  'hover:text-white hover:bg-white/10 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70';


  const dropdownMetaClasses = 'px-4 py-3 border-b border-cream-100/10';

  return (
    <nav className={navClasses} role="banner">
      <div className="h-16 md:h-20 flex items-center px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/#hero"
          onClick={() => {
            setOpen(false);
            setUserMenuOpen(false);
          }}
          className="mr-auto text-xl md:text-3xl font-black tracking-tight text-white font-display
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded"
        >
          Delisey
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {publicLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => {
                setOpen(false);
                setUserMenuOpen(false);
              }}
              className={linkClasses}
            >
              {l.label}
            </Link>
          ))}

          <Link
            href="/order"
            onClick={() => {
              setOpen(false);
              setUserMenuOpen(false);
            }}
            className={orderNowClasses}
          >
            Order Now
          </Link>

          {/* Auth */}
          {authChecked && me ? (
            <div className="relative ml-3" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className={buttonAuthClasses}
              >
                <User className="h-4 w-4" />
                <span className="max-w-[140px] truncate">
                  {me.name?.trim() || me.email}
                </span>
                <ChevronDown className="h-4 w-4 opacity-80" />
              </button>

              {userMenuOpen && (
                <div className={dropdownPanelClasses} role="menu" aria-label="User menu">
                  <div className={dropdownMetaClasses}>
                    <div className="text-xs font-semibold text-cream-100/70">Signed in as</div>
                    <div className="text-sm font-bold text-white truncate">
                      {me.name?.trim() || me.email}
                    </div>
                    {me.name?.trim() ? (
                      <div className="text-xs text-cream-100/70 truncate">{me.email}</div>
                    ) : null}
                  </div>

<Link
  href="/orders"
  onClick={() => setUserMenuOpen(false)}
  className={`${dropdownItemClasses} text-cream-100`}
  role="menuitem"
>
  My Orders
</Link>


                  <Link
                    href="/change-password"
                    onClick={() => setUserMenuOpen(false)}
                    className={dropdownItemClasses}
                    role="menuitem"
                  >
                    Change Password
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className={dropdownItemClasses}
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={`/login?next=${nextEncoded}`}
              onClick={() => setOpen(false)}
              className={buttonAuthClasses}
            >
              <User className="h-4 w-4" />
              Login / Register
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden ml-2 inline-flex items-center justify-center p-2 rounded-md
                     border border-cream-100/30 text-white
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-cream-100/10 bg-brown-900/95 text-white">
          <div className="px-4 sm:px-6 py-3 flex flex-col">
            {publicLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2 font-semibold text-cream-100/95 hover:text-white"
              >
                {l.label}
              </Link>
            ))}

            <Link
              href="/order"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-center text-white hover:bg-brand-700"
            >
              Order Now
            </Link>

            {authChecked && me ? (
              <>
                <div className="mt-3 rounded-lg border border-cream-100/15 bg-white/5 px-3 py-2">
                  <div className="text-xs font-semibold text-cream-100/70">Signed in as</div>
                  <div className="text-sm font-bold text-white truncate">
                    {me.name?.trim() || me.email}
                  </div>
                  {me.name?.trim() ? (
                    <div className="text-xs text-cream-100/70 truncate">{me.email}</div>
                  ) : null}
                </div>

                <Link
                  href="/orders"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-lg border border-cream-100/40 px-3 py-2 text-xs font-semibold text-center text-cream-100/90 hover:text-white hover:border-white"
                >
                  My Orders
                </Link>

                <Link
                  href="/change-password"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-lg border border-cream-100/40 px-3 py-2 text-xs font-semibold text-center text-cream-100/90 hover:text-white hover:border-white"
                >
                  Change Password
                </Link>

                <button
                  onClick={handleLogout}
                  className="mt-2 rounded-lg border border-cream-100/40 px-3 py-2 text-xs font-semibold text-center text-cream-100/90 hover:text-white hover:border-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href={`/login?next=${nextEncoded}`}
                onClick={() => setOpen(false)}
                className="mt-2 rounded-lg border border-cream-100/40 px-3 py-2 text-xs font-semibold text-center text-cream-100/90 hover:text-white hover:border-white"
              >
                Login / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
