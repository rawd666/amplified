import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const { admin, ready, signIn } = useAuth();
  const location = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (ready && admin) return <Navigate to={location.state?.from ?? '/admin/products'} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin__login">
      <form className="admin__login-card" onSubmit={submit}>
        <span className="lamp" aria-hidden="true" />
        <p className="stencil">Staff only</p>
        <h1 className="headline">Back of the amp</h1>
        <p className="muted" style={{ fontSize: '0.85rem', margin: '0.5rem 0 1.5rem' }}>
          Sign in to manage categories, products, photos, reviews, orders and bookings.
        </p>

        {error && <div className="notice notice--error">{error}</div>}

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="muted" style={{ fontSize: '0.78rem', marginTop: '1.25rem' }}>
          Seeded account: admin@amplified.jo / amplified123 — change it after the first run.{' '}
          <Link to="/">Back to the shop</Link>
        </p>
      </form>
    </div>
  );
}
