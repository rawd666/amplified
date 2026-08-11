import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import type { Category } from '../lib/types';

export default function Header({ categories }: { categories: Category[] }) {
  const { count, setOpen } = useCart();
  const [menu, setMenu] = useState<'store' | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();
  const nav = useRef<HTMLElement>(null);

  // Any route change closes whatever is hanging open.
  useEffect(() => {
    setMenu(null);
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (nav.current && !nav.current.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  return (
    <header className="plate">
      <div className="shell plate__inner">
        <Link to="/" className="plate__brand">
          <img src="/logo.png" alt="Amplified" className="plate__logo" />
        </Link>

        <nav className="plate__nav" data-open={navOpen} ref={nav} aria-label="Main">
          {/* Store - submenu lists the four product categories */}
          <div
            className="plate__group"
            onMouseEnter={() => setMenu('store')}
            onMouseLeave={() => setMenu(null)}
          >
            <button
              className="plate__link"
              aria-expanded={menu === 'store'}
              aria-current={pathname.startsWith('/store') ? 'page' : undefined}
              onClick={() => setMenu(menu === 'store' ? null : 'store')}
            >
              Store <span aria-hidden="true">▾</span>
            </button>
            {menu === 'store' && (
              <div className="plate__menu">
                <Link className="plate__menu-item" to="/store">
                  <strong>Everything</strong>
                  <small>The whole floor, newest first</small>
                </Link>
                {categories.map((c) => (
                  <Link key={c.id} className="plate__menu-item" to={`/store/${c.slug}`}>
                    <strong>{c.name}</strong>
                    <small>{c.blurb || `${c.product_count ?? 0} in stock`}</small>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <NavLink className="plate__link" to="/gallery">
            Gallery
          </NavLink>

          <NavLink className="plate__link" to="/gear-demos">
            Gear demos
          </NavLink>

          <NavLink className="plate__link" to="/booking">
            Book a try-out
          </NavLink>
        </nav>

        <button
          className="plate__link plate__cart"
          onClick={() => setOpen(true)}
          aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
        >
          Cart
          {count > 0 && <span className="plate__count">{count}</span>}
        </button>

        <button
          className="plate__link plate__burger"
          onClick={() => setNavOpen((v) => !v)}
          aria-expanded={navOpen}
          aria-label="Toggle menu"
        >
          Menu
        </button>
      </div>
    </header>
  );
}
