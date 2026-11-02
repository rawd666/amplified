import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import StoreMenu from './StoreMenu';
import type { Category } from '../lib/types';

export default function Header({ categories }: { categories: Category[] }) {
  const { count, setOpen } = useCart();
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();

  // Any route change closes whatever is hanging open.
  useEffect(() => {
    setStoreMenuOpen(false);
    setNavOpen(false);
  }, [pathname]);

  return (
    <header className="plate">
      <div className="shell plate__inner">
        <Link to="/" className="plate__brand">
          <img src="/logo.png" alt="Amplified" className="plate__logo" />
        </Link>

        <nav className="plate__nav" data-open={navOpen} aria-label="Main">
          <button
            className="plate__link"
            aria-expanded={storeMenuOpen}
            aria-current={pathname.startsWith('/store') ? 'page' : undefined}
            onClick={() => setStoreMenuOpen(true)}
          >
            Store <span aria-hidden="true">▾</span>
          </button>

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

      <StoreMenu categories={categories} open={storeMenuOpen} onClose={() => setStoreMenuOpen(false)} />
    </header>
  );
}
