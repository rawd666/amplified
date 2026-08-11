import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/gallery', label: 'Gallery' },
  { to: '/admin/demos', label: 'Gear demos' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/orders', label: 'Orders & bookings' },
];

export default function AdminLayout() {
  const { admin, signOut } = useAuth();
  const navigate = useNavigate();

  const leave = () => {
    signOut();
    navigate('/admin');
  };

  return (
    <div className="admin">
      <nav className="admin__rail">
        <div className="admin__brand">
          <div className="plate__brand" style={{ marginBottom: '0.75rem' }}>
              <img src="/logo.png" alt="Amplified" className="plate__logo" />
          </div>
        </div>

        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className="admin__tab">
            {t.label}
          </NavLink>
        ))}

        <div className="admin__out">
          <p className="muted" style={{ fontSize: '0.72rem', marginBottom: '0.5rem' }}>
            {admin?.email}
          </p>
          <button className="btn btn--ghost btn--sm" onClick={leave}>
            Sign out
          </button>
        </div>
      </nav>

      <main className="admin__main">
        <Outlet />
      </main>
    </div>
  );
}
