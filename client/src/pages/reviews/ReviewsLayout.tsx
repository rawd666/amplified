import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/reviews', label: 'All reviews', end: true },
  { to: '/reviews/write', label: 'Write a review', end: false },
];

/** The Reviews section and its submenu. Child routes render into <Outlet />. */
export default function ReviewsLayout() {
  return (
    <div className="shell">
      <div className="section__head" style={{ paddingTop: '3rem', marginBottom: 0 }}>
        <div>
          <p className="stencil">Reviews</p>
          <h1 className="headline headline--lg">Straight from the players</h1>
        </div>
      </div>

      <div className="reviews">
        <nav className="reviews__side" aria-label="Reviews sections">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className="reviews__tab">
              {t.label}
            </NavLink>
          ))}
        </nav>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
