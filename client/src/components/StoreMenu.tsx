import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Category } from '../lib/types';

interface Props {
  categories: Category[];
  open: boolean;
  onClose: () => void;
}

/** Side menu opened from the header's "Store" link - lists top-level
 *  categories, each expandable in place to reveal its subcategories. */
export default function StoreMenu({ categories, open, onClose }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  if (!open) return null;

  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: number) => categories.filter((c) => c.parent_id === id);

  return (
    <div className="drawer" onClick={onClose}>
      <aside
        className="drawer__panel drawer__panel--left"
        role="dialog"
        aria-modal="true"
        aria-label="Store categories"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer__head">
          <strong className="stencil" style={{ margin: 0 }}>
            Store
          </strong>
          <button className="btn btn--sm btn--ghost" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="drawer__list">
          <Link className="plate__menu-item" to="/store" onClick={onClose}>
            <strong>All Items</strong>
            <small>The whole floor, newest first</small>
          </Link>

          {topLevel.map((c) => {
            const children = childrenOf(c.id);
            const isOpen = expanded === c.id;

            if (children.length === 0) {
              return (
                <Link key={c.id} className="plate__menu-item" to={`/store/${c.slug}`} onClick={onClose}>
                  <strong>{c.name}</strong>
                  <small>{c.blurb || `${c.product_count ?? 0} in stock`}</small>
                </Link>
              );
            }

            return (
              <div className="store-menu__group" key={c.id}>
                <button
                  type="button"
                  className="plate__menu-item store-menu__toggle"
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : c.id)}
                >
                  <strong>{c.name}</strong>
                  <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="store-menu__children">
                    {children.map((child) => (
                      <Link
                        key={child.id}
                        className="plate__menu-item store-menu__child"
                        to={`/store/${child.slug}`}
                        onClick={onClose}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
